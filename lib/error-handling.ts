/**
 * Error Handling & Edge Cases (PR-10)
 * 
 * Centralized error handling for bindings, offline scenarios, and legacy data
 */

export enum ErrorType {
  API_FAILURE = "API_FAILURE",
  OFFLINE = "OFFLINE",
  TIMEOUT = "TIMEOUT",
  MISSING_GROUP = "MISSING_GROUP",
  INVALID_BINDING = "INVALID_BINDING",
  SPEECH_NOT_SUPPORTED = "SPEECH_NOT_SUPPORTED",
  SPEECH_PERMISSION_DENIED = "SPEECH_PERMISSION_DENIED",
  LEGACY_TEMPLATE = "LEGACY_TEMPLATE",
}

export class AppError extends Error {
  constructor(
    public type: ErrorType,
    public message: string,
    public context?: Record<string, any>
  ) {
    super(message)
    this.name = "AppError"
  }
}

/**
 * Safe API call with timeout and offline detection
 */
export async function safeApiCall<T>(
  url: string,
  options?: RequestInit,
  timeoutMs: number = 5000
): Promise<T | null> {
  try {
    // Check if online
    if (!navigator.onLine) {
      console.warn("[v0] Offline: using fallback for", url)
      return null
    }

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs)

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      })

      if (!response.ok) {
        throw new AppError(
          ErrorType.API_FAILURE,
          `API call failed: ${response.status}`,
          { url, status: response.status }
        )
      }

      const data = await response.json()
      return data as T
    } finally {
      clearTimeout(timeoutId)
    }
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      console.warn("[v0] API timeout:", url)
      return null
    }

    if (error instanceof AppError) {
      throw error
    }

    console.error("[v0] API call error:", error)
    return null
  }
}

/**
 * Validates group references in template
 */
export function validateGroupReferences(
  groupIds: Set<string | null>,
  availableGroups: string[]
): { valid: boolean; missingGroups: string[] } {
  const groupSet = new Set(availableGroups)
  const missing: string[] = []

  groupIds.forEach((groupId) => {
    if (groupId && !groupSet.has(groupId)) {
      missing.push(groupId)
    }
  })

  return {
    valid: missing.length === 0,
    missingGroups: missing,
  }
}

// Declare SpeechRecognitionConstructor and SpeechRecognitionError
declare var SpeechRecognitionConstructor: any
declare var SpeechRecognitionError: any

/**
 * Safe speech recognition setup
 */
export function getSpeechRecognitionAPI(): SpeechRecognitionConstructor | null {
  const SpeechRecognition =
    (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition

  if (!SpeechRecognition) {
    console.warn("[v0] Speech Recognition not supported in this browser")
    return null
  }

  return SpeechRecognition
}

/**
 * Handle speech recognition errors gracefully
 */
export function handleSpeechError(error: SpeechRecognitionError): {
  shouldRetry: boolean
  message: string
  errorType: ErrorType
} {
  const errorMap: Record<string, { shouldRetry: boolean; message: string; type: ErrorType }> = {
    "no-speech": {
      shouldRetry: true,
      message: "No speech detected. Please try again.",
      type: ErrorType.SPEECH_NOT_SUPPORTED,
    },
    "audio-capture": {
      shouldRetry: true,
      message: "No microphone found. Please check your audio input device.",
      type: ErrorType.SPEECH_NOT_SUPPORTED,
    },
    "permission-denied": {
      shouldRetry: false,
      message: "Microphone permission denied. Please enable it in browser settings.",
      type: ErrorType.SPEECH_PERMISSION_DENIED,
    },
    "network": {
      shouldRetry: true,
      message: "Network error during speech recognition. Please try again.",
      type: ErrorType.API_FAILURE,
    },
    "service-not-allowed": {
      shouldRetry: false,
      message: "Speech recognition service not available.",
      type: ErrorType.SPEECH_NOT_SUPPORTED,
    },
  }

  const handler = errorMap[error.error] || {
    shouldRetry: true,
    message: "Speech recognition failed. Please try again.",
    type: ErrorType.SPEECH_NOT_SUPPORTED,
  }

  return handler
}

/**
 * Migrate legacy template data safely
 */
export function migrateTemplateIfNeeded(template: any): any {
  const migrated = { ...template }

  // Add missing new properties with safe defaults
  if (!migrated.status) {
    migrated.status = "active"
  }

  if (!migrated.groups) {
    migrated.groups = []
  }

  // Normalize all content nodes to have required fields
  if (migrated.templateContent?.content) {
    normalizeContentForMigration(migrated.templateContent.content)
  }

  return migrated
}

/**
 * Recursively normalize content nodes during migration
 */
function normalizeContentForMigration(nodes: any[]): void {
  if (!Array.isArray(nodes)) return

  nodes.forEach((node) => {
    if (node.type === "formElement" && node.attrs) {
      // Ensure all required properties exist
      if (!node.attrs.label) {
        node.attrs.label = node.attrs.elementKey || "Untitled Field"
      }
      if (!node.attrs.elementType) {
        node.attrs.elementType = "input"
      }
      if (node.attrs.group_id === undefined) {
        node.attrs.group_id = null
      }
      if (node.attrs.data_binding === undefined) {
        node.attrs.data_binding = null
      }
    }

    if (Array.isArray(node.content)) {
      normalizeContentForMigration(node.content)
    }
  })
}

/**
 * Loading state for slow API calls
 */
export class LoadingState {
  private timeout: NodeJS.Timeout | null = null
  private startTime: number = 0
  private isTimedOut = false

  start(timeoutMs: number = 2000): void {
    this.startTime = Date.now()
    this.isTimedOut = false

    this.timeout = setTimeout(() => {
      this.isTimedOut = true
      console.warn("[v0] API call timeout, using fallback")
    }, timeoutMs)
  }

  cancel(): void {
    if (this.timeout) {
      clearTimeout(this.timeout)
      this.timeout = null
    }
    this.isTimedOut = false
  }

  isLoading(): boolean {
    return this.timeout !== null && !this.isTimedOut
  }

  didTimeout(): boolean {
    return this.isTimedOut
  }

  getElapsedMs(): number {
    return Date.now() - this.startTime
  }
}

/**
 * Validation for large datasets (migration safety)
 */
export function validateDatasetSize(data: any[], maxSize: number = 10000): boolean {
  if (Array.isArray(data) && data.length > maxSize) {
    console.warn(`[v0] Dataset size (${data.length}) exceeds recommended maximum (${maxSize})`)
    return false
  }
  return true
}

/**
 * Safe JSON parsing with fallback
 */
export function safeParse<T>(json: string, fallback: T): T {
  try {
    return JSON.parse(json) as T
  } catch (error) {
    console.error("[v0] JSON parse error:", error)
    return fallback
  }
}
