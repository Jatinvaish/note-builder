"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import Link from "next/link"
import { getNote, addNoteVersion } from "@/lib/note-storage"
import { getTemplate } from "@/lib/template-storage"
import { TemplateRenderer } from "@/components/template-renderer"
import { NotesDataPanel } from "@/components/notes-data-panel"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Save, Copy } from "lucide-react"

export default function EditNotePage() {
  const router = useRouter()
  const params = useParams()
  const noteId = params.noteId as string
  const [note, setNote] = useState<any>(null)
  const [template, setTemplate] = useState<any>(null)
  const [formData, setFormData] = useState<Record<string, any>>({})
  const [outputLog, setOutputLog] = useState<string>("")
  const [selectedVersion, setSelectedVersion] = useState<number | null>(null)
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
    setOutputLog("") // Clear output on change to show real-time reflection
  }

  const handleDownloadPDF = async () => {
    // PDF export coming soon
    alert("PDF export feature coming soon")
  }

  const handleSave = () => {
    if (!note || !template) {
      alert("Note or template not found")
      return
    }

    // Validate required fields
    const requiredErrors: string[] = []
    const content = template?.templateContent?.content || []

    content.forEach((node: any) => {
      if (node.type === "formElement") {
        const element = node.attrs?.element || {}
        if (element.required && !formData[element.elementKey]) {
          requiredErrors.push(`${element.label} is required`)
        }
      }
    })

    if (requiredErrors.length > 0) {
      alert("Please fill required fields:\n" + requiredErrors.join("\n"))
      return
    }

    // Add new version
    const updatedNote = addNoteVersion(noteId, formData)
    if (updatedNote) {
      setNote(updatedNote)
      const output = JSON.stringify(updatedNote, null, 2)
      setOutputLog(output)

      setTimeout(() => {
        router.push("/notes")
      }, 1000)
    }
  }

  const handleLoadVersion = (version: number) => {
    if (!note) return
    const versionEntry = note.versionHistory?.find((v: any) => v.version === version)
    if (versionEntry) {
      setFormData(versionEntry.data)
      setSelectedVersion(version)
    }
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(outputLog)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading note...</p>
      </div>
    )
  }

  if (!note || !template) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-2">
        <p className="text-muted-foreground">Note or template not found</p>
        <Link href="/notes">
          <Button variant="outline" size="sm" className="gap-1 bg-transparent">
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="border-b border-border bg-card p-3">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-2">
            <Link href="/notes">
              <Button variant="outline" size="sm" className="gap-1 bg-transparent">
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </Link>
            <h1 className="text-lg font-semibold">{template.templateName}</h1>
          </div>
          <Button onClick={handleSave} size="sm" className="gap-1">
            <Save className="w-4 h-4" />
            Save
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Editor Area - Main */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Editor */}
          <div className="flex-1 overflow-auto p-3">
            <div className="max-w-3xl mx-auto">
              <div className="mb-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">v{note.versionHistory?.length || 0}</p>
                  {note.versionHistory && note.versionHistory.length > 1 && (
                    <Select
                      value={selectedVersion?.toString() || (note.versionHistory.length).toString()}
                      onValueChange={(val) => handleLoadVersion(parseInt(val))}
                    >
                      <SelectTrigger className="w-36 h-7 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {note.versionHistory.map((v: any) => (
                          <SelectItem key={v.version} value={v.version.toString()} className="text-xs">
                            v{v.version} - {new Date(v.timestamp).toLocaleDateString()}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
              </div>
              <div className="bg-card border border-border rounded p-3 space-y-2">
                <TemplateRenderer
                  template={template}
                  onDataChange={handleDataChange}
                  data={formData}
                  isEditable={true}
                />
              </div>
            </div>
          </div>

          {/* Output Panel */}
          <div className="border-t border-border bg-muted p-2 h-28 flex flex-col gap-1">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-muted-foreground">Output</span>
              {outputLog && (
                <Button
                  onClick={handleCopy}
                  variant="outline"
                  size="sm"
                  className="h-6 gap-1 text-xs bg-transparent"
                >
                  <Copy className="w-3 h-3" />
                </Button>
              )}
            </div>
            {outputLog ? (
              <pre className="text-[9px] leading-tight whitespace-pre-wrap break-words font-mono bg-background border border-border rounded p-2 overflow-auto flex-1">
                {outputLog}
              </pre>
            ) : (
              <p className="text-[10px] text-muted-foreground italic">Save to see output</p>
            )}
          </div>
        </div>

        {/* Right Sidebar - Data Entry Panel */}
        {template && (
          <NotesDataPanel
            template={template}
            formData={formData}
            onDataChange={handleDataChange}
            onDownloadPDF={handleDownloadPDF}
          />
        )}
      </div>
    </div>
  )
}
