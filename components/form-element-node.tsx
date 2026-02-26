"use client"
import { NodeViewWrapper } from "@tiptap/react"
import { Settings, Mic, MicOff } from "lucide-react"
import { PREDEFINED_DATA_FIELDS } from "@/lib/predefined-data-fields"
import { isEnhancedDataField } from "@/lib/data-field-types"
import { useState, useEffect, useRef, useCallback, useMemo, memo } from "react"
import { fetcher } from "@/lib/services/fetcher"

// Module-level cache for API options
const apiOptionsCache: Record<string, { value: string; label: string }[]> = {}

interface FormElementNodeProps {
  node: any
  updateAttributes: (attrs: Record<string, any>) => void
  deleteNode: () => void
  editor: any
}

const ELEMENT_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  input: { bg: "bg-blue-50", border: "border-blue-200", text: "text-blue-700" },
  checkbox: { bg: "bg-green-50", border: "border-green-200", text: "text-green-700" },
  select: { bg: "bg-purple-50", border: "border-purple-200", text: "text-purple-700" },
  multiselect: { bg: "bg-purple-50", border: "border-purple-200", text: "text-purple-700" },
  textarea: { bg: "bg-amber-50", border: "border-amber-200", text: "text-amber-700" },
  datetime: { bg: "bg-orange-50", border: "border-orange-200", text: "text-orange-700" },
  signature: { bg: "bg-pink-50", border: "border-pink-200", text: "text-pink-700" },
  voice_to_text: { bg: "bg-indigo-50", border: "border-indigo-200", text: "text-indigo-700" },
  numeric: { bg: "bg-cyan-50", border: "border-cyan-200", text: "text-cyan-700" },
  datatable: { bg: "bg-teal-50", border: "border-teal-200", text: "text-teal-700" },
}

// Detect if we're in note context (editor has note-mode storage flag)
function isNoteContext(editor: any): boolean {
  try {
    return editor?.storage?.noteMode === true
  } catch {
    return false
  }
}

