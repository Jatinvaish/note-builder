"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useEditor, EditorContent, Editor } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import Underline from "@tiptap/extension-underline"
import Link from "@tiptap/extension-link"
import Image from "@tiptap/extension-image"
import TextAlign from "@tiptap/extension-text-align"
import { TextStyle } from "@tiptap/extension-text-style"
import { Color } from "@tiptap/extension-color"
import TableRow from "@tiptap/extension-table-row"
import { FormElementExtension, DataBoundTable, DataBoundTableCell, DataBoundTableHeader } from "@/lib/tiptap-extensions"
import { format } from "date-fns"
import { consultationNoteApi } from "@/services/consultation-note-api"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Plus,
  PanelLeftClose,
  PanelLeft,
  ChevronDown,
  FileDown,
  Paperclip,
  Trash2,
  Download,
  Loader2,
} from "lucide-react"
import { cn } from "@/lib/utils"

// --- Interfaces ---

interface NotePreviewPanelProps {
  editor: Editor | null
  selectedTemplateId: string
  formData?: Record<string, any>
  onSave: () => Promise<void> | void
  onLoadNote?: (noteId: number, templateId: number, formData: Record<string, any>, noteContent?: any, skipNoteContentReload?: boolean) => void
  onNewNote?: () => void
  isEditMode?: boolean
  admissionId: number
  patientId?: number | null
  patientInfo?: {
    name?: string
    age?: string
    gender?: string
    uhid?: string
    ipdNo?: string
    mobile?: string
    admissionDate?: string
    ward?: string
    doctorName?: string
  }
}

interface CustomNote {
  id: number
  templateId: number
  templateName?: string
  consultationType: string
  createdByName?: string
  timestamp?: any
  admissionId: number
  versionHistoryCount: number
  createdAt: any
  updatedAt: any
}

interface NoteDetail {
  id: number
  templateId: number
  templateName?: string
  noteContent: any
  createdByName?: string
  timestamp?: any
  formData: Record<string, any>
  versionHistory: any[]
  createdAt: any
  updatedAt: any
}

// --- Utilities ---

export const parseDateArray = (dateInput: any): Date | null => {
  if (!dateInput) return null
  if (Array.isArray(dateInput)) {
    const [year, month, day, hour = 0, minute = 0, second = 0] = dateInput
    return new Date(year, month - 1, day, hour, minute, second)
  }
  const date = new Date(dateInput)
  return isNaN(date.getTime()) ? null : date
}

export const safeFormatDate = (dateString: any, formatStr: string) => {
  try {
    const date = parseDateArray(dateString)
    if (!date) return "N/A"
    return format(date, formatStr)
  } catch {
    return "Invalid date"
  }
}

// --- Component ---

