import type { ConsultationNote, VersionEntry } from "@/lib/types"

export const CONSULTATIONS_KEY = "consultations"

export function getConsultations() {
  if (typeof window === "undefined") return []
  const stored = localStorage.getItem(CONSULTATIONS_KEY)
  return stored ? JSON.parse(stored) : []
}

export function saveConsultation(consultation: ConsultationNote) {
  if (typeof window === "undefined") return consultation
  const consultations = getConsultations()
  const index = consultations.findIndex((c: ConsultationNote) => c.id === consultation.id)

  if (index >= 0) {
    consultations[index] = consultation
  } else {
    consultations.push(consultation)
  }

  localStorage.setItem(CONSULTATIONS_KEY, JSON.stringify(consultations))
  return consultation
}

export function getConsultation(consultationId: string) {
  if (typeof window === "undefined") return null
  const consultations = getConsultations()
  return consultations.find((c: ConsultationNote) => c.id === consultationId) || null
}

export function deleteConsultation(consultationId: string) {
  if (typeof window === "undefined") return
  const consultations = getConsultations()
  const filtered = consultations.filter((c: ConsultationNote) => c.id !== consultationId)
  localStorage.setItem(CONSULTATIONS_KEY, JSON.stringify(filtered))
}

export function addVersionEntry(consultationId: string, data: Record<string, any>, changedFields?: string[]) {
  const consultation = getConsultation(consultationId)
  if (!consultation) return null

  const newVersion = (consultation.versionHistory || []).length + 1
  const versionEntry: VersionEntry = {
    version: newVersion,
    timestamp: new Date().toISOString(),
    data,
    changedFields,
  }

  if (!consultation.versionHistory) {
    consultation.versionHistory = []
  }

  consultation.versionHistory.push(versionEntry)
  consultation.consultationData = data
  consultation.updatedAt = new Date().toISOString()

  return saveConsultation(consultation)
}

export function getVersion(consultationId: string, version: number) {
  const consultation = getConsultation(consultationId)
  if (!consultation) return null

  const versionEntry = consultation.versionHistory?.find((v) => v.version === version)
  return versionEntry ? versionEntry.data : null
}