export const FormElementNode = memo(function FormElementNode({ node, updateAttributes, deleteNode, editor }: FormElementNodeProps) {
  const {
    elementType, label, elementKey, required, defaultValue, dataField,
    showTimeOnly, is_read_only, is_visible, options, placeholder,
    minLength, maxLength, pattern, min, max, step,
  } = node.attrs

  const [isRecording, setIsRecording] = useState(false)
  const [dynamicOptions, setDynamicOptions] = useState<{ value: string; label: string }[]>([])
  const recognitionRef = useRef<any>(null)
  const isEditingRef = useRef(false)
  const handleChangeRef = useRef<(val: string) => void>(() => {})

  // Memoize expensive field config lookup (PREDEFINED_DATA_FIELDS is ~270 items)
  const fieldConfig = useMemo(
    () => dataField ? PREDEFINED_DATA_FIELDS.find(f => f.id === dataField) : null,
    [dataField]
  )

  // Memoize derived values from fieldConfig
  const { isModelOpen, apiEndpoint, colors } = useMemo(() => {
    const modelOpen = fieldConfig && isEnhancedDataField(fieldConfig) && fieldConfig.actions?.type === 'MODEL_OPEN'
    const endpoint = fieldConfig && isEnhancedDataField(fieldConfig) && fieldConfig.actions?.type === 'API_CALL'
      ? fieldConfig.actions.api
      : null
    let c = ELEMENT_COLORS[elementType] || ELEMENT_COLORS.input
    if (dataField && fieldConfig) {
      if (modelOpen) {
        c = { bg: "bg-red-50", border: "border-red-300", text: "text-red-700" }
      } else if (endpoint) {
        c = { bg: "bg-emerald-50", border: "border-emerald-300", text: "text-emerald-700" }
      }
    }
    return { isModelOpen: modelOpen, apiEndpoint: endpoint, colors: c }
  }, [fieldConfig, elementType, dataField])

  // Load dynamic API options
  useEffect(() => {
    if (!apiEndpoint) return
    if (apiOptionsCache[apiEndpoint]) {
      setDynamicOptions(apiOptionsCache[apiEndpoint])
      return
    }
    const fetchOptions = async () => {
      try {
        const res = await fetcher({ path: `/${apiEndpoint}` }, { json: { keywords: "" } })
        if (res?.success && Array.isArray(res.data)) {
          const opts = res.data.map((item: any) => {
            if (typeof item === 'string') return { value: item, label: item }
            if (apiEndpoint.includes('doctor')) {
              const name = `${item.first_name || ''} ${item.last_name || ''}`.trim()
              return { value: name, label: name }
            }
            const lbl = item.label || item.name || item.text || item.title || item.id || JSON.stringify(item)
            const val = item.value || item.id || lbl
            return { value: val, label: lbl }
          })
          apiOptionsCache[apiEndpoint] = opts
          setDynamicOptions(opts)
        }
      } catch (error) {
        console.error("Error fetching dynamic options:", error)
      }
    }
    fetchOptions()
  }, [apiEndpoint])

  // Setup speech recognition
  useEffect(() => {
    if (elementType !== 'voice_to_text') return
    if (typeof window !== 'undefined' && 'webkitSpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition
      recognitionRef.current = new SpeechRecognition()
      recognitionRef.current.continuous = true
      recognitionRef.current.interimResults = true
      recognitionRef.current.lang = 'en-US'

      recognitionRef.current.onresult = (event: any) => {
        let transcript = ''
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript
        }
        const current = defaultValue || ''
        handleChangeRef.current(current + ' ' + transcript)
      }

      recognitionRef.current.onerror = () => setIsRecording(false)
      recognitionRef.current.onend = () => setIsRecording(false)
    }
    return () => { recognitionRef.current?.stop() }
  }, [elementType])

  handleChangeRef.current = (val: string) => {
    updateAttributes({ defaultValue: val })
  }

  const toggleRecording = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!recognitionRef.current) return
    if (isRecording) {
      recognitionRef.current.stop()
      setIsRecording(false)
    } else {
      recognitionRef.current.start()
      setIsRecording(true)
    }
  }

  // Visibility check
  if (is_visible === false) return null

  // Format display value
  let displayValue = defaultValue || ""
  let isSignature = false

  if (!defaultValue && dataField && fieldConfig) {
    displayValue = `${fieldConfig.label} (${fieldConfig.category})`
  }

  if (elementType === "checkbox") {
    displayValue = defaultValue === true || defaultValue === "true" ? "☑" : "☐"
  }

  // Format datetime
  if (elementType === "datetime" && defaultValue) {
    try {
      const date = new Date(defaultValue)
      if (!isNaN(date.getTime())) {
        if (showTimeOnly) {
          let hours = date.getHours()
          const minutes = String(date.getMinutes()).padStart(2, '0')
          const ampm = hours >= 12 ? 'PM' : 'AM'
          hours = hours % 12 || 12
          displayValue = `${hours}:${minutes} ${ampm}`
        } else {
          const day = String(date.getDate()).padStart(2, '0')
          const month = String(date.getMonth() + 1).padStart(2, '0')
          const year = date.getFullYear()
          let hours = date.getHours()
          const minutes = String(date.getMinutes()).padStart(2, '0')
          const ampm = hours >= 12 ? 'PM' : 'AM'
          hours = hours % 12 || 12
          displayValue = `${day}-${month}-${year} ${hours}:${minutes} ${ampm}`
        }
      }
    } catch { }
  }

  // Signature display
  if (elementType === "signature" && defaultValue) {
    try {
      const paths = JSON.parse(defaultValue)
      if (Array.isArray(paths) && paths.length > 0) {
        isSignature = true
      }
    } catch {
      // Check if it's a data:image URL
      if (typeof defaultValue === 'string' && defaultValue.startsWith('data:image')) {
        isSignature = true
      }
    }
  }

  // Select/dropdown display
  if ((elementType === "select" || elementType === "dropdown") && defaultValue) {
    // If dynamic options loaded, find the label
    const opt = dynamicOptions.find(o => o.value === defaultValue)
    if (opt) displayValue = opt.label
  }

  return (
    <NodeViewWrapper className="inline-flex items-center gap-1">
      <span
        data-form-element="true"
        data-element-key={elementKey}
        className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded border text-xs font-medium cursor-pointer transition-all hover:ring-2 hover:ring-blue-400 ${colors.bg} ${colors.border} ${colors.text} ${is_read_only ? 'opacity-70' : ''}`}
      >
        <Settings className="w-3 h-3 flex-shrink-0" />

        {isSignature ? (
          typeof defaultValue === 'string' && defaultValue.startsWith('data:image') ? (
            <img src={defaultValue} alt="Signature" className="h-6 inline-block" />
          ) : (
            <svg width="80" height="30" className="inline-block">
              {(() => {
                try {
                  const paths = JSON.parse(defaultValue)
                  return Array.isArray(paths) && paths.map((path: string, i: number) => (
                    <path key={i} d={path} stroke="#000" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                  ))
                } catch { return null }
              })()}
            </svg>
          )
        ) : (
          <span className={defaultValue ? "" : "italic opacity-60"}>
            {displayValue || label || "[Empty]"}
          </span>
        )}

        {required && <span className="text-red-500 text-[10px]">*</span>}

        {isModelOpen && (
          <span className="text-[9px] bg-red-200 text-red-800 px-1 rounded">EXAM</span>
        )}

        {elementType === "voice_to_text" && (
          <button
            onClick={toggleRecording}
            className={`ml-0.5 p-0.5 rounded ${isRecording ? 'bg-red-200' : 'hover:bg-gray-200'}`}
          >
            {isRecording ? <MicOff className="w-3 h-3 text-red-600" /> : <Mic className="w-3 h-3" />}
          </button>
        )}
      </span>
    </NodeViewWrapper>
  )
})
