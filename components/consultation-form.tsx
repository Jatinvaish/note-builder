"use client"

import { useState } from "react"
import type { Template } from "@/lib/types"
import { TemplateRenderer } from "@/components/template-renderer"

interface ConsultationFormProps {
  template: Template
  onDataChange: (data: Record<string, any>) => void
}

export function ConsultationForm({ template, onDataChange }: ConsultationFormProps) {
  const [data, setData] = useState<Record<string, any>>({})

  const handleInputChange = (key: string, value: any) => {
    const updated = { ...data, [key]: value }
    setData(updated)
    onDataChange(updated)
  }

  return <TemplateRenderer template={template} onDataChange={handleInputChange} data={data} isEditable />
}
