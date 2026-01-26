export interface FormElement {
  elementType: "input" | "checkbox" | "select" | "datetime" | "signature" | "textarea" | "speech" | "voice_to_text" | "dropdown" | "numeric" | "multiselect"
  label: string
  elementKey: string
  defaultValue: string | boolean
  defaultDatetime?: string
  required: boolean
  placeholder?: string
  helpText?: string
  metadata?: Record<string, any>
  hasMic?: boolean
  options?: SelectOptions | string[]
  group_id?: string | null
  data_binding?: DataBinding | null
  dataField?: string
}

export interface DataBinding {
  type: "manual" | "api"
  source?: string // e.g., "appointment.date", "admission.date"
  apiEndpoint?: string
  fallbackValue?: string
}

export interface ClinicalContext {
  appointmentDate?: string
  admissionDate?: string
  patientId?: number
  admissionId?: number
  clinicianId?: string
  [key: string]: any
}

export interface SelectOptions {
  source: "static" | "api"
  values?: string[]
  endpoint?: string
}

export interface TemplateVersion {
  version: number
  timestamp: string
  templateContent: TemplateContent
  changedFields?: string[]
}

export interface Template {
  id: string
  templateName: string
  templateDescription: string
  templateType: "normal" | "navigation_callback"
  templateContent: TemplateContent
  versionHistory: TemplateVersion[]
  createdAt: string
  updatedAt: string
  // New properties (PR-0+)
  status?: "active" | "inactive"
  groups?: Group[]
}

export interface Group {
  id: string
  group_name: string
  name?: string
  status: "active" | "inactive"
  order_by: number
}

export interface TemplateContent {
  type: "doc"
  content: ContentNode[]
}

export interface ContentNode {
  type: "heading" | "paragraph" | "bulletList" | "orderedList" | "formElement"
  attrs?: Record<string, unknown>
  content?: ContentNode[] | TextNode[]
}

export interface TextNode {
  type: "text"
  text: string
  marks?: Mark[]
}

export interface Mark {
  type: "bold" | "italic"
}

export interface ConsultationNote {
  id: string
  templateId: string
  templateVersionId?: number // PR-8: Version pinning (snapshot of template at time of note creation)
  templateName: string
  consultationData: Record<string, any>
  versionHistory: VersionEntry[]
  isActive?: boolean
  createdAt: string
  updatedAt: string
}

export interface VersionEntry {
  version: number
  timestamp: string
  data: Record<string, any>
  changedFields?: string[]
}
