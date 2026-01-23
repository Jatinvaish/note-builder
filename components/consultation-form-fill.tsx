"use client"

import { useState, useEffect } from "react"
import { getTemplate } from "@/lib/template-storage"
import type { Template } from "@/lib/types"
import { TemplateRenderer } from "@/components/template-renderer"

interface ConsultationFormFillProps {
  templateId: string
  initialData: Record<string, any>
  onDataChange: (data: Record<string, any>) => void
}

export function ConsultationFormFill({ templateId, initialData, onDataChange }: ConsultationFormFillProps) {
  const [template, setTemplate] = useState<Template | null>(null)
  const [data, setData] = useState<Record<string, any>>(initialData)

  useEffect(() => {
    const t = getTemplate(templateId)
    setTemplate(t)
    setData(initialData)
  }, [templateId, initialData])

  const handleInputChange = (key: string, value: any) => {
    const updated = { ...data, [key]: value }
    setData(updated)
    onDataChange(updated)
  }

  if (!template) return <p className="text-muted-foreground">Loading template...</p>

  return <TemplateRenderer template={template} onDataChange={handleInputChange} data={data} isEditable />
}
