export interface FormElement {
  id?: string
  elementType: "input" | "checkbox" | "select" | "datetime" | "signature" | "textarea" | "speech" | "voice_to_text" | "dropdown" | "numeric" | "multiselect" | "datatable" | "Model_open"
  type?: string
  label: string
  elementKey: string
  defaultValue: string | boolean
  defaultDatetime?: string
  required: boolean
  placeholder?: string
  helpText?: string
  metadata?: Record<string, any>
  hasMic?: boolean
  voice_to_text?: boolean
  options?: SelectOptions | string[]
  group_id?: string | null
  groupId?: string | null
  data_binding?: DataBinding | null
  dataBinding?: DataBinding | null
  dataField?: string
  dataFieldKey?: string
  autoFill?: boolean
  showTimeOnly?: boolean
  showDateOnly?: boolean
  is_read_only?: boolean
  is_visible?: boolean
  value?: any
  minLength?: number
  maxLength?: number
  pattern?: string
  min?: number
  max?: number
  step?: number
  validationMessage?: string
  useCurrentDateTime?: boolean
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

export interface TextNode {
  type: "text"
  text: string
  marks?: Mark[]
}

export interface Mark {
  type: "bold" | "italic" | "underline" | "strike" | "link" | "textStyle" | "subscript" | "superscript"
  attrs?: Record<string, any>
}

export interface ConsultationNote {
  id: string
  templateId: string
  templateVersionId?: number
  templateName: string
  patientId?: string
  admissionId?: string | number
  consultationData: Record<string, any>
  data?: Record<string, any>
  noteContent?: any
  status?: string
  versionHistory: VersionEntry[]
  isActive?: boolean
  createdAt: string
  updatedAt: string
}

export interface VersionEntry {
  version: number
  timestamp: string
  data: Record<string, any>
  noteContent?: any
  changedFields?: string[]
}

export interface ContentNode {
  type: "heading" | "paragraph" | "bulletList" | "orderedList" | "formElement" | "table" | "tableRow" | "tableCell" | "tableHeader" | "taskList" | "taskItem" | "image" | "hardBreak"
  attrs?: Record<string, unknown>
  content?: ContentNode[] | TextNode[]
}
