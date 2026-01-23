"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { getTemplates } from "@/lib/template-storage"
import { saveNote } from "@/lib/note-storage"
import { NotesDataPanel } from "@/components/notes-data-panel"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { TemplateRenderer } from "@/components/template-renderer"
import { ArrowLeft, Save, Copy } from "lucide-react"
import { v4 as uuidv4 } from "uuid"

export default function CreateNotePage() {
  const router = useRouter()
  const [templates, setTemplates] = useState<any[]>([])
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("")
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null)
  const [formData, setFormData] = useState<Record<string, any>>({})
  const [outputLog, setOutputLog] = useState<string>("")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loaded = getTemplates()
    setTemplates(loaded)
    setLoading(false)
  }, [])

  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplateId(templateId)
    const template = templates.find((t) => t.id === templateId)
    setSelectedTemplate(template || null)
    setFormData({})
    setOutputLog("")
  }

  const handleDataChange = (key: string, value: any) => {
    setFormData((prev) => ({ ...prev, [key]: value }))
  }

  const handleDownloadPDF = async () => {
    // PDF export coming soon
    alert("PDF export feature coming soon")
  }

  const handleSave = () => {
    if (!selectedTemplate) {
      alert("Please select a template first")
      return
    }

    // Validate required fields
    const requiredErrors: string[] = []
    const content = selectedTemplate?.templateContent?.content || []

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

    const newId = `note-${uuidv4()}`
    const newNote = {
      id: newId,
      templateId: selectedTemplate.id,
      templateName: selectedTemplate.templateName,
      consultationData: formData,
      versionHistory: [
        {
          version: 1,
          timestamp: new Date().toISOString(),
          data: formData,
        },
      ],
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    saveNote(newNote)
    const output = JSON.stringify(newNote, null, 2)
    setOutputLog(output)

    setTimeout(() => {
      router.push("/notes")
    }, 1000)
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(outputLog)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading templates...</p>
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
                Back
              </Button>
            </Link>
            <h1 className="text-lg font-semibold">Create Consultation Note</h1>
          </div>
          <Button onClick={handleSave} size="sm" className="gap-1">
            <Save className="w-4 h-4" />
            Save Note
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Editor Area - 90% */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {!selectedTemplate ? (
            <div className="flex-1 flex items-center justify-center p-8">
              <div className="text-center">
                <p className="text-muted-foreground mb-4">Select a template to create a note</p>
                <Select value={selectedTemplateId} onValueChange={handleTemplateSelect}>
                  <SelectTrigger className="w-64">
                    <SelectValue placeholder="Choose a template..." />
                  </SelectTrigger>
                  <SelectContent>
                    {templates.length === 0 ? (
                      <p className="text-sm text-muted-foreground p-2">No templates available</p>
                    ) : (
                      templates.map((template) => (
                        <SelectItem key={template.id} value={template.id}>
                          {template.templateName}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>
          ) : (
            <>
              {/* Editor */}
              <div className="flex-1 overflow-auto p-4">
                <div className="max-w-3xl mx-auto">
                  <h2 className="text-lg font-semibold mb-4">{selectedTemplate.templateName}</h2>
                  <div className="bg-card border border-border rounded p-4 space-y-3">
                    <TemplateRenderer
                      template={selectedTemplate}
                      onDataChange={handleDataChange}
                      data={formData}
                      isEditable={true}
                    />
                  </div>
                </div>
              </div>

              {/* Output Panel */}
              <div className="border-t border-border bg-muted p-3 h-32 flex flex-col gap-2">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="text-muted-foreground">JSON Output</span>
                  {outputLog && (
                    <Button
                      onClick={handleCopy}
                      variant="outline"
                      size="sm"
                      className="h-7 gap-1 bg-transparent"
                    >
                      <Copy className="w-3 h-3" />
                      Copy
                    </Button>
                  )}
                </div>
                {outputLog ? (
                  <pre className="text-[10px] leading-tight whitespace-pre-wrap break-words font-mono bg-background border border-border rounded p-2 overflow-auto flex-1">
                    {outputLog}
                  </pre>
                ) : (
                  <p className="text-[11px] text-muted-foreground italic">No output yet</p>
                )}
              </div>
            </>
          )}
        </div>

        {/* Right Sidebar - Data Entry Panel */}
        {selectedTemplate && (
          <NotesDataPanel
            template={selectedTemplate}
            formData={formData}
            onDataChange={handleDataChange}
            onDownloadPDF={handleDownloadPDF}
          />
        )}
      </div>
    </div>
  )
}
