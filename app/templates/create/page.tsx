"use client"

import dynamic from "next/dynamic"
import { useRouter } from "next/navigation"
import { templateApi } from "@/services/template-api"
import type { Template } from "@/lib/types"
import { useToast } from "@/hooks/use-toast"

const TemplateBuilder = dynamic(() => import("@/components/template-builder").then(m => ({ default: m.TemplateBuilder })), {
  ssr: false,
  loading: () => <div className="flex items-center justify-center h-screen text-sm text-muted-foreground">Loading editor...</div>,
})

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
