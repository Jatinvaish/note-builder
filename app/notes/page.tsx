"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { getNotes, inactivateNote } from "@/lib/note-storage"
import { Button } from "@/components/ui/button"
import { Plus, Edit, Trash2, FileText } from "lucide-react"
import { formatDateTime } from "@/lib/date-utils"
import { AppHeader } from "@/components/app-header"

export default function NotesPage() {
  const [notes, setNotes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setNotes(getNotes().filter((n: any) => n.isActive !== false))
    setLoading(false)
  }, [])

  const handleInactivate = (noteId: string) => {
    if (confirm("Are you sure you want to delete this note?")) {
      inactivateNote(noteId)
      setNotes(getNotes().filter((n: any) => n.isActive !== false))
    }
  }

  if (loading) return <div className="p-2 text-xs">Loading...</div>

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <div className="p-3">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h1 className="text-lg font-semibold">Consultation Notes</h1>
              <p className="text-[10px] text-muted-foreground mt-0.5">View and manage notes</p>
            </div>
            <Link href="/notes/create">
              <Button size="sm" className="gap-1 h-7 text-xs px-2">
                <Plus className="w-3 h-3" />New Note
              </Button>
            </Link>
          </div>
          {notes.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="w-8 h-8 text-muted-foreground mx-auto mb-2 opacity-50" />
              <p className="text-xs text-muted-foreground">No notes yet</p>
            </div>
          ) : (
            <div className="grid gap-2">
              {notes.map((note) => {
                const versionCount = note.versionHistory?.length || 0
                const createdDate = formatDateTime(note.createdAt)
                const updatedDate = formatDateTime(note.updatedAt)
                return (
                  <div key={note.id} className="border rounded p-2 hover:bg-accent transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="text-sm font-medium">{note.templateName}</h3>
                        <div className="flex gap-3 mt-1 text-[10px] text-muted-foreground">
                          <span>Created: {createdDate}</span>
                          <span>Updated: {updatedDate}</span>
                          <span>Versions: {versionCount}</span>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <Link href={`/notes/${note.id}`}>
                          <Button size="sm" variant="outline" className="gap-1 h-6 text-[10px] px-2">
                            <Edit className="w-3 h-3" />Edit
                          </Button>
                        </Link>
                        <Button size="sm" variant="outline" className="gap-1 h-6 text-[10px] px-2 text-destructive hover:text-destructive" onClick={() => handleInactivate(note.id)}>
                          <Trash2 className="w-3 h-3" />Delete
                        </Button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
