"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { NoteEditor } from "@/components/note-editor"
import { AppHeader } from "@/components/app-header"
import { useToast } from "@/hooks/use-toast"

export default function EditNotePage() {
  const router = useRouter()
  const params = useParams()
  const { toast } = useToast()
  const noteId = params.noteId as string
  const [templates, setTemplates] = useState<any[]>([])
  const [note, setNote] = useState<any>(null)
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null)
  const [formData, setFormData] = useState<Record<string, any>>({})
  const [noteContent, setNoteContent] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const storedTemplates = localStorage.getItem("templates")
    if (storedTemplates) {
      const parsed = JSON.parse(storedTemplates)
      setTemplates(Array.isArray(parsed) ? parsed : [])
    }

    if (noteId) {
      const notes = JSON.parse(localStorage.getItem("notes") || "[]")
      const foundNote = notes.find((n: any) => n.id === noteId)
      if (foundNote) {
        setNote(foundNote)
        setFormData(foundNote.consultationData || {})
        setNoteContent(foundNote.noteContent || null)
        
        const storedTemplates = localStorage.getItem("templates")
        if (storedTemplates) {
          const parsed = JSON.parse(storedTemplates)
          const template = parsed.find((t: any) => t.id === foundNote.templateId)
          if (template) {
            setSelectedTemplate(template)
          }
        }
      }
    }
    setLoading(false)
  }, [noteId])

  const handleTemplateSelect = (templateId: string) => {
    const template = templates.find((t) => t.id === templateId)
    setSelectedTemplate(template || null)
  }

  const handleDataChange = (key: string, value: any) => {
    setFormData((prev) => ({ ...prev, [key]: value }))
  }

  const handleVersionRestore = (version: any) => {
    setFormData(version.data)
    setNoteContent(version.noteContent)
  }

  const handleSave = (editorContent: any) => {
    if (!note || !selectedTemplate) {
      toast({ title: "Error", description: "Note not found", variant: "destructive" })
      return
    }

    const notes = JSON.parse(localStorage.getItem("notes") || "[]")
    const noteIndex = notes.findIndex((n: any) => n.id === noteId)
    
    if (noteIndex !== -1) {
      const currentVersion = notes[noteIndex].versionHistory?.length || 0
      notes[noteIndex] = {
        ...notes[noteIndex],
        consultationData: formData,
        noteContent: editorContent,
        updatedAt: new Date().toISOString(),
        versionHistory: [
          ...(notes[noteIndex].versionHistory || []),
          {
            version: currentVersion + 1,
            timestamp: new Date().toISOString(),
            data: formData,
            noteContent: editorContent,
          },
        ],
      }
      localStorage.setItem("notes", JSON.stringify(notes))
      toast({ title: "Success", description: "Note updated successfully" })
      router.push("/notes")
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Loading...</p>
      </div>
    )
  }

  if (!note || !selectedTemplate) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-2">
        <p className="text-gray-500">Note not found</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col">
      <AppHeader />
      <div className="flex-1">
        <NoteEditor
          templates={templates}
          selectedTemplate={selectedTemplate}
          formData={formData}
          onTemplateSelect={handleTemplateSelect}
          onDataChange={handleDataChange}
          onSave={handleSave}
          versionHistory={note.versionHistory || []}
          onVersionRestore={handleVersionRestore}
          isEditMode={true}
          initialContent={noteContent}
        />
      </div>
    </div>
  )
}
