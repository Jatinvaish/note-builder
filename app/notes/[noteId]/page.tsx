"use client"

import { useEffect, useState, useCallback } from "react"
import dynamic from "next/dynamic"
import { useRouter, useParams } from "next/navigation"
import { AppHeader } from "@/components/app-header"
import { useToast } from "@/hooks/use-toast"
import { consultationNoteApi } from "@/services/consultation-note-api"
import { templateApi } from "@/services/template-api"

const NoteEditor = dynamic(() => import("@/components/note-editor").then(m => ({ default: m.NoteEditor })), {
  ssr: false,
  loading: () => <div className="flex items-center justify-center h-64 text-sm text-muted-foreground">Loading editor...</div>,
})

const NotePreviewPanel = dynamic(
  () => import("@/components/note-preview-panel").then(m => ({ default: m.NotePreviewPanel })),
  { ssr: false, loading: () => <div className="flex items-center justify-center h-full text-sm text-muted-foreground">Loading preview...</div> }
)

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
  const [editorInstance, setEditorInstance] = useState<any>(null)

  const handleEditorReady = useCallback((editor: any) => {
    setEditorInstance(editor)
  }, [])

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
    <div className="h-screen flex flex-col">
      <AppHeader />
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Preview Panel */}
        <div className="flex-1 min-w-0 border-r">
          <NotePreviewPanel
            editor={editorInstance}
            selectedTemplateId={selectedTemplate?.id?.toString() || ""}
            formData={formData}
            onSave={async () => { await handleSave(editorInstance?.getJSON()) }}
            isEditMode={true}
            admissionId={note.admissionId || 76}
          />
        </div>
        {/* Right: Fields sidebar only */}
        <div className="w-[380px] min-w-[300px] overflow-hidden border-l">
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
            hideEditorContent={true}
            onEditorReady={handleEditorReady}
          />
        </div>
      </div>
    </div>
  )
}
