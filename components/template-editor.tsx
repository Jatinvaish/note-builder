"use client"
import type { Template } from "@/lib/types"
import { FreeFormEditor } from "./free-form-editor"

interface TemplateEditorProps {
  template?: Template
  onSave: (template: Template) => Promise<void>
  onCancel: () => void
}

export function TemplateEditor({ template, onSave, onCancel }: TemplateEditorProps) {
  return <FreeFormEditor template={template} onSave={onSave} onCancel={onCancel} />
}
