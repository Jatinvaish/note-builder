"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import Link from "next/link"
import { templateApi } from "@/services/template-api"
import { TemplateBuilder } from "@/components/template-builder"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import type { Template } from "@/lib/types"
import { useToast } from "@/hooks/use-toast"

export default function EditTemplatePage() {
  const router = useRouter()
  const params = useParams()
  const templateId = params.templateId as string
  const [template, setTemplate] = useState<Template | null>(null)
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    const loadTemplate = async () => {
      try {
        const data = await templateApi.view(Number(templateId))
        setTemplate(data)
      } catch (error) {
        toast({ title: "Error", description: "Failed to load template", variant: "destructive" })
      } finally {
        setLoading(false)
      }
    }
    if (templateId) loadTemplate()
  }, [templateId])

  const handleSave = async (savedTemplate: Template) => {
    try {
      const result = await templateApi.save({
        id: Number(templateId),
        templateName: savedTemplate.templateName,
        templateDescription: savedTemplate.templateDescription,
        templateType: savedTemplate.templateType,
        templateContent: savedTemplate.templateContent,
        groups: savedTemplate.groups,
        versionHistory: savedTemplate.versionHistory || [],
        status: savedTemplate.status || "active",
      })
      toast({ title: "Success", description: "Template updated successfully" })
      router.push("/templates")
    } catch (error) {
      toast({ title: "Error", description: "Failed to update template", variant: "destructive" })
    }
  }

  const handleCancel = () => {
    router.push("/templates")
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading template...</p>
      </div>
    )
  }

  if (!template) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">Template not found</p>
        <Link href="/templates">
          <Button variant="outline" className="gap-1 bg-transparent">
            <ArrowLeft className="w-4 h-4" />
            Back to Templates
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <TemplateBuilder
      template={template}
      onSave={handleSave}
      onCancel={handleCancel}
    />
  )
}
