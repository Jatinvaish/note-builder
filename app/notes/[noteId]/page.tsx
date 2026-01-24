"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import Link from "next/link"
import { getNote, addNoteVersion } from "@/lib/note-storage"
import { getTemplate } from "@/lib/template-storage"
import { NoteEditor } from "@/components/note-editor"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Save } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import type { Template } from "@/lib/types"

export default function EditNotePage() {
  const router = useRouter()
  const params = useParams()
  const noteId = params.noteId as string
  const [note, setNote] = useState<any>(null)
  const [template, setTemplate] = useState<Template | null>(null)
  const [formData, setFormData] = useState<Record<string, any>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (noteId) {
      const n = getNote(noteId)
      if (n) {
        setNote(n)
        setFormData(n.consultationData)
        const t = getTemplate(n.templateId)
        if (t) {
          setTemplate(t)
        }
      }
      setLoading(false)
    }
  }, [noteId])

  const handleDataChange = (key: string, value: any) => {
    setFormData((prev) => ({ ...prev, [key]: value }))
  }

  const handleVersionRestore = (version: any) => {
    setFormData(version.data)
  }

  const handleSave = () => {
    if (!note || !template) {
      toast({ title: "Error", description: "Note not found", variant: "destructive" })
      return
    }

    const updatedNote = addNoteVersion(noteId, formData)
    if (updatedNote) {
      toast({ title: "Success", description: "Note updated successfully" })
      router.push("/notes")
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    )
  }

  if (!note || !template) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-2">
        <p className="text-muted-foreground">Note not found</p>
        <Link href="/notes">
          <Button variant="outline" size="sm" className="gap-1">
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="border-b bg-card p-3">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-2">
            <Link href="/notes">
              <Button variant="outline" size="sm" className="gap-1">
                <ArrowLeft className="w-4 h-4" />
                Back
              </Button>
            </Link>
            <h1 className="text-lg font-semibold">{template.templateName}</h1>
          </div>
          <Button onClick={handleSave} size="sm" className="gap-1">
            <Save className="w-4 h-4" />
            Update
          </Button>
        </div>
      </div>

      <div className="flex-1">
        <NoteEditor
          template={template}
          formData={formData}
          onDataChange={handleDataChange}
          onSave={handleSave}
          versionHistory={note.versionHistory || []}
          onVersionRestore={handleVersionRestore}
        />
      </div>
    </div>
  )
}
