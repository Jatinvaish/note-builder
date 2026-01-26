import { fetcher } from "@/lib/services/fetcher"

export interface TemplateApiData {
  id?: number
  templateName: string
  templateDescription?: string
  templateType: string
  templateContent: any
  groups: any[]
  versionHistory?: any[]
  status: string
}

export interface TemplateListItem {
  id: number
  templateName: string
  templateDescription?: string
  templateType: string
  groups: any[]
  versionHistoryCount: number
  status: string
  tenantId: number
  createdAt: string
  createdBy: number
  updatedAt: string
  updatedBy: number
}

export const templateApi = {
  // Save or update template (if id is provided, it updates; otherwise creates new)
  async save(template: TemplateApiData) {
    const response = await fetcher({ path: "/api/templates/save" }, { json: template })
    return response?.template || response
  },

  // Get all templates for current tenant (without templateContent)
  async list(): Promise<TemplateListItem[]> {
    return await fetcher({ path: "/api/templates/list" }, { json: {} })
  },

  // Get only active templates (without templateContent)
  async listActive(): Promise<TemplateListItem[]> {
    return await fetcher({ path: "/api/templates/list-active" }, { json: {} })
  },

  // Get templates by type (normal, navigation_callback, etc.) (without templateContent)
  async listByType(templateType: string): Promise<TemplateListItem[]> {
    return await fetcher({ path: "/api/templates/list-by-type" }, { json: { templateType } })
  },

  // Get single template by id (with full templateContent)
  async view(id: number) {
    return await fetcher({ path: "/api/templates/view" }, { json: { id } })
  },

  // Soft delete template (sets status to 'deleted')
  async delete(id: number) {
    return await fetcher({ path: "/api/templates/delete" }, { json: { id } })
  },

  // Activate template (sets status to 'active')
  async activate(id: number) {
    return await fetcher({ path: "/api/templates/activate" }, { json: { id } })
  },

  // Deactivate template (sets status to 'inactive')
  async deactivate(id: number) {
    return await fetcher({ path: "/api/templates/deactivate" }, { json: { id } })
  },

  // Duplicate template (creates a copy with "(Copy)" suffix)
  async duplicate(id: number) {
    const response = await fetcher({ path: "/api/templates/duplicate" }, { json: { id } })
    return response?.template || response
  },

  // Get version history for a template
  async versionHistory(id: number) {
    return await fetcher({ path: "/api/templates/version-history" }, { json: { id } })
  },

  // Restore template to a specific version
  async restoreVersion(templateId: number, version: number) {
    const response = await fetcher({ path: "/api/templates/restore-version" }, { json: { templateId, version } })
    return response?.template || response
  },
}
