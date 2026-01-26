"use client"

import { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import { AppHeader } from "@/components/app-header"
import { NoteEditor } from "@/components/note-editor"
import { useToast } from "@/hooks/use-toast"
import { templateApi } from "@/services/template-api"
import { AutoFillService } from "@/lib/auto-fill-service"

const extractFormElements = (content: any): any[] => {
  const elements: any[] = []
  const traverse = (node: any) => {
    if (node.type === "formElement" && node.attrs) {
      elements.push({
        elementKey: node.attrs.elementKey || "",
        elementType: node.attrs.elementType || "input",
        label: node.attrs.label || "Field",
        dataField: node.attrs.dataField || "",
        defaultDatetime: node.attrs.defaultDatetime || "",
        defaultValue: node.attrs.defaultValue || "",
      })
    }
    if (Array.isArray(node.content)) {
      node.content.forEach(traverse)
    }
  }
  if (content) traverse(content)
  return elements
}

export default function CreateNotePage() {
  const router = useRouter()
  const { toast } = useToast()
  const [templates, setTemplates] = useState<any[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null)
  const [formData, setFormData] = useState<Record<string, any>>({})
  const [loading, setLoading] = useState(true)
  
  // Mock patient/admission IDs - replace with actual values from context/props
  // TODO
  const patientId = 315
  const admissionId = 80
  
  const autoFillService = useMemo(() => new AutoFillService(), [])

  useEffect(() => {
    const loadTemplates = async () => {
      try {
        const data = await templateApi.listActive()
        setTemplates(Array.isArray(data) ? data : [])
      } catch (error) {
        toast({ title: "Error", description: "Failed to load templates", variant: "destructive" })
      } finally {
        setLoading(false)
      }
    }
    loadTemplates()
  }, [])

  const handleTemplateSelect = async (templateId: string) => {
    const template = templates.find((t) => t.id.toString() === templateId)
    if (!template) return
    
    try {
      const fullTemplate = await templateApi.view(template.id)
      setSelectedTemplate(fullTemplate)
      
      // Extract form elements and auto-fill
      const elements = extractFormElements(fullTemplate.templateContent)
      
      // Initialize form data with smart defaults
      const initialData: Record<string, any> = {}
      elements.forEach((el) => {
        if (el.elementType === "checkbox") {
          initialData[el.elementKey] = el.defaultValue === true || el.defaultValue === "true"
        } else if (el.elementType === "datetime") {
          if (el.defaultDatetime === "now") {
            initialData[el.elementKey] = new Date().toISOString()
          } else if (el.defaultDatetime === "today") {
            const today = new Date()
            today.setHours(0, 0, 0, 0)
            initialData[el.elementKey] = today.toISOString()
          } else if (el.defaultValue) {
            initialData[el.elementKey] = el.defaultValue
          } else {
            initialData[el.elementKey] = ""
          }
        } else {
          initialData[el.elementKey] = el.defaultValue || ""
        }
      })
      
      // Auto-fill data from API
      try {
        const autoFilledData = await autoFillService.autoFillElements(
          elements,
          patientId,
          admissionId
        )
        setFormData({ ...initialData, ...autoFilledData })
      } catch (error) {
        console.error("Auto-fill error:", error)
        setFormData(initialData)
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to load template", variant: "destructive" })
    }
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
