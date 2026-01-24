"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { getTemplates } from "@/lib/template-storage"
import { saveNote } from "@/lib/note-storage"
import { NoteEditor } from "@/components/note-editor"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Save } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import type { Template } from "@/lib/types"

export default function CreateNotePage() {
  const router = useRouter()
  const [templates, setTemplates] = useState<Template[]>([])
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("")
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null)
  const [formData, setFormData] = useState<Record<string, any>>({})
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
  }

  const handleDataChange = (key: string, value: any) => {
    setFormData((prev) => ({ ...prev, [key]: value }))
  }

  const handleVersionRestore = (version: any) => {
    setFormData(version.data)
  }

  const handleSave = () => {
    if (!selectedTemplate) {
      toast({ title: "Error", description: "Please select a template", variant: "destructive" })
      return
    }

    const newNote = {
      id: `note-${Date.now()}`,
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
    toast({ title: "Success", description: "Note saved successfully" })
    router.push("/notes")
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
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
            <Select value={selectedTemplateId} onValueChange={handleTemplateSelect}>
              <SelectTrigger className="w-64 h-8">
                <SelectValue placeholder="Select Template" />
              </SelectTrigger>
              <SelectContent>
                {templates.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.templateName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={handleSave} size="sm" className="gap-1" disabled={!selectedTemplate}>
            <Save className="w-4 h-4" />
            Save
          </Button>
        </div>
      </div>

      <div className="flex-1">
        {selectedTemplate ? (
          <NoteEditor
            template={selectedTemplate}
            formData={formData}
            onDataChange={handleDataChange}
            onSave={handleSave}
            versionHistory={[]}
            onVersionRestore={handleVersionRestore}
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <p className="text-muted-foreground">Select a template to start</p>
          </div>
        )}
      </div>
    </div>
  )
}