export function NotePreviewPanel({
  editor: externalEditor,
  selectedTemplateId,
  formData,
  onSave,
  onLoadNote,
  onNewNote,
  isEditMode,
  admissionId,
  patientId,
  patientInfo,
}: NotePreviewPanelProps) {
  const { toast } = useToast()

  // Internal TipTap editor for view-only display
  const internalEditor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Link,
      Image,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      DataBoundTable.configure({ resizable: true }),
      TableRow,
      DataBoundTableCell,
      DataBoundTableHeader,
      TextStyle,
      Color,
      FormElementExtension,
    ],
    content: "",
    editable: false,
    immediatelyRender: false,
  })

  const [notes, setNotes] = useState<CustomNote[]>([])
  const [selectedNote, setSelectedNote] = useState<NoteDetail | null>(null)
  const [selectedNoteId, setSelectedNoteId] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const [showSidebar, setShowSidebar] = useState(true)
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false)
  const [isNoteEditing, setIsNoteEditing] = useState(false)

  // Document upload state
  const [showUploadDialog, setShowUploadDialog] = useState(false)
  const [uploadFiles, setUploadFiles] = useState<File[]>([])
  const [uploadComment, setUploadComment] = useState("")
  const [isUploading, setIsUploading] = useState(false)
  const [noteDocs, setNoteDocs] = useState<any[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Admission info state
  const [admissionInfo, setAdmissionInfo] = useState<any>(null)

  // View mode: use internal (non-editable) editor; Edit mode: prefer external editor
  const editor = (selectedNoteId && !isNoteEditing)
    ? internalEditor
    : ((externalEditor && !externalEditor.isDestroyed) ? externalEditor : internalEditor)

  // Ensure editor editability matches the mode
  useEffect(() => {
    if (isNoteEditing) {
      if (externalEditor && !externalEditor.isDestroyed) {
        externalEditor.setEditable(true)
      } else if (internalEditor && !internalEditor.isDestroyed) {
        internalEditor.setEditable(true)
      }
    } else {
      if (internalEditor && !internalEditor.isDestroyed) {
        internalEditor.setEditable(false)
      }
    }
  }, [isNoteEditing, externalEditor, internalEditor])

  const pendingContentRef = useRef<any>(null)

  // Load notes list
  useEffect(() => {
    if (admissionId) {
      loadNotes()
    }
  }, [admissionId])

  // Fetch admission info for header
  useEffect(() => {
    if (!admissionId) return
    const fetchAdmissionInfo = async () => {
      try {
        const res = await consultationNoteApi.getAdmissionInfo(admissionId)
        if (res?.success || res?.success === 1) setAdmissionInfo(res.data)
      } catch { /* ignore */ }
    }
    fetchAdmissionInfo()
  }, [admissionId])

  // Derive patient info from admission info or props
  const calcAge = (dob: any) => {
    if (!dob) return ""
    const d = new Date(dob)
    if (isNaN(d.getTime())) return ""
    const now = new Date()
    let age = now.getFullYear() - d.getFullYear()
    if (now.getMonth() < d.getMonth() || (now.getMonth() === d.getMonth() && now.getDate() < d.getDate())) age--
    return String(age)
  }

  const ai = admissionInfo || {}
  const pName = ai.patientName || patientInfo?.name || "N/A"
  const pAge = calcAge(ai.patientDob) || patientInfo?.age || ""
  const pGender = ai.patientGender || patientInfo?.gender || ""
  const pUhid = ai.patientUhid || patientInfo?.uhid || "N/A"
  const pIpdNo = patientInfo?.ipdNo || (admissionId ? String(admissionId) : "N/A")
  const pMobile = ai.patientMobile || patientInfo?.mobile || "N/A"
  const pAdmDate = ai.admission_date ? safeFormatDate(ai.admission_date, "dd/MM/yyyy hh:mm a") : (patientInfo?.admissionDate || "N/A")
  const wardInfo = [ai.ward_name, ai.room_number, ai.bed_number].filter(Boolean).join(" → ") || patientInfo?.ward || "N/A"

  // Load editor content in view mode
  useEffect(() => {
    if (isNoteEditing) return
    if (editor && selectedNote && selectedNote.noteContent) {
      try {
        editor.commands.setContent(selectedNote.noteContent)
      } catch {
        editor.commands.setContent("")
      }
    }
  }, [editor, selectedNote?.noteContent, isNoteEditing])

  // Cleanup internal editor
  useEffect(() => {
    return () => {
      internalEditor?.destroy()
    }
  }, [internalEditor])

  // Sync formData to editor
  useEffect(() => {
    const activeEditor = externalEditor || internalEditor
    if (!activeEditor || !formData || Object.keys(formData).length === 0) return

    const { state } = activeEditor
    const { tr } = state
    let updated = false

    state.doc.descendants((node, pos) => {
      if (node.type.name === "formElement") {
        const elementKey = node.attrs.elementKey || node.attrs.dataField || node.attrs.id
        const currentValue = node.attrs.defaultValue
        const newValue = (formData[elementKey] !== undefined) ? formData[elementKey].toString() : currentValue

        if (newValue !== currentValue) {
          tr.setNodeMarkup(pos, undefined, {
            ...node.attrs,
            defaultValue: newValue,
          })
          updated = true
        }
      }
    })

    if (updated) {
      activeEditor.view.dispatch(tr)
    }
  }, [formData, externalEditor, internalEditor])

  // Re-load content when selectedNoteId changes (view mode)
  useEffect(() => {
    if (isNoteEditing) return
    if (editor && selectedNoteId && selectedNote && selectedNote.noteContent) {
      const loadContent = () => {
        try {
          editor.commands.setContent(selectedNote.noteContent)
        } catch {
          editor.commands.setContent("")
        }
      }
      loadContent()
      setTimeout(loadContent, 50)
    }
  }, [selectedNoteId, selectedNote?.noteContent, editor, isNoteEditing])

  const loadNotes = async () => {
    if (!admissionId) return
    try {
      setLoading(true)
      const response = await consultationNoteApi.listByAdmissionId(admissionId)
      const sortedNotes = Array.isArray(response)
        ? [...response].sort((a: any, b: any) => {
          const dateA = parseDateArray(a.updatedAt || a.createdAt || a.timestamp || 0)?.getTime() || 0
          const dateB = parseDateArray(b.updatedAt || b.createdAt || b.timestamp || 0)?.getTime() || 0
          return dateB - dateA
        })
        : []
      setNotes(sortedNotes)
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }

  const loadNoteDetail = async (noteId: number) => {
    try {
      const response = await consultationNoteApi.view(noteId)
      setSelectedNote(response)
      setSelectedNoteId(noteId)
      setIsNoteEditing(false)

      if (internalEditor && response?.noteContent) {
        try {
          internalEditor.commands.setContent(response.noteContent)
        } catch {
          internalEditor.commands.setContent("")
        }
      } else if (response?.noteContent) {
        pendingContentRef.current = response.noteContent
      }
    } catch {
      toast({ title: "Error", description: "Failed to load note", variant: "destructive" })
    }
  }

  const handleEditClick = () => {
    if (!selectedNote) return
    setIsNoteEditing(true)

    if (externalEditor && !externalEditor.isDestroyed && selectedNote.noteContent) {
      try { externalEditor.commands.setContent(selectedNote.noteContent) } catch { /* */ }
    }

    if (onLoadNote) {
      let formDataValues: Record<string, any> = {}
      if (Array.isArray(selectedNote.formData)) {
        selectedNote.formData.forEach((item: any) => {
          if (item?.value !== undefined) {
            const fieldKey = item?.elementKey || item?.dataField || item?.id
            if (fieldKey) formDataValues[fieldKey] = item?.value
          }
        })
      } else if (typeof selectedNote.formData === "object") {
        formDataValues = selectedNote.formData
      }
      onLoadNote(selectedNote.id, selectedNote.templateId, formDataValues, selectedNote.noteContent, false)
    }
  }

  const handleSelectVersion = async (versionNumber: number) => {
    if (!selectedNote) return
    try {
      const versionData = selectedNote?.versionHistory?.find((v: any) => v?.version === versionNumber)
      if (!versionData) {
        toast({ title: "Error", description: "Version not found", variant: "destructive" })
        return
      }

      if (isNoteEditing) {
        if (editor && versionData?.noteContent) {
          try { editor?.commands?.setContent(versionData?.noteContent) } catch {
            editor?.commands?.setContent(JSON.stringify(versionData?.noteContent))
          }
        }
        if (onLoadNote && versionData?.formData) {
          let versionValues: Record<string, any> = {}
          if (Array.isArray(versionData?.formData)) {
            versionData?.formData?.forEach((item: any) => {
              if (item?.value !== undefined) {
                const fieldKey = item?.elementKey || item?.dataField || item?.id
                if (fieldKey) versionValues[fieldKey] = item?.value
              }
            })
          } else if (typeof versionData?.formData === "object") {
            versionValues = versionData?.formData
          }
          onLoadNote(selectedNote?.id, selectedNote?.templateId, versionValues, versionData?.noteContent, true)
        }
        toast({ title: "Version Loaded", description: `Version ${versionNumber} loaded. Click Update to save.` })
      } else {
        if (internalEditor && versionData?.noteContent) {
          try { internalEditor.commands.setContent(versionData.noteContent) } catch { /* */ }
        }
        toast({ title: "Version Loaded", description: `Viewing version ${versionNumber}` })
      }
    } catch {
      toast({ title: "Error", description: "Failed to restore version", variant: "destructive" })
    }
  }

  // Download PDF using backend API
  const handleDownloadPdf = async () => {
    if (!selectedNoteId) {
      toast({ title: "Info", description: "Please save the note first before downloading PDF" })
      return
    }

    setIsDownloadingPdf(true)
    try {
      const response = await consultationNoteApi.downloadPdf(selectedNoteId)

      if (response?.success && response?.pdfBase64) {
        const byteCharacters = atob(response.pdfBase64)
        const byteNumbers = new Array(byteCharacters.length)
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i)
        }
        const byteArray = new Uint8Array(byteNumbers)
        const blob = new Blob([byteArray], { type: "application/pdf" })

        const url = window.URL.createObjectURL(blob)
        const link = document.createElement("a")
        link.href = url
        link.download = response?.fileName || "note.pdf"
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        window.URL.revokeObjectURL(url)

        toast({ title: "Success", description: "PDF downloaded successfully" })
      } else {
        throw new Error(response?.message || "Failed to generate PDF")
      }
    } catch (error: any) {
      toast({ title: "Error", description: error?.message || "Failed to download PDF", variant: "destructive" })
    } finally {
      setIsDownloadingPdf(false)
    }
  }

  // --- Document upload functions ---

  const loadDocuments = useCallback(async (noteId: number) => {
    try {
      const res = await consultationNoteApi.getDocuments(noteId)
      if (res?.success) {
        setNoteDocs(res.documents || [])
      }
    } catch { /* */ }
  }, [])

  useEffect(() => {
    if (selectedNoteId) {
      loadDocuments(selectedNoteId)
    } else {
      setNoteDocs([])
    }
  }, [selectedNoteId, loadDocuments])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    const allowed = ["image/jpeg", "image/png", "image/jpg", "application/pdf",
      "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"]
    const invalid = files.filter(f => !allowed.includes(f.type))
    if (invalid.length) { toast({ title: "Only JPEG, PNG, PDF, DOC allowed" }); return }
    const oversized = files.filter(f => f.size > 10 * 1024 * 1024)
    if (oversized.length) { toast({ title: "Max 10MB per file" }); return }
    setUploadFiles(prev => [...prev, ...files])
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  const handleUploadDocuments = async () => {
    if (!selectedNoteId || uploadFiles.length === 0) {
      toast({ title: "Select files to upload" })
      return
    }
    setIsUploading(true)
    try {
      const res = await consultationNoteApi.uploadDocuments(selectedNoteId, uploadFiles, patientId, uploadComment)
      if (res?.success) {
        toast({ title: "Documents uploaded" })
        setUploadFiles([])
        setUploadComment("")
        loadDocuments(selectedNoteId)
      } else {
        toast({ title: res?.message || "Upload failed", variant: "destructive" })
      }
    } catch (e: any) {
      toast({ title: e?.message || "Upload error", variant: "destructive" })
    } finally {
      setIsUploading(false)
    }
  }

  const handleDeleteDocument = async (docId: number) => {
    if (!confirm("Delete this document?")) return
    try {
      const res = await consultationNoteApi.deleteDocument(docId)
      if (res?.success) {
        toast({ title: "Document deleted" })
        if (selectedNoteId) loadDocuments(selectedNoteId)
      } else {
        toast({ title: "Delete failed", variant: "destructive" })
      }
    } catch {
      toast({ title: "Error deleting document", variant: "destructive" })
    }
  }

  const handleDownloadDocument = (previewUrl: string, filename: string) => {
    if (!previewUrl) return
    const link = document.createElement("a")
    link.href = previewUrl
    link.target = "_blank"
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const formatFileSize = (bytes: number) => {
    if (!bytes) return "0 B"
    if (bytes < 1024) return bytes + " B"
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB"
    return (bytes / (1024 * 1024)).toFixed(1) + " MB"
  }

  return (
    <div className="flex h-full relative">
      {/* Notes Sidebar */}
      {showSidebar && (
        <div className="flex flex-col gap-0.5 p-1 bg-muted/50 w-[15%] min-w-[150px] max-w-[200px] overflow-y-auto border-r">
          <Button
            size="sm"
            className="w-full h-6 text-[10px] gap-1 bg-[#1b6a52] hover:bg-[#15544a] text-white mb-1"
            onClick={() => {
              onNewNote?.()
              setSelectedNoteId(null)
              setSelectedNote(null)
              setIsNoteEditing(false)
              pendingContentRef.current = null
              if (internalEditor) internalEditor.commands.setContent("")
            }}
          >
            <Plus className="w-3 h-3" />
            Add Note
          </Button>

          <div className="border-b mb-1" />

          {loading ? (
            <div className="flex justify-center py-4">
              <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
            </div>
          ) : notes.length === 0 ? (
            <p className="text-[10px] text-muted-foreground text-center mt-4">No notes</p>
          ) : (
            notes.map((noteEntry, idx) => (
              <div
                key={noteEntry?.id || idx}
                className={cn(
                  "cursor-pointer rounded p-1 min-h-[50px] flex flex-col justify-center transition-all border",
                  selectedNoteId === noteEntry?.id
                    ? "bg-cyan-100 border-cyan-400 border-2 shadow-md"
                    : "bg-transparent border-cyan-100 hover:bg-cyan-50"
                )}
                onClick={() => noteEntry?.id && loadNoteDetail(noteEntry.id)}
              >
                <p className="font-bold text-[10px] text-cyan-700 truncate leading-tight mb-0.5">
                  {noteEntry?.templateName || "Untitled Note"}
                </p>
                <p className="text-[9px] text-muted-foreground truncate leading-tight">
                  Dr. {noteEntry?.createdByName || "Unknown"}
                </p>
                <div className="flex items-center w-full mt-0.5">
                  <Badge variant="secondary" className="text-[8px] w-full flex items-center gap-1 px-1 py-0 h-4">
                    {idx === 0 && <span className="text-blue-600 font-semibold">Latest</span>}
                    <span className="ml-auto text-right">
                      {safeFormatDate(noteEntry?.updatedAt || noteEntry?.timestamp || noteEntry?.createdAt, "dd/MM/yyyy h:mm a")}
                    </span>
                  </Badge>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Main Preview Area */}
      <div className="flex flex-col flex-1 h-full m-2 gap-2">
        {/* Toolbar */}
        <div className="flex items-center justify-between flex-wrap gap-1">
          <div className="flex items-center gap-2 min-w-0">
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={() => setShowSidebar(!showSidebar)}
            >
              {showSidebar ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeft className="w-4 h-4" />}
            </Button>
            <h3 className="text-xs font-semibold truncate max-w-[300px]">
              {selectedNote ? `Note ${selectedNote?.templateName ? `| ${selectedNote.templateName}` : ""}` : "Note Preview"}
            </h3>
          </div>

          <div className="flex items-center gap-1 flex-shrink-0">
            {/* Version History Dropdown */}
            {selectedNote?.versionHistory && selectedNote.versionHistory.length > 0 && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="sm" variant="outline" className="h-6 text-[10px] gap-1 px-2">
                    Versions ({selectedNote.versionHistory.length})
                    <ChevronDown className="w-3 h-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="max-h-[300px] overflow-y-auto">
                  {selectedNote.versionHistory.map((version: any) => (
                    <DropdownMenuItem
                      key={version?.version}
                      className="flex flex-col items-start gap-0 cursor-pointer py-1 px-2"
                      onClick={() => handleSelectVersion(version?.version)}
                    >
                      <span className="font-bold text-xs">Version {version?.version}</span>
                      <span className="text-[10px] text-muted-foreground">
                        {version?.savedByName || ""} {version?.savedByRole ? `(${version.savedByRole})` : ""}
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        {safeFormatDate(version?.savedAt, "dd/MM/yyyy h:mm a")}
                      </span>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            {/* Edit / Save / Update / Preview buttons */}
            {selectedNoteId && !isNoteEditing ? (
              <Button
                size="sm"
                className="h-6 text-[10px] px-2 bg-[#1b6a52] hover:bg-[#15544a] text-white"
                onClick={handleEditClick}
              >
                Edit
              </Button>
            ) : (!selectedNoteId && !isNoteEditing && !selectedTemplateId) ? null : (
              <>
                <Button
                  size="sm"
                  className="h-6 text-[10px] px-2 bg-green-600 hover:bg-green-700 text-white"
                  onClick={async () => {
                    await onSave()
                    loadNotes()
                    setIsNoteEditing(false)
                    setSelectedNoteId(null)
                    setSelectedNote(null)
                    if (internalEditor) internalEditor.commands.setContent("")
                  }}
                >
                  {(selectedNoteId && isNoteEditing) || isEditMode ? "Update" : "Save"}
                </Button>
                {selectedNoteId && isNoteEditing && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-6 text-[10px] px-2"
                    onClick={() => {
                      setIsNoteEditing(false)
                      if (internalEditor && selectedNote?.noteContent) {
                        try { internalEditor.commands.setContent(selectedNote.noteContent) } catch { /* */ }
                      }
                    }}
                  >
                    Preview
                  </Button>
                )}
              </>
            )}

            {/* PDF & Docs buttons (view mode only) */}
            {selectedNoteId && !isNoteEditing && (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-6 text-[10px] px-2 gap-1"
                  onClick={handleDownloadPdf}
                  disabled={isDownloadingPdf}
                >
                  {isDownloadingPdf ? <Loader2 className="w-3 h-3 animate-spin" /> : <FileDown className="w-3 h-3" />}
                  PDF
                </Button>
                <Button
                  size="sm"
                  className="h-6 text-[10px] px-2 gap-1 bg-[#1b6a52] hover:bg-[#15544a] text-white"
                  onClick={() => setShowUploadDialog(true)}
                >
                  <Paperclip className="w-3 h-3" />
                  Docs {noteDocs.length > 0 && `(${noteDocs.length})`}
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Content Area */}
        {(!selectedNoteId && !isNoteEditing && !selectedTemplateId) ? (
          <div className="flex items-center justify-center flex-1 bg-muted/30 border rounded-md">
            <p className="text-xs text-muted-foreground">
              Select a template to start writing, or select an existing note to preview.
            </p>
          </div>
        ) : (
          <div className={cn("border rounded-md bg-gray-100 flex-1 overflow-y-auto overflow-x-hidden flex justify-center note-preview-container", selectedNoteId && !isNoteEditing && "note-preview-view-mode")}>
            {/* A4 Paper Container */}
            <div
              className="bg-white shadow-xl flex flex-col relative overflow-x-hidden mx-auto my-5"
              style={{
                width: "220mm",
                maxWidth: "100%",
                minHeight: "100%",
                padding: "6mm",
                zoom: 0.75,
                backgroundImage: "linear-gradient(#fff 296mm, #e5e7eb 296mm, #e5e7eb 297mm)",
                backgroundSize: "100% 297mm",
                backgroundRepeat: "repeat-y",
              }}
            >
              {/* Header - Hospital/Doctor Info */}
              <div className="mb-2 w-full">
                <div className="flex justify-between items-center mb-1 border-b-2 border-[#0a6b4e] pb-1">
                  <div className="flex-shrink-0">
                    <img src="/the_logo.png" alt="Logo" className="h-10 object-contain" />
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-[11pt] text-[#0a6b4e] uppercase leading-tight m-0">
                      {selectedNote?.createdByName || patientInfo?.doctorName || "DOCTOR NAME"}
                    </p>
                    <p className="text-[8pt] text-gray-500 m-0 leading-tight">
                      General Physician & Specialist | REG: {selectedNote?.id ? `${selectedNote.id}/2024` : "PENDING"}
                    </p>
                    <p className="text-[8pt] text-gray-500 m-0 leading-tight">
                      Contact: +91-XXXXXXXXXX
                    </p>
                  </div>
                </div>

                {/* Patient Info Table */}
                <div className="bg-[#f4f6f5] rounded-sm text-[8pt] text-gray-700 border border-[#d9dedd] overflow-hidden">
                  <table className="w-full border-collapse m-0">
                    <colgroup>
                      <col style={{ width: "15%" }} />
                      <col style={{ width: "3%" }} />
                      <col style={{ width: "32%" }} />
                      <col style={{ width: "13%" }} />
                      <col style={{ width: "3%" }} />
                      <col style={{ width: "auto" }} />
                    </colgroup>
                    <tbody>
                      <tr>
                        <td className="py-[3px] px-2 text-gray-500 whitespace-nowrap border-r border-dashed border-gray-300">Patient Name</td>
                        <td className="py-[3px] px-0.5 text-center text-gray-500 border-r border-[#d9dedd]">:</td>
                        <td className="py-[3px] px-2 font-bold border-r border-[#d9dedd]">{pName}</td>
                        <td className="py-[3px] px-2 text-gray-500 whitespace-nowrap border-r border-dashed border-gray-300">UHID | IPD NO</td>
                        <td className="py-[3px] px-0.5 text-center text-gray-500 border-r border-[#d9dedd]">:</td>
                        <td className="py-[3px] px-2 font-bold">{pUhid} | {pIpdNo}</td>
                      </tr>
                      <tr>
                        <td className="py-[3px] px-2 text-gray-500 whitespace-nowrap border-r border-dashed border-gray-300 border-t border-t-[#d9dedd]">Age | Gender</td>
                        <td className="py-[3px] px-0.5 text-center text-gray-500 border-r border-[#d9dedd] border-t border-t-[#d9dedd]">:</td>
                        <td className="py-[3px] px-2 font-bold border-r border-[#d9dedd] border-t border-t-[#d9dedd]">{pAge} | {pGender}</td>
                        <td className="py-[3px] px-2 text-gray-500 whitespace-nowrap border-r border-dashed border-gray-300 border-t border-t-[#d9dedd]">Contact No</td>
                        <td className="py-[3px] px-0.5 text-center text-gray-500 border-r border-[#d9dedd] border-t border-t-[#d9dedd]">:</td>
                        <td className="py-[3px] px-2 font-bold border-t border-t-[#d9dedd]">{pMobile}</td>
                      </tr>
                      <tr>
                        <td className="py-[3px] px-2 text-gray-500 whitespace-nowrap border-r border-dashed border-gray-300 border-t border-t-[#d9dedd]">Admission Date</td>
                        <td className="py-[3px] px-0.5 text-center text-gray-500 border-r border-[#d9dedd] border-t border-t-[#d9dedd]">:</td>
                        <td className="py-[3px] px-2 font-bold border-r border-[#d9dedd] border-t border-t-[#d9dedd]">{pAdmDate}</td>
                        <td className="py-[3px] px-2 text-gray-500 whitespace-nowrap border-r border-dashed border-gray-300 border-t border-t-[#d9dedd]">Ward</td>
                        <td className="py-[3px] px-0.5 text-center text-gray-500 border-r border-[#d9dedd] border-t border-t-[#d9dedd]">:</td>
                        <td className="py-[3px] px-2 font-bold border-t border-t-[#d9dedd]">{wardInfo}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Editor Content */}
              <div className="flex-1 overflow-x-hidden max-w-full [&_.tiptap]:max-w-full [&_.tiptap]:break-words">
                <EditorContent editor={editor} />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Upload Documents Dialog */}
      <Dialog open={showUploadDialog} onOpenChange={(open) => {
        if (!open) { setUploadFiles([]); setUploadComment("") }
        setShowUploadDialog(open)
      }}>
        <DialogContent className="max-w-lg max-h-[85vh]">
          <DialogHeader>
            <DialogTitle className="text-sm">
              Documents {noteDocs.length > 0 && `(${noteDocs.length})`}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-3 overflow-y-auto">
            {/* Upload section */}
            <div className="border rounded-md p-2">
              <p className="text-xs font-semibold mb-1 text-[#1b6a52]">Upload New</p>
              <div className="bg-muted/50 border border-dashed rounded-md p-2 text-center">
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/jpeg,image/png,image/jpg,application/pdf,.doc,.docx"
                  onChange={handleFileChange}
                  className="text-xs"
                />
                <p className="text-[10px] text-muted-foreground mt-1">JPEG, PNG, PDF, DOC. Max 10MB each</p>
              </div>

              {uploadFiles.length > 0 && (
                <div className="space-y-1 mt-2">
                  {uploadFiles.map((file, idx) => (
                    <div key={idx} className="flex items-center gap-1 p-1 bg-blue-50 border border-blue-200 rounded text-xs">
                      <Paperclip className="w-3 h-3 text-blue-500 flex-shrink-0" />
                      <span className="flex-1 truncate">{file.name} ({formatFileSize(file.size)})</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-5 w-5 p-0 text-red-500 hover:text-red-700"
                        onClick={() => setUploadFiles(prev => prev.filter((_, i) => i !== idx))}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              <Textarea
                placeholder="Comment (optional) - What are these documents for?"
                value={uploadComment}
                onChange={(e) => setUploadComment(e.target.value)}
                rows={2}
                className="text-xs mt-2"
              />

              <Button
                size="sm"
                className="w-full mt-2 h-7 text-xs bg-[#1b6a52] hover:bg-[#15544a] text-white"
                onClick={handleUploadDocuments}
                disabled={isUploading || uploadFiles.length === 0}
              >
                {isUploading ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : null}
                Upload {uploadFiles.length > 0 && `(${uploadFiles.length} file${uploadFiles.length > 1 ? "s" : ""})`}
              </Button>
            </div>

            {/* Uploaded documents list */}
            {noteDocs.length > 0 && (
              <div>
                <p className="text-xs font-semibold mb-1">Uploaded Documents</p>
                <ScrollArea className="max-h-[250px]">
                  <div className="space-y-1">
                    <TooltipProvider>
                      {noteDocs.map((doc: any) => (
                        <div key={doc.id} className="flex items-center gap-2 p-1.5 bg-muted/50 border rounded text-xs">
                          <Paperclip className="w-3 h-3 text-blue-500 flex-shrink-0" />
                          <div className="flex flex-col flex-1 min-w-0">
                            <span className="font-medium truncate text-xs">{doc.filename}</span>
                            <div className="flex gap-1 text-[10px] text-muted-foreground">
                              <span>{formatFileSize(doc.fileSize)}</span>
                              {doc.comment && <span>| {doc.comment}</span>}
                              <span>{doc.createdAt ? safeFormatDate(doc.createdAt, "dd/MM/yy h:mm a") : ""}</span>
                            </div>
                          </div>
                          <div className="flex gap-0 flex-shrink-0">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 w-6 p-0 text-green-600 hover:text-green-700"
                                  onClick={() => handleDownloadDocument(doc.previewUrl, doc.filename)}
                                >
                                  <Download className="w-3 h-3" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>View</TooltipContent>
                            </Tooltip>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                                  onClick={() => handleDeleteDocument(doc.id)}
                                >
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Delete</TooltipContent>
                            </Tooltip>
                          </div>
                        </div>
                      ))}
                    </TooltipProvider>
                  </div>
                </ScrollArea>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* ProseMirror styles: base + view mode form element stripping */}
      <style jsx global>{`
        .note-preview-container .ProseMirror {
          width: 100%;
          min-height: 100%;
          background: white;
          padding: 0 !important;
          outline: none;
          box-sizing: border-box;
          font-family: 'Noto Sans', 'Noto Sans Devanagari', 'Noto Sans Gujarati', sans-serif;
          font-size: 11pt;
          line-height: 1.4;
          color: #1a202c;
          flex: 1;
          overflow-wrap: break-word;
          word-break: break-word;
          overflow-x: hidden;
        }
        .note-preview-container .ProseMirror h1 { font-size: 1.8em; font-weight: bold; margin: 0.8em 0 0.4em; color: #1a202c; line-height: 1.2; }
        .note-preview-container .ProseMirror h2 { font-size: 1.5em; font-weight: bold; margin: 0.7em 0 0.3em; color: #2d3748; line-height: 1.3; }
        .note-preview-container .ProseMirror h3 { font-size: 1.3em; font-weight: bold; margin: 0.6em 0 0.2em; color: #4a5568; line-height: 1.4; }
        .note-preview-container .ProseMirror p { margin: 0.3em 0; }
        .note-preview-container .ProseMirror table { border-collapse: collapse; width: 100% !important; margin: 1em 0; border: 1px solid #cbd5e0; }
        .note-preview-container .ProseMirror th,
        .note-preview-container .ProseMirror td { min-width: 1em; border: 1px solid #cbd5e0; padding: 5px 8px; vertical-align: top; box-sizing: border-box; word-wrap: break-word; overflow-wrap: break-word; white-space: pre-wrap; }
        .note-preview-container .ProseMirror th { background-color: #f7fafc; font-weight: bold; text-align: left; }
        .note-preview-container .ProseMirror ul,
        .note-preview-container .ProseMirror ol { padding-left: 25pt; margin: 0.8em 0; }
        .note-preview-container .ProseMirror li { margin-bottom: 0.4em; }
        .note-preview-container .ProseMirror ul[data-type="taskList"] { list-style: none; padding-left: 0; }
        .note-preview-container .ProseMirror ul[data-type="taskList"] li { display: flex; align-items: flex-start; margin-bottom: 0.5em; }
        .note-preview-container .ProseMirror ul[data-type="taskList"] li > label { flex: 0 0 auto; margin-right: 0.5rem; user-select: none; }
        .note-preview-container .ProseMirror ul[data-type="taskList"] li > div { flex: 1 1 auto; }
        .note-preview-container .ProseMirror blockquote { border-left: 4px solid #cbd5e0; padding-left: 1.5em; margin: 1.2em 0; font-style: italic; color: #4a5568; }
        .note-preview-container .ProseMirror pre { background-color: #f1f5f9; padding: 12px; border-radius: 6px; font-family: 'Courier New', Courier, monospace; font-size: 9.5pt; white-space: pre-wrap; margin: 1.2em 0; border: 1px solid #e2e8f0; }
        .note-preview-container .ProseMirror img { max-width: 100% !important; height: auto !important; display: block; margin: 1.5em auto; border-radius: 4px; }
        .note-preview-container .ProseMirror hr { border: 0; border-top: 1px solid #e2e8f0; margin: 2em 0; }
        .note-preview-container .ProseMirror input[type="datetime-local"] { width: 149px !important; }
        .note-preview-container .ProseMirror input[type="date"] { width: 116px !important; }
        .note-preview-container .ProseMirror input[type="time"] { width: 88px !important; }

        @media (max-width: 220mm) {
          .note-preview-container .ProseMirror { width: 100%; min-height: auto; padding: 1rem !important; }
        }

        /* View mode: strip form element decorations, show only filled values in bold */
        .note-preview-view-mode .ProseMirror [data-form-element].border-dashed { display: none !important; }
        .note-preview-view-mode .ProseMirror [data-form-element] {
          background: transparent !important;
          border: none !important;
          border-radius: 0 !important;
          padding: 0 !important;
          margin: 0 !important;
          font-size: inherit !important;
          font-weight: bold !important;
          color: #1a202c !important;
          cursor: default !important;
          opacity: 1 !important;
          box-shadow: none !important;
          display: inline !important;
          gap: 0 !important;
        }
        .note-preview-view-mode .ProseMirror [data-form-element]:hover {
          opacity: 1 !important;
          transform: none !important;
          box-shadow: none !important;
        }
        .note-preview-view-mode .ProseMirror [data-form-element] .text-red-500 { display: none !important; }
      `}</style>
    </div>
  )
}
