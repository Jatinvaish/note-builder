import type { ConsultationNote, VersionEntry } from "@/lib/types"

export const NOTES_KEY = "notes"

export function getNotes() {
  if (typeof window === "undefined") return []
  const stored = localStorage.getItem(NOTES_KEY)
  return stored ? JSON.parse(stored) : []
}

export function saveNote(note: ConsultationNote) {
  if (typeof window === "undefined") return note
  const notes = getNotes()
  const index = notes.findIndex((n: ConsultationNote) => n.id === note.id)

  if (index >= 0) {
    notes[index] = note
  } else {
    notes.push(note)
  }

  localStorage.setItem(NOTES_KEY, JSON.stringify(notes))
  return note
}

export function getNote(noteId: string) {
  if (typeof window === "undefined") return null
  const notes = getNotes()
  return notes.find((n: ConsultationNote) => n.id === noteId) || null
}

export function deleteNote(noteId: string) {
  if (typeof window === "undefined") return
  const notes = getNotes()
  const filtered = notes.filter((n: ConsultationNote) => n.id !== noteId)
  localStorage.setItem(NOTES_KEY, JSON.stringify(filtered))
}

export function addNoteVersion(noteId: string, data: Record<string, any>, changedFields?: string[]) {
  const note = getNote(noteId)
  if (!note) return null

  if (!note.versionHistory) {
    note.versionHistory = []
  }

  const contentChanged = JSON.stringify(note.consultationData) !== JSON.stringify(data)
  
  if (contentChanged) {
    const newVersion = note.versionHistory.length + 1
    const versionEntry: VersionEntry = {
      version: newVersion,
      timestamp: new Date().toISOString(),
      data,
      changedFields,
    }
    note.versionHistory.push(versionEntry)
  }

  note.consultationData = data
  note.updatedAt = new Date().toISOString()

  return saveNote(note)
}

export function getNoteVersion(noteId: string, version: number) {
  const note = getNote(noteId)
  if (!note) return null

  const versionEntry = note.versionHistory?.find((v:any) => v.version === version)
  return versionEntry ? versionEntry.data : null
}

export function inactivateNote(noteId: string) {
  const note = getNote(noteId)
  if (!note) return null
  note.isActive = false
  return saveNote(note)
}
