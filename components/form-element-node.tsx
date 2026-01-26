"use client"
import { NodeViewWrapper } from "@tiptap/react"
import { Settings } from "lucide-react"

interface FormElementNodeProps {
  node: any
  updateAttributes: (attrs: Record<string, any>) => void
  deleteNode: () => void
}

const ELEMENT_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  input: { bg: "bg-blue-50", border: "border-blue-200", text: "text-blue-700" },
  checkbox: { bg: "bg-green-50", border: "border-green-200", text: "text-green-700" },
  select: { bg: "bg-purple-50", border: "border-purple-200", text: "text-purple-700" },
  textarea: { bg: "bg-amber-50", border: "border-amber-200", text: "text-amber-700" },
  datetime: { bg: "bg-orange-50", border: "border-orange-200", text: "text-orange-700" },
  signature: { bg: "bg-pink-50", border: "border-pink-200", text: "text-pink-700" },
  voice: { bg: "bg-indigo-50", border: "border-indigo-200", text: "text-indigo-700" },
}

export function FormElementNode({ node }: FormElementNodeProps) {
  const { elementType, label, elementKey, required, defaultValue } = node.attrs
  const colors = ELEMENT_COLORS[elementType] || ELEMENT_COLORS.input
  
  let displayValue = defaultValue || "[Empty]"
  let isSignature = false
  
  // Format datetime for display
  if (elementType === "datetime" && defaultValue) {
    try {
      const date = new Date(defaultValue)
      if (!isNaN(date.getTime())) {
        const day = String(date.getDate()).padStart(2, '0')
        const month = String(date.getMonth() + 1).padStart(2, '0')
        const year = date.getFullYear()
        let hours = date.getHours()
        const minutes = String(date.getMinutes()).padStart(2, '0')
        const ampm = hours >= 12 ? 'PM' : 'AM'
        hours = hours % 12 || 12
        displayValue = `${day}-${month}-${year} ${hours}:${minutes} ${ampm}`
      }
    } catch {}
  }
  
  if (elementType === "signature" && defaultValue) {
    try {
      const paths = JSON.parse(defaultValue)
      if (Array.isArray(paths) && paths.length > 0) {
        isSignature = true
      }
    } catch {}
  }

  return (
    <NodeViewWrapper className="inline-flex items-center gap-1">
      <span
        data-form-element="true"
        data-element-key={elementKey}
        className={`inline-flex items-center gap-2 px-2.5 py-1 rounded border text-xs font-medium ${colors.bg} ${colors.border} ${colors.text}`}
      >
        <Settings className="w-3 h-3" />
        <span className="font-semibold">{label}:</span>
        {isSignature ? (
          <svg width="80" height="30" className="inline-block">
            {(() => {
              try {
                const paths = JSON.parse(defaultValue)
                return Array.isArray(paths) && paths.map((path: string, i: number) => (
                  <path key={i} d={path} stroke="#000" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                ))
              } catch {
                return null
              }
            })()}
          </svg>
        ) : (
          <span className={defaultValue ? "" : "italic opacity-60"}>{displayValue}</span>
        )}
        {required && <span className="text-red-500">*</span>}
      </span>
    </NodeViewWrapper>
  )
}
