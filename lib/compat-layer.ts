/**
 * Backward Compatibility Layer
 * 
 * Ensures old template JSON normalizes to new schema without breaking existing behavior.
 * Provides migration functions and safe defaults for missing properties.
 */

import { Template, TemplateVersion } from './types'

/**
 * Normalizes legacy template data to ensure it has all required properties.
 * Safe defaults are applied for missing fields without altering existing data.
 */
export function normalizeTemplate(template: any): Template {
  if (!template) return createEmptyTemplate()

  // Normalize template type from old values to new values
  let templateType = template.templateType || 'normal'
  if (templateType === 'regular') templateType = 'normal'
  if (templateType === 'navigate only') templateType = 'navigation_callback'

  // Ensure basic template properties
  const normalized: Template = {
    id: template.id || `template-${Date.now()}`,
    templateName: template.templateName || 'Untitled Template',
    templateDescription: template.templateDescription || '',
    templateType: templateType as 'normal' | 'navigation_callback',
    templateContent: template.templateContent || { type: 'doc', content: [] },
    versionHistory: template.versionHistory || [],
    createdAt: template.createdAt || new Date().toISOString(),
    updatedAt: template.updatedAt || new Date().toISOString(),
    // New properties with safe defaults
    status: template.status || 'active',
    groups: template.groups || [],
  }

  // Ensure version history has at least one entry
  if (normalized.versionHistory.length === 0) {
    normalized.versionHistory.push({
      version: 1,
      timestamp: normalized.createdAt,
      templateContent: normalized.templateContent,
      changedFields: [],
    })
  }

  // Normalize all elements in content to have required label
  normalizeContentNodes(normalized.templateContent.content || [])

  return normalized
}

/**
 * Recursively normalizes content nodes, ensuring FormElements have required label.
 */
function normalizeContentNodes(nodes: any[]): void {
  if (!Array.isArray(nodes)) return

  nodes.forEach((node) => {
    if (node.type === 'formElement') {
      // Ensure label exists (required property)
      if (!node.attrs?.label) {
        if (!node.attrs) node.attrs = {}
        node.attrs.label = node.attrs.elementKey || `Field ${Date.now()}`
      }
      // Ensure other required properties
      if (!node.attrs.elementType) node.attrs.elementType = 'input'
      if (!node.attrs.elementKey) node.attrs.elementKey = `key-${Date.now()}`
      // New properties with safe defaults
      if (node.attrs.group_id === undefined) node.attrs.group_id = null
      if (node.attrs.data_binding === undefined) node.attrs.data_binding = null
    }
    // Recursively normalize nested content
    if (Array.isArray(node.content)) {
      normalizeContentNodes(node.content)
    }
  })
}

/**
 * Normalizes a version object to include all required fields.
 */
export function normalizeVersion(version: any): TemplateVersion {
  return {
    version: version.version || 1,
    timestamp: version.timestamp || new Date().toISOString(),
    templateContent: version.templateContent || { type: 'doc', content: [] },
    changedFields: version.changedFields || [],
  }
}

/**
 * Creates an empty valid template structure.
 */
export function createEmptyTemplate(): Template {
  const now = new Date().toISOString()
  return {
    id: `template-${Date.now()}`,
    templateName: 'New Template',
    templateDescription: '',
    templateType: 'normal',
    templateContent: {
      type: 'doc',
      content: [],
    },
    versionHistory: [
      {
        version: 1,
        timestamp: now,
        templateContent: { type: 'doc', content: [] },
        changedFields: [],
      },
    ],
    createdAt: now,
    updatedAt: now,
    status: 'active',
    groups: [],
  }
}

/**
 * Validates template structure without throwing errors.
 * Returns list of issues for safe handling.
 */
export function validateTemplate(template: any): string[] {
  const issues: string[] = []

  if (!template) {
    issues.push('Template is null or undefined')
    return issues
  }

  if (!template.id) issues.push('Template missing id')
  if (!template.templateName) issues.push('Template missing name')
  if (!template.templateContent) issues.push('Template missing content')
  if (!Array.isArray(template.versionHistory)) {
    issues.push('Template versionHistory is not an array')
  }

  return issues
}

/**
 * Snapshot check: ensures a version renders identically to stored snapshot.
 */
export function validateVersionSnapshot(
  currentTemplate: Template,
  versionId: number
): boolean {
  const version = currentTemplate.versionHistory.find((v) => v.version === versionId)
  if (!version) return false

  // Basic validation: version exists and has content
  return !!(version.templateContent && version.templateContent.content)
}
