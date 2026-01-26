"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { NoteEditor } from "@/components/note-editor"
import { AppHeader } from "@/components/app-header"
import { useToast } from "@/hooks/use-toast"
import { consultationNoteApi } from "@/services/consultation-note-api"
import { templateApi } from "@/services/template-api"

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
    const loadData = async () => {
      try {
        const templatesData = await templateApi.listActive()
        setTemplates(Array.isArray(templatesData) ? templatesData : [])

        if (noteId) {
          const foundNote = await consultationNoteApi.view(Number(noteId))
          if (foundNote) {
            setNote(foundNote)
            setFormData(foundNote.consultationData || {})
            setNoteContent(foundNote.noteContent || null)

            const template = templatesData.find((t: any) => t.id === foundNote.templateId)
            if (template) {
              setSelectedTemplate(template)
            }
          }
        }
      } catch (error) {
        toast({ title: "Error", description: "Failed to load note data", variant: "destructive" })
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [noteId, toast])

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

  const handleSave = async (editorContent: any) => {
    if (!note || !selectedTemplate) {
      toast({ title: "Error", description: "Note not found", variant: "destructive" })
      return
    }

    try {
      const payload = {
        id: Number(noteId),
        templateId: selectedTemplate.id,
        consultationType: note.consultationType || "ipd",
        admissionId: note.admissionId,
        appointmentId: note.appointmentId,
        noteContent: editorContent,
        formData: formData,
        status: "active",
      }

      await consultationNoteApi.save(payload)
      toast({ title: "Success", description: "Note updated successfully" })
      router.push("/notes")
    } catch (error) {
      toast({ title: "Error", description: "Failed to update note", variant: "destructive" })
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
