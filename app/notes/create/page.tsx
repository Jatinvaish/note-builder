"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { AppHeader } from "@/components/app-header"
import { NoteEditor } from "@/components/note-editor"
import { useToast } from "@/hooks/use-toast"

export default function CreateNotePage() {
  const router = useRouter()
  const { toast } = useToast()
  const [templates, setTemplates] = useState<any[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null)
  const [formData, setFormData] = useState<Record<string, any>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const stored = localStorage.getItem("templates")
    if (stored) {
      const parsed = JSON.parse(stored)
      setTemplates(Array.isArray(parsed) ? parsed : [])
    }
    setLoading(false)
  }, [])

  const handleTemplateSelect = (templateId: string) => {
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

    const notes = JSON.parse(localStorage.getItem("notes") || "[]")
    const newNote = {
      id: `note-${Date.now()}`,
      templateId: selectedTemplate.id,
      templateName: selectedTemplate.templateName,
      consultationData: formData,
      noteContent: selectedTemplate.templateContent,
      versionHistory: [
        {
          version: 1,
          timestamp: new Date().toISOString(),
          data: formData,
          noteContent: selectedTemplate.templateContent,
        },
      ],
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    notes.push(newNote)
    localStorage.setItem("notes", JSON.stringify(notes))
    toast({ title: "Success", description: "Note saved successfully" })
    router.push("/notes")
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Loading...</p>
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
          versionHistory={[]}
          onVersionRestore={handleVersionRestore}
        />
      </div>
    </div>
  )
}
