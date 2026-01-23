"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import type { Template, ClinicalContext } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Mic, MicOff } from "lucide-react"
import { getBindingResolver } from "@/lib/binding-service"

interface TemplateRendererProps {
  template: Template
  onDataChange: (key: string, value: any) => void
  data: Record<string, any>
  isEditable?: boolean
  clinicalContext?: ClinicalContext
  readOnly?: boolean
}

export function TemplateRenderer({ 
  template, 
  onDataChange, 
  data, 
  isEditable = false,
  clinicalContext,
  readOnly = false 
}: TemplateRendererProps) {
  const [recordingKey, setRecordingKey] = useState<string | null>(null)
  const [boundData, setBoundData] = useState<Record<string, any>>({})
  const recognitionRef = useRef<any>(null)
  const bindingResolver = getBindingResolver()

  // Resolve data bindings on mount and when clinical context changes
  useEffect(() => {
    const resolveBindings = async () => {
      if (!template.templateContent?.content) return

      const resolved: Record<string, any> = {}
      const nodes = template.templateContent.content

      const processNode = async (node: any) => {
        if (node.type === 'formElement' && node.attrs?.data_binding) {
          const fieldKey = node.attrs.elementKey
          const binding = node.attrs.data_binding
          const value = await bindingResolver.resolveBinding(binding, clinicalContext)
          if (value && !data[fieldKey]) {
            resolved[fieldKey] = value
          }
        }
        if (Array.isArray(node.content)) {
          for (const child of node.content) {
            await processNode(child)
          }
        }
      }

      for (const node of nodes) {
        await processNode(node)
      }

      setBoundData(resolved)
    }

    resolveBindings()
  }, [template, clinicalContext, bindingResolver, data])

  const startSpeechRecognition = (fieldKey: string) => {
    if (!("webkitSpeechRecognition" in window) && !("SpeechRecognition" in window)) {
      alert("Speech recognition not supported in this browser")
      return
    }

    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition
    const recognition = new SpeechRecognition()

    recognition.continuous = false
    recognition.interimResults = false
    recognition.lang = "en-US"

    recognition.onstart = () => {
      setRecordingKey(fieldKey)
    }

    recognition.onresult = (event: any) => {
      const transcript = Array.from(event.results)
        .map((result: any) => result[0].transcript)
        .join("")

      onDataChange(fieldKey, transcript)
      setRecordingKey(null)
    }

    recognition.onerror = () => {
      setRecordingKey(null)
    }

    recognition.onend = () => {
      setRecordingKey(null)
    }

    recognition.start()
    recognitionRef.current = recognition
  }

  const stopSpeechRecognition = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop()
      setRecordingKey(null)
    }
  }

  const renderContent = (content: any[]): React.ReactNode[] => {
    if (!content || !Array.isArray(content)) return []

    return content.map((node, index) => {
      if (!node || !node.type) return null

      // Handle text nodes
      if (node.type === "text") {
        let element: React.ReactNode = node.text || ""
        if (node.marks) {
          node.marks.forEach((mark: any) => {
            if (mark.type === "bold") element = <strong key={`${index}-b`}>{element}</strong>
            if (mark.type === "italic") element = <em key={`${index}-i`}>{element}</em>
          })
        }
        return <span key={index}>{element}</span>
      }

      // Handle heading
      if (node.type === "heading") {
        const level = Math.min((node.attrs?.level || 1) + 1, 6)
        const HeadingTag = `h${level}` as const
        return (
          <HeadingTag key={index} className="font-bold my-3 text-lg">
            {renderContent(node.content || [])}
          </HeadingTag>
        )
      }

      // Handle paragraph
      if (node.type === "paragraph") {
        const textAlign = node.attrs?.textAlign
        return (
          <p
            key={index}
            className={`my-2 leading-relaxed ${textAlign === "center" ? "text-center" : textAlign === "right" ? "text-right" : ""}`}
          >
            {renderContent(node.content || [])}
          </p>
        )
      }

      // Handle bullet list
      if (node.type === "bulletList") {
        return (
          <ul key={index} className="list-disc list-inside my-2 ml-4">
            {node.content?.map((item: any, i: number) => (
              <li key={i} className="my-1">
                {renderContent(item.content || [])}
              </li>
            ))}
          </ul>
        )
      }

      // Handle ordered list
      if (node.type === "orderedList") {
        return (
          <ol key={index} className="list-decimal list-inside my-2 ml-4">
            {node.content?.map((item: any, i: number) => (
              <li key={i} className="my-1">
                {renderContent(item.content || [])}
              </li>
            ))}
          </ol>
        )
      }

      // Handle code block
      if (node.type === "codeBlock") {
        return (
          <pre key={index} className="bg-muted p-3 rounded my-2 overflow-auto">
            <code className="text-xs font-mono">{renderContent(node.content || [])}</code>
          </pre>
        )
      }

      // Handle form elements (with inline/flow rendering support - PR-3)
      if (node.type === "formElement") {
        const element = node.attrs?.element || node.attrs || {}
        const fieldKey = element.elementKey || `field-${index}`
        const finalValue = data[fieldKey] || boundData[fieldKey] || element.defaultValue || ''

        // Read-only display mode (for preview/print)
        if (!isEditable || readOnly) {
          return (
            <span key={index} className="inline-flex items-center gap-1 px-2 py-1 rounded border border-primary bg-primary/10 text-xs font-medium">
              <span>{element.label}</span>
              {element.required && <span className="text-destructive">*</span>}
              {finalValue && <span className="ml-1 text-xs font-normal text-foreground">({finalValue})</span>}
            </span>
          )
        }

        switch (element.elementType) {
          case "input":
            return (
              <span key={index} className="inline-flex items-center gap-2">
                <input
                  type="text"
                  value={finalValue}
                  onChange={(e) => onDataChange(fieldKey, e.target.value)}
                  placeholder={element.label}
                  disabled={readOnly}
                  className="px-2 py-1 text-sm rounded border border-border focus:outline-none focus:ring-2 focus:ring-ring w-32"
                />
                {(element.hasMic || element.elementType === 'speech') && !readOnly && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      if (recordingKey === fieldKey) {
                        stopSpeechRecognition()
                      } else {
                        startSpeechRecognition(fieldKey)
                      }
                    }}
                    className="gap-1"
                  >
                    {recordingKey === fieldKey ? (
                      <>
                        <MicOff className="w-3 h-3" />
                        Stop
                      </>
                    ) : (
                      <>
                        <Mic className="w-3 h-3" />
                        Speak
                      </>
                    )}
                  </Button>
                )}
              </span>
            )

          case "textarea":
            return (
              <textarea
                key={index}
                value={data[fieldKey] || ""}
                onChange={(e) => onDataChange(fieldKey, e.target.value)}
                placeholder={element.label}
                className="w-full px-3 py-2 text-sm rounded border border-border focus:outline-none focus:ring-2 focus:ring-ring my-2"
                rows={3}
              />
            )

          case "checkbox":
            return (
              <label key={index} className="flex items-center gap-2 cursor-pointer my-2">
                <input
                  type="checkbox"
                  checked={data[fieldKey] === "true" || data[fieldKey] === true}
                  onChange={(e) => onDataChange(fieldKey, e.target.checked ? "true" : "false")}
                  className="h-4 w-4 rounded border border-border"
                />
                <span className="text-sm">{element.label}</span>
                {element.required && <span className="text-destructive">*</span>}
              </label>
            )

          case "select":
            return (
              <select
                key={index}
                value={data[fieldKey] || ""}
                onChange={(e) => onDataChange(fieldKey, e.target.value)}
                className="px-3 py-2 text-sm rounded border border-border focus:outline-none focus:ring-2 focus:ring-ring my-2 w-full"
              >
                <option value="">{element.label}</option>
                {element.options?.source === "static" &&
                  element.options.values?.map((val: string, i: number) => (
                    <option key={i} value={val}>
                      {val}
                    </option>
                  ))}
              </select>
            )

          case "datetime":
            return (
              <input
                key={index}
                type="datetime-local"
                value={data[fieldKey] || ""}
                onChange={(e) => onDataChange(fieldKey, e.target.value)}
                className="px-3 py-2 text-sm rounded border border-border focus:outline-none focus:ring-2 focus:ring-ring my-2"
              />
            )

          case "signature":
            return (
              <div key={index} className="my-2 p-3 border-b-2 border-dashed border-border text-xs text-muted-foreground">
                Signature: {element.label}
              </div>
            )

          case "speech":
            return (
              <div key={index} className="flex items-center gap-2 my-2">
                <input
                  type="text"
                  value={data[fieldKey] || ""}
                  onChange={(e) => onDataChange(fieldKey, e.target.value)}
                  placeholder={element.label}
                  className="px-3 py-2 text-sm rounded border border-border focus:outline-none focus:ring-2 focus:ring-ring min-w-48"
                />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    if (recordingKey === fieldKey) {
                      stopSpeechRecognition()
                    } else {
                      startSpeechRecognition(fieldKey)
                    }
                  }}
                  className="gap-1"
                >
                  {recordingKey === fieldKey ? (
                    <>
                      <MicOff className="w-3 h-3" />
                      Stop
                    </>
                  ) : (
                    <>
                      <Mic className="w-3 h-3" />
                      Speak
                    </>
                  )}
                </Button>
              </div>
            )

          default:
            return null
        }
      }

      return null
    })
  }

  return (
    <div className="space-y-3">
      {template?.templateContent?.content && Array.isArray(template.templateContent.content) ? (
        renderContent(template.templateContent.content)
      ) : (
        <p className="text-sm text-muted-foreground">No template content available</p>
      )}
    </div>
  )
}
