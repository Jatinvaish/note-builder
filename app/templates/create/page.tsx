"use client"

import { TemplateBuilder } from "@/components/template-builder"
import { useRouter } from "next/navigation"
import { saveTemplate } from "@/lib/template-storage"
import type { Template } from "@/lib/types"

export default function CreateTemplatePage() {
  const router = useRouter()

  const handleSave = async (template: Template) => {
    try {
      saveTemplate(template)
      router.push("/templates")
    } catch (error) {
      console.error("Failed to save template:", error)
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
