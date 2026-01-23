"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import Link from "next/link"
import { getTemplate } from "@/lib/template-storage"
import { TemplateBuilder } from "@/components/template-builder"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import type { Template } from "@/lib/types"

export default function EditTemplatePage() {
  const router = useRouter()
  const params = useParams()
  const templateId = params.templateId as string
  const [template, setTemplate] = useState<Template | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (templateId) {
      const t = getTemplate(templateId)
      if (t) {
        setTemplate(t)
      }
      setLoading(false)
    }
  }, [templateId])

  const handleSave = async (savedTemplate: Template) => {
    router.push("/templates")
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
