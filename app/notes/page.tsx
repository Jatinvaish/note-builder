"use client"

import { useState, useEffect, useCallback } from "react"
import dynamic from "next/dynamic"
import Link from "next/link"
import { consultationNoteApi } from "@/services/consultation-note-api"
import { templateApi } from "@/services/template-api"
import { Button } from "@/components/ui/button"
import { Plus, Edit, Trash2, FileText, Eye } from "lucide-react"
import { formatDateTime } from "@/lib/date-utils"
import { AppHeader } from "@/components/app-header"
import { useToast } from "@/hooks/use-toast"

const NotePreviewPanel = dynamic(
  () => import("@/components/note-preview-panel").then(m => ({ default: m.NotePreviewPanel })),
  { ssr: false, loading: () => <div className="flex items-center justify-center h-full text-sm text-muted-foreground">Loading preview...</div> }
)

const NoteEditor = dynamic(
  () => import("@/components/note-editor").then(m => ({ default: m.NoteEditor })),
  { ssr: false, loading: () => <div className="flex items-center justify-center h-64 text-sm text-muted-foreground">Loading editor...</div> }
)

export default function NotesPage() {
  const { toast } = useToast()
  const [viewMode, setViewMode] = useState<"list" | "workspace">("list")
  const [notes, setNotes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // Workspace state
  const [templates, setTemplates] = useState<any[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null)
  const [formData, setFormData] = useState<Record<string, any>>({})
  const [noteContent, setNoteContent] = useState<any>(null)
  const [editingNoteId, setEditingNoteId] = useState<number | null>(null)
  const [isEditMode, setIsEditMode] = useState(false)
  const [editorInstance, setEditorInstance] = useState<any>(null)

  const handleEditorReady = useCallback((editor: any) => {
    setEditorInstance(editor)
  }, [])

  // Demo admission ID - in real app, would come from context
  const admissionId = 76

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [notesData, templatesData] = await Promise.allSettled([
          consultationNoteApi.listByAdmission(admissionId),
          templateApi.listActive(),
        ])
        if (notesData.status === "fulfilled") setNotes(Array.isArray(notesData.value) ? notesData.value : [])
        if (templatesData.status === "fulfilled") setTemplates(Array.isArray(templatesData.value) ? templatesData.value : [])
      } catch { /* */ }
      finally { setLoading(false) }
    }
    fetchData()
  }, [admissionId])

  const handleInactivate = async (noteId: number) => {
    if (confirm("Are you sure you want to delete this note?")) {
      try {
        const noteToUpdate = notes.find(n => n.id === noteId)
        if (noteToUpdate) {
          await consultationNoteApi.save({ ...noteToUpdate, status: "inactive" })
          setNotes(prev => prev.filter(n => n.id !== noteId))
        }
      } catch {
        toast({ title: "Error", description: "Failed to delete note", variant: "destructive" })
      }
    }
  }

  const handleTemplateSelect = async (templateId: string) => {
    const template = templates.find((t: any) => t.id.toString() === templateId)
    if (!template) return
    try {
      const fullTemplate = await templateApi.view(template.id)
      setSelectedTemplate(fullTemplate)
      setFormData({})
      setNoteContent(null)
      setEditingNoteId(null)
      setIsEditMode(false)
    } catch {
      toast({ title: "Error", description: "Failed to load template", variant: "destructive" })
    }
  }

  const handleDataChange = (key: string, value: any) => {
    setFormData(prev => ({ ...prev, [key]: value }))
  }

  const handleSave = async (editorContent: any) => {
    if (!selectedTemplate) {
      toast({ title: "Error", description: "Please select a template", variant: "destructive" })
      return
    }
    try {
      const payload = {
        id: editingNoteId,
        templateId: selectedTemplate.id,
        consultationType: "ipd",
        admissionId,
        appointmentId: null,
        noteContent: editorContent,
        formData,
        status: "active",
      }
      const response = await consultationNoteApi.save(payload)
      if (response?.id) setEditingNoteId(response.id)
      toast({ title: "Success", description: editingNoteId ? "Note updated" : "Note saved" })
      // Refresh notes list
      const updatedNotes = await consultationNoteApi.listByAdmission(admissionId)
      setNotes(Array.isArray(updatedNotes) ? updatedNotes : [])
    } catch {
      toast({ title: "Error", description: "Failed to save note", variant: "destructive" })
    }
  }

  const handleLoadNote = useCallback((noteId: number, templateId: number, fd: Record<string, any>, nc?: any) => {
    setEditingNoteId(noteId)
    setIsEditMode(true)
    setFormData(fd)
    if (nc) setNoteContent(nc)
    // Find and set the template
    const template = templates.find(t => t.id === templateId)
    if (template) setSelectedTemplate(template)
  }, [templates])

  const handleNewNote = useCallback(() => {
    setSelectedTemplate(null)
    setFormData({})
    setNoteContent(null)
    setEditingNoteId(null)
    setIsEditMode(false)
  }, [])

  const handleVersionRestore = (version: any) => {
    setFormData(version.consultationData || version.data || {})
    if (version.noteContent) setNoteContent(version.noteContent)
  }

  // Workspace view - integrated NotePreviewPanel + NoteEditor
  if (viewMode === "workspace") {
    return (
      <div className="h-screen flex flex-col bg-background">
        <AppHeader />
        <div className="flex items-center gap-2 px-3 py-1 border-b">
          <Button size="sm" variant="outline" className="h-6 text-[10px] px-2" onClick={() => setViewMode("list")}>
            ← Back to List
          </Button>
          <span className="text-xs text-muted-foreground">Consultation Notes Workspace</span>
        </div>
        <div className="flex-1 flex overflow-hidden">
          {/* Left: Preview Panel (sidebar + A4 paper) */}
          <div className="flex-1 min-w-0 border-r">
            <NotePreviewPanel
              editor={editorInstance}
              selectedTemplateId={selectedTemplate?.id?.toString() || ""}
              formData={formData}
              onSave={async () => { await handleSave(editorInstance?.getJSON()) }}
              onLoadNote={handleLoadNote}
              onNewNote={handleNewNote}
              isEditMode={isEditMode}
              admissionId={admissionId}
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
              versionHistory={[]}
              onVersionRestore={handleVersionRestore}
              isEditMode={isEditMode}
              initialContent={noteContent}
              hideEditorContent={true}
              onEditorReady={handleEditorReady}
            />
          </div>
        </div>
      </div>
    )
  }

  // List view (default)
  if (loading) return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <div className="p-3">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="h-5 w-40 bg-muted animate-pulse rounded" />
              <div className="h-3 w-48 bg-muted animate-pulse rounded mt-1" />
            </div>
            <div className="h-7 w-24 bg-muted animate-pulse rounded" />
          </div>
          <div className="grid gap-2">
            {[1, 2, 3].map(i => (
              <div key={i} className="border rounded p-2">
                <div className="h-4 w-40 bg-muted animate-pulse rounded mb-1" />
                <div className="flex gap-3 mt-1">
                  <div className="h-3 w-28 bg-muted animate-pulse rounded" />
                  <div className="h-3 w-28 bg-muted animate-pulse rounded" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )

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
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                className="gap-1 h-7 text-xs px-2"
                onClick={() => setViewMode("workspace")}
              >
                <Eye className="w-3 h-3" />Workspace
              </Button>
              <Link href="/notes/create">
                <Button size="sm" className="gap-1 h-7 text-xs px-2 bg-[#1b6a52] hover:bg-[#15544a]">
                  <Plus className="w-3 h-3" />New Note
                </Button>
              </Link>
            </div>
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
