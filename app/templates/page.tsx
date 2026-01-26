"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { templateApi } from "@/services/template-api"
import { Button } from "@/components/ui/button"
import { Plus, Edit, Trash2, Clock } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  const loadTemplates = async () => {
    try {
      setLoading(true)
      const response = await templateApi.list()
      setTemplates(response || [])
    } catch (error) {
      toast({ title: "Error", description: "Failed to load templates", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadTemplates()
  }, [])

  const handleDelete = async (templateId: number) => {
    if (confirm("Are you sure you want to delete this template?")) {
      try {
        await templateApi.delete(templateId)
        toast({ title: "Success", description: "Template deleted successfully" })
        loadTemplates()
      } catch (error) {
        toast({ title: "Error", description: "Failed to delete template", variant: "destructive" })
      }
    }
  }

  if (loading) return <div className="p-4">Loading...</div>

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Templates</h1>
            <p className="text-sm text-muted-foreground mt-1">Manage consultation note templates</p>
          </div>
          <Link href="/templates/create">
            <Button size="lg" className="gap-2">
              <Plus className="w-4 h-4" />
              Create Template
            </Button>
          </Link>
        </div>

        {/* Templates Grid */}
        {templates.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">No templates yet. Create one to get started.</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {templates.map((template) => {
              return (
                <div key={template.id} className="border border-border rounded-lg p-4 hover:bg-accent transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-foreground">{template.templateName}</h3>
                      {template.templateDescription && (
                        <p className="text-sm text-muted-foreground mt-1">{template.templateDescription}</p>
                      )}
                      <div className="flex gap-4 mt-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {template.versionHistoryCount} version{template.versionHistoryCount !== 1 ? "s" : ""}
                        </span>
                        <span>Type: {template.templateType || "normal"}</span>
                        <span>Status: {template.status || "active"}</span>
                      </div>
                    </div>
                    <div className="flex gap-2 ml-4">
                      <Link href={`/templates/${template.id}`}>
                        <Button size="sm" variant="outline" className="gap-1 bg-transparent">
                          <Edit className="w-4 h-4" />
                          Edit
                        </Button>
                      </Link>
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-1 text-destructive hover:text-destructive bg-transparent"
                        onClick={() => handleDelete(template.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                        Delete
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
  )
}
