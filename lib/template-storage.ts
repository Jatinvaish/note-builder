import type { Template } from './types'

export const STORAGE_KEY = "templates"

function normalizeTemplate(template: any): Template {
  return {
    id: template.id || `template-${Date.now()}`,
    templateName: template.templateName || 'Untitled',
    templateDescription: template.templateDescription || '',
    templateType: template.templateType || 'normal',
    templateContent: template.templateContent || { type: 'doc', content: [] },
    versionHistory: template.versionHistory || [],
    createdAt: template.createdAt || new Date().toISOString(),
    updatedAt: template.updatedAt || new Date().toISOString(),
    status: template.status || 'active',
    groups: template.groups || [],
  }
}

export function getTemplates(): Template[] {
  if (typeof window === "undefined") return []
  const stored = localStorage.getItem(STORAGE_KEY)
  if (!stored) return []
  
  try {
    const templates = JSON.parse(stored)
    // Normalize all templates on load for backward compatibility
    return Array.isArray(templates) ? templates.map(normalizeTemplate) : []
  } catch {
    return []
  }
}

export function saveTemplate(template: any): Template {
  if (typeof window === "undefined") return template
  
  const normalized = normalizeTemplate(template)
  const templates = getTemplates()
  const index = templates.findIndex((t: any) => t.id === normalized.id)

  if (!normalized.versionHistory) {
    normalized.versionHistory = []
  }

  const existingTemplate = index >= 0 ? templates[index] : null
  
  if (existingTemplate) {
    const contentChanged = JSON.stringify(existingTemplate.templateContent) !== JSON.stringify(normalized.templateContent)
    
    if (contentChanged) {
      const newVersion = {
        version: normalized.versionHistory.length + 1,
        timestamp: new Date().toISOString(),
        templateContent: normalized.templateContent,
        changedFields: [],
      }
      normalized.versionHistory.push(newVersion)
    }
  } else {
    normalized.versionHistory.push({
      version: 1,
      timestamp: new Date().toISOString(),
      templateContent: normalized.templateContent,
      changedFields: [],
    })
  }

  normalized.updatedAt = new Date().toISOString()

  if (index >= 0) {
    templates[index] = normalized
  } else {
    templates.push(normalized)
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(templates))
  return normalized
}

export function getTemplate(templateId: string): Template | null {
  if (typeof window === "undefined") return null
  const templates = getTemplates()
  return templates.find((t: any) => t.id === templateId) || null
}

export function getTemplateVersion(templateId: string, versionId: number): Template | null {
  if (typeof window === "undefined") return null
  const template = getTemplate(templateId)
  if (!template) return null
  
  const version = template.versionHistory.find((v) => v.version === versionId)
  if (!version) return null
  
  // Return a snapshot of the template at that version
  return {
    ...template,
    templateContent: version.templateContent,
  }
}

export function deleteTemplate(templateId: string) {
  if (typeof window === "undefined") return
  const templates = getTemplates()
  const filtered = templates.filter((t: any) => t.id !== templateId)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered))
}

export function getTemplateNoteCount(templateId: string) {
  if (typeof window === "undefined") return 0
  const notes = localStorage.getItem("notes")
  const notesList = notes ? JSON.parse(notes) : []
  return notesList.filter((n: any) => n.templateId === templateId).length
}
