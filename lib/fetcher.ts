import CryptoJS from "crypto-js"
import FingerprintJS from "@fingerprintjs/fingerprintjs"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000"
const ENCRYPTION_KEY = process.env.NEXT_PUBLIC_ENCRYPTION_KEY || "your-secret-key"

let fingerprintPromise: Promise<string> | null = null

async function getFingerprint(): Promise<string> {
  if (!fingerprintPromise) {
    fingerprintPromise = FingerprintJS.load().then((fp) =>
      fp.get().then((result) => result.visitorId)
    )
  }
  return fingerprintPromise
}

function encrypt(data: string): string {
  return CryptoJS.AES.encrypt(data, ENCRYPTION_KEY).toString()
}

function decrypt(data: string): string {
  const bytes = CryptoJS.AES.decrypt(data, ENCRYPTION_KEY)
  return bytes.toString(CryptoJS.enc.Utf8)
}

function getAuthToken(): string | null {
  if (typeof window === "undefined") return null
  const encrypted = localStorage.getItem("authToken")
  if (!encrypted) return null
  try {
    return decrypt(encrypted)
  } catch {
    return null
  }
}

function setAuthToken(token: string) {
  if (typeof window === "undefined") return
  const encrypted = encrypt(token)
  localStorage.setItem("authToken", encrypted)
}

function clearAuthToken() {
  if (typeof window === "undefined") return
  localStorage.removeItem("authToken")
}

function getUserData(): any {
  if (typeof window === "undefined") return null
  const encrypted = localStorage.getItem("userData")
  if (!encrypted) return null
  try {
    return JSON.parse(decrypt(encrypted))
  } catch {
    return null
  }
}

function setUserData(data: any) {
  if (typeof window === "undefined") return
  const encrypted = encrypt(JSON.stringify(data))
  localStorage.setItem("userData", encrypted)
}

function clearUserData() {
  if (typeof window === "undefined") return
  localStorage.removeItem("userData")
}

interface FetcherOptions {
  path: string
  method?: "GET" | "POST" | "PUT" | "DELETE"
}

interface FetcherConfig {
  json?: any
  headers?: Record<string, string>
}

export async function fetcher(
  options: FetcherOptions,
  config: FetcherConfig = {}
): Promise<any> {
  const { path, method = "POST" } = options
  const { json, headers = {} } = config

  const fingerprint = await getFingerprint()
  const token = getAuthToken()

  const requestHeaders: Record<string, string> = {
    "Content-Type": "application/json",
    "X-Fingerprint": fingerprint,
    ...headers,
  }

  if (token) {
    requestHeaders["Authorization"] = `Bearer ${token}`
  }

  const body = json ? JSON.stringify(json) : undefined

  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers: requestHeaders,
      body,
      credentials: "include",
    })

    const data = await response.json()

    if (!response.ok) {
      if (response.status === 401) {
        clearAuthToken()
        clearUserData()
        if (typeof window !== "undefined") {
          window.location.href = "/sign-in"
        }
      }
      throw new Error(data.message || "Request failed")
    }

    return data
  } catch (error) {
    console.error("Fetcher error:", error)
    throw error
  }
}

export { getAuthToken, setAuthToken, clearAuthToken, getUserData, setUserData, clearUserData, encrypt, decrypt }
