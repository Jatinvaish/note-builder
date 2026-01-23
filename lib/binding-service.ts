/**
 * Data Binding Service (PR-2)
 * 
 * Resolves data bindings from manual values or API sources.
 * Provides safe fallback handling and mock implementations.
 */

import type { DataBinding } from './types'

export interface ClinicalContext {
  appointmentDate?: string
  admissionDate?: string
  patientId?: string
  clinicianId?: string
  [key: string]: any
}

/**
 * Clinical Context Service - fetches appointment/admission data
 * Currently uses mock data; ready to switch to real endpoints
 */
export class ClinicalContextService {
  private mockMode = true // Switch to false when APIs are ready

  async fetchClinicalContext(contextType: string): Promise<ClinicalContext> {
    if (this.mockMode) {
      return this.getMockContext(contextType)
    }

    // Real API call would go here
    try {
      const response = await fetch(`/api/clinical-context/${contextType}`)
      if (!response.ok) throw new Error('Failed to fetch context')
      return response.json()
    } catch (error) {
      console.error('[v0] Clinical context fetch failed:', error)
      return this.getMockContext(contextType)
    }
  }

  private getMockContext(contextType: string): ClinicalContext {
    const now = new Date()
    const mockData: Record<string, ClinicalContext> = {
      appointment: {
        appointmentDate: now.toISOString(),
        clinicianId: 'doc-001',
        patientId: 'pat-001',
      },
      admission: {
        admissionDate: new Date(now.getTime() - 86400000).toISOString(), // Yesterday
        patientId: 'pat-001',
        clinicianId: 'doc-001',
      },
    }
    return mockData[contextType] || {}
  }

  setMockMode(enabled: boolean) {
    this.mockMode = enabled
  }
}

/**
 * Data Binding Resolver - resolves a single binding to a value
 */
export class BindingResolver {
  private contextService = new ClinicalContextService()

  async resolveBinding(binding: DataBinding | null | undefined, context?: ClinicalContext): Promise<string> {
    if (!binding) return ''

    if (binding.type === 'manual') {
      return binding.fallbackValue || ''
    }

    if (binding.type === 'api') {
      return this.resolveApiBinding(binding, context)
    }

    return binding.fallbackValue || ''
  }

  private async resolveApiBinding(binding: DataBinding, context?: ClinicalContext): Promise<string> {
    try {
      // If source is provided (e.g., "appointment.date"), resolve from context
      if (binding.source) {
        const value = this.resolveSourcePath(binding.source, context)
        if (value) return value
      }

      // If apiEndpoint is provided, fetch from API
      if (binding.apiEndpoint) {
        const response = await fetch(binding.apiEndpoint)
        if (!response.ok) throw new Error('API call failed')
        const data = await response.json()
        return data.value || data.toString() || binding.fallbackValue || ''
      }

      return binding.fallbackValue || ''
    } catch (error) {
      console.error('[v0] Binding resolution error:', error)
      return binding.fallbackValue || ''
    }
  }

  private resolveSourcePath(path: string, context?: ClinicalContext): string {
    if (!context) return ''

    const parts = path.split('.')
    let value: any = context

    for (const part of parts) {
      if (value && typeof value === 'object' && part in value) {
        value = value[part]
      } else {
        return ''
      }
    }

    return typeof value === 'string' ? value : JSON.stringify(value)
  }

  setMockMode(enabled: boolean) {
    this.contextService.setMockMode(enabled)
  }
}

/**
 * Global instance for use throughout the application
 */
let globalResolver: BindingResolver | null = null

export function getBindingResolver(): BindingResolver {
  if (!globalResolver) {
    globalResolver = new BindingResolver()
  }
  return globalResolver
}

export function resetBindingResolver() {
  globalResolver = null
}
