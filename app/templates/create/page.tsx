"use client"

import { TemplateBuilder } from "@/components/template-builder"
import { useRouter } from "next/navigation"
import { templateApi } from "@/services/template-api"
import type { Template } from "@/lib/types"
import { useToast } from "@/hooks/use-toast"

export default function CreateTemplatePage() {
  const router = useRouter()
  const { toast } = useToast()

  const handleSave = async (template: Template) => {
    try {
      const result = await templateApi.save({
        templateName: template.templateName,
        templateDescription: template.templateDescription,
        templateType: template.templateType,
        templateContent: template.templateContent,
        groups: template.groups,
        versionHistory: template.versionHistory || [],
        status: template.status || "active",
      })
      toast({ title: "Success", description: "Template created successfully" })
      router.push("/templates")
    } catch (error) {
      toast({ title: "Error", description: "Failed to save template", variant: "destructive" })
    }
  }

  const handleCancel = () => {
    router.push("/templates")
  }

  return (
    <TemplateBuilder
      onSave={handleSave}
      onCancel={handleCancel}
    />
  )
}
