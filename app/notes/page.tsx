"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { getNotes, inactivateNote } from "@/lib/note-storage"
import { Button } from "@/components/ui/button"
import { Plus, Edit, Trash2, FileText } from "lucide-react"

export default function NotesPage() {
  const [notes, setNotes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setNotes(getNotes().filter((n: any) => n.isActive !== false))
    setLoading(false)
  }, [])

  const handleInactivate = (noteId: string) => {
    if (confirm("Are you sure you want to delete this note? (It will be marked as inactive)")) {
      inactivateNote(noteId)
      setNotes(getNotes().filter((n: any) => n.isActive !== false))
    }
  }

  if (loading) return <div className="p-4">Loading...</div>

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Consultation Notes</h1>
            <p className="text-sm text-muted-foreground mt-1">View and manage consultation notes</p>
          </div>
          <Link href="/notes/create">
            <Button size="lg" className="gap-2">
              <Plus className="w-4 h-4" />
              New Note
            </Button>
          </Link>
        </div>

        {/* Notes List */}
        {notes.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
            <p className="text-muted-foreground mb-4">No notes yet. Create one to get started.</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {notes.map((note) => {
              const versionCount = note.versionHistory?.length || 0
              const createdDate = new Date(note.createdAt).toLocaleDateString()
              const updatedDate = new Date(note.updatedAt).toLocaleDateString()

              return (
                <div key={note.id} className="border border-border rounded-lg p-4 hover:bg-accent transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-foreground">{note.templateName}</h3>
                      <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                        <span>Created: {createdDate}</span>
                        <span>Updated: {updatedDate}</span>
                        <span>Versions: {versionCount}</span>
                      </div>
                    </div>
                    <div className="flex gap-2 ml-4">
                      <Link href={`/notes/${note.id}`}>
                        <Button size="sm" variant="outline" className="gap-1 bg-transparent">
                          <Edit className="w-4 h-4" />
                          Edit
                        </Button>
                      </Link>
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-1 text-destructive hover:text-destructive bg-transparent"
                        onClick={() => handleInactivate(note.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                        Delete
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
  )
}
