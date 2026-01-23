"use client"

import { useEffect, useState } from "react"
import type { Template } from "@/lib/types"
import { fetchTemplates, deleteTemplate } from "@/lib/template-utils"
import { Button } from "@/components/ui/button"
import { Eye, Edit, Trash2, Plus } from "lucide-react"

interface TemplateListProps {
  onEdit: (template: Template) => void
  onPreview: (template: Template) => void
  onNew: () => void
}

export function TemplateList({ onEdit, onPreview, onNew }: TemplateListProps) {
  const [templates, setTemplates] = useState<Template[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadTemplates()
  }, [])

  const loadTemplates = async () => {
    setIsLoading(true)
    try {
      const data = await fetchTemplates()
      setTemplates(data)
    } catch (error) {
      console.error("Failed to load templates:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async (templateId: string) => {
    if (confirm("Are you sure you want to delete this template?")) {
      try {
        await deleteTemplate(templateId)
        await loadTemplates()
      } catch (error) {
        console.error("Failed to delete template:", error)
        alert("Failed to delete template")
      }
    }
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Consultation Note Templates</h1>
          <p className="text-muted-foreground mt-1">Manage and create consultation note templates</p>
        </div>
        <Button onClick={onNew} size="lg" className="gap-2">
          <Plus className="w-5 h-5" />
          New Template
        </Button>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">Loading templates...</div>
      ) : templates.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">No templates yet. Create your first one!</p>
          <Button onClick={onNew} variant="outline">
            Create Template
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          {templates.map((template) => (
            <div
              key={template.id}
              className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-accent/50 transition-colors"
            >
              <div className="flex-1">
                <h3 className="font-semibold">{template.templateName}</h3>
                <p className="text-sm text-muted-foreground">{template.templateDescription}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Updated {new Date(template.updatedAt).toLocaleDateString()}
                </p>
              </div>
              <div className="flex gap-2">
                <Button onClick={() => onPreview(template)} variant="ghost" size="sm" title="Preview" className="gap-2">
                  <Eye className="w-4 h-4" />
                </Button>
                <Button onClick={() => onEdit(template)} variant="ghost" size="sm" title="Edit" className="gap-2">
                  <Edit className="w-4 h-4" />
                </Button>
                <Button
                  onClick={() => handleDelete(template.id)}
                  variant="ghost"
                  size="sm"
                  title="Delete"
                  className="gap-2 text-destructive hover:text-destructive"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
