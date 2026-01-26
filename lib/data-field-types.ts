// Enhanced data field types with dynamic actions and auto-fill capabilities

export type ActionType = 'API_CALL' | 'MODEL_OPEN' | 'CONTEXT_API'

export interface DataFieldAction {
  type: ActionType
  api_call_in_page: boolean
  api: string
  oncallback_autofill_value: boolean
}

export interface CallTime {
  on_render_page: boolean
  on_click_element: boolean
}

export interface GroupOf {
  group_auto_fill_input: boolean
  api_group_available: boolean
  model_group_available: boolean
  group_autofill_ids: Array<{ id: string }>
}

export interface EnhancedDataField {
  id: string
  label: string
  category: string
  actions?: DataFieldAction
  call_time?: CallTime
  autofill_after_value_get?: boolean
  depend_value_on_other?: boolean
  group_of?: GroupOf
}

// Legacy support - simple data field
export interface SimpleDataField {
  id: string
  label: string
  category: string
}

export type DataField = EnhancedDataField | SimpleDataField

// Type guard to check if field is enhanced
export function isEnhancedDataField(field: DataField): field is EnhancedDataField {
  return 'actions' in field || 'call_time' in field
}
