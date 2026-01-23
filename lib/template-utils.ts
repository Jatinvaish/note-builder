import type { FormElement, Template, TemplateContent } from "./types"

export const FORM_ELEMENT_TYPES = [
  { id: "input", label: "Text Input", description: "Single line text field" },
  { id: "textarea", label: "Text Area", description: "Multi-line text field" },
  { id: "checkbox", label: "Checkbox", description: "Yes/No selection" },
  { id: "select", label: "Dropdown", description: "Select from options" },
  { id: "datetime", label: "Date & Time", description: "Date/time picker" },
  { id: "signature", label: "Signature", description: "Signature field" },
] as const

export function generateElementKey(elementType: string): string {
  return `${elementType}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

export function createFormElement(elementType: string, overrides?: Partial<FormElement>): FormElement {
  return {
    elementType: elementType as FormElement["elementType"],
    label: `${elementType.charAt(0).toUpperCase() + elementType.slice(1)} Field`,
    elementKey: generateElementKey(elementType),
    defaultValue: "",
    required: false,
    options: elementType === "select" ? { source: "static", values: [] } : undefined,
    ...overrides,
  }
}

export function extractFormElements(content: TemplateContent): FormElement[] {
  const elements: FormElement[] = []

  function traverse(nodes: any[]): void {
    if (!nodes) return
    nodes.forEach((node) => {
      if (node.type === "formElement" && node.attrs) {
        elements.push(node.attrs as FormElement)
      }
      if (node.content) {
        traverse(node.content)
      }
    })
  }

  traverse(content.content)
  return elements
}

const { saveTemplate: saveToStorage, getTemplates, deleteTemplate: deleteFromStorage } = require("./template-storage")

export function saveTemplate(template: Template): Promise<Template> {
  return saveToStorage(template)
}

export function fetchTemplates(): Promise<Template[]> {
  return getTemplates()
}

export function deleteTemplate(templateId: string): Promise<void> {
  deleteFromStorage(templateId)
  return Promise.resolve()
}
