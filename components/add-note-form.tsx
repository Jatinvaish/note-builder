"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { TemplateRenderer } from "./template-renderer"
import { AutoFillService } from "@/lib/auto-fill-service"
import { toast } from "@/hooks/use-toast"
import { Label } from "@/components/ui/label"

interface Template {
  id: string
  templateName: string
  templateContent: any
}

interface AddNoteFormProps {
  patientId?: number
  admissionId?: number
  onSave?: () => void
  onCancel?: () => void
}

export function AddNoteForm({ patientId = 1, admissionId = 1, onSave, onCancel }: AddNoteFormProps) {
  const [templates, setTemplates] = useState<Template[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null)
  const [formData, setFormData] = useState<Record<string, any>>({})
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const autoFillService = new AutoFillService()

  useEffect(() => {
    fetchTemplates()
  }, [])

  useEffect(() => {
    if (selectedTemplate && patientId) {
      autoFillFields()
    }
  }, [selectedTemplate, patientId])

  const fetchTemplates = async () => {
    setIsLoading(true)
    try {
      const stored = localStorage.getItem("templates")
      if (stored) {
        const parsed = JSON.parse(stored)
        setTemplates(Array.isArray(parsed) ? parsed : [])
      }
    } catch (error: any) {
      toast({ title: "Error", description: "Failed to load templates", variant: "destructive" })
    } finally {
      setIsLoading(false)
    }
  }

  const autoFillFields = async () => {
    if (!selectedTemplate?.templateContent?.content) return

    try {
      const elements = extractFormElements(selectedTemplate.templateContent.content)
      const filledData = await autoFillService.autoFillElements(elements, patientId, admissionId)
      setFormData(filledData)
    } catch (error: any) {
      console.error("Auto-fill error:", error)
    }
  }

  const extractFormElements = (content: any[]): any[] => {
    const elements: any[] = []
    const traverse = (nodes: any[]) => {
      nodes.forEach(node => {
        if (node.type === "formElement" && node.attrs?.element) {
          elements.push(node.attrs.element)
        }
        if (node.content) traverse(node.content)
      })
    }
    traverse(content)
    return elements
  }

  const handleTemplateChange = (templateId: string) => {
    const template = templates.find(t => t.id === templateId)
    setSelectedTemplate(template || null)
    setFormData({})
  }

  const handleDataChange = (key: string, value: any) => {
    setFormData(prev => ({ ...prev, [key]: value }))
  }

  const handleSave = async () => {
    if (!selectedTemplate) {
      toast({ title: "Error", description: "Please select a template", variant: "destructive" })
      return
    }

    setIsSaving(true)
    try {
      const notes = JSON.parse(localStorage.getItem("notes") || "[]")
      const newNote = {
        id: Date.now().toString(),
        templateId: selectedTemplate.id,
        templateName: selectedTemplate.templateName,
        patientId,
        admissionId,
        data: formData,
        createdAt: new Date().toISOString()
      }
      notes.push(newNote)
      localStorage.setItem("notes", JSON.stringify(notes))
      
      toast({ title: "Success", description: "Note saved successfully" })
      setSelectedTemplate(null)
      setFormData({})
      onSave?.()
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to save note", variant: "destructive" })
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) return <div className="p-4 text-center text-sm">Loading templates...</div>

  return (
    <div className="space-y-3 p-4">
      <div>
        <Label className="text-xs font-semibold mb-1.5 block">Select Note</Label>
        <Select value={selectedTemplate?.id || ""} onValueChange={handleTemplateChange}>
          <SelectTrigger className="h-8 text-xs">
            <SelectValue placeholder="-- Choose Note --" />
          </SelectTrigger>
          <SelectContent>
            {templates.map((template) => (
              <SelectItem key={template.id} value={template.id} className="text-xs">
                {template.templateName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {selectedTemplate && (
        <div className="border rounded p-3 bg-white max-h-[500px] overflow-y-auto">
          <TemplateRenderer 
            template={selectedTemplate} 
            onDataChange={handleDataChange} 
            data={formData}
            isEditable={true}
            clinicalContext={{ patientId, admissionId }}
          />
        </div>
      )}

      {!selectedTemplate && (
        <div className="p-8 text-center bg-gray-50 rounded border-2 border-dashed">
          <p className="text-xs text-gray-500">Please select a note to begin</p>
        </div>
      )}

      <div className="flex justify-end gap-2 pt-2">
        {onCancel && (
          <Button
            variant="outline"
            onClick={onCancel}
            disabled={isSaving}
            className="h-8 text-xs px-3"
          >
            Cancel
          </Button>
        )}
        <Button
          onClick={handleSave}
          disabled={!selectedTemplate || isSaving}
          className="h-8 text-xs px-3"
        >
          {isSaving ? "Saving..." : "Save Note"}
        </Button>
      </div>
    </div>
  )
}
