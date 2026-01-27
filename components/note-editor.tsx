"use client"

import { useState, useEffect, useMemo, memo, useRef } from "react"
import { useEditor, EditorContent } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import Underline from "@tiptap/extension-underline"
import Link from "@tiptap/extension-link"
import Image from "@tiptap/extension-image"
import TextAlign from "@tiptap/extension-text-align"
import { TextStyle } from "@tiptap/extension-text-style"
import { Color } from "@tiptap/extension-color"
import { Highlight } from "@tiptap/extension-highlight"
import { FontFamily } from "@tiptap/extension-font-family"
import { Table } from "@tiptap/extension-table"
import TableRow from "@tiptap/extension-table-row"
import TableCell from "@tiptap/extension-table-cell"
import TableHeader from "@tiptap/extension-table-header"
import { FormElementExtension } from "@/lib/tiptap-extensions"
import { Extension } from "@tiptap/core"
import { fetcher } from "@/lib/fetcher"
import { isEnhancedDataField } from "@/lib/data-field-types"
import { Suggestion } from "@tiptap/suggestion"
import { ReactRenderer } from "@tiptap/react"
import tippy from "tippy.js"
import { SuggestionList } from "./suggestion-list"

const FontSize = Extension.create({
  name: 'fontSize',
  addOptions() {
    return {
      types: ['textStyle'],
    }
  },
  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          fontSize: {
            default: null,
            parseHTML: element => element.style.fontSize.replace(/['"]+/g, ''),
            renderHTML: attributes => {
              if (!attributes.fontSize) return {}
              return { style: `font-size: ${attributes.fontSize}` }
            },
          },
        },
      },
    ]
  },
  addCommands() {
    return {
      setFontSize: (fontSize: string) => ({ chain }) => {
        return chain().setMark('textStyle', { fontSize }).run()
      },
      unsetFontSize: () => ({ chain }) => {
        return chain().setMark('textStyle', { fontSize: null }).removeEmptyTextStyle().run()
      },
    }
  },
})
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { Download, Clock, Mic, MicOff } from "lucide-react"
import { PREDEFINED_DATA_FIELDS } from "@/lib/predefined-data-fields"

const SHORTCUT_MAP: Record<string, string> = {
  "dat": "datetime",
  "data": "datetime",
  "da": "datetime",
  "inp": "input",
  "input": "input",
  "chk": "checkbox",
  "check": "checkbox",
  "sel": "select",
  "drop": "select",
  "txt": "textarea",
  "area": "textarea",
  "sig": "signature",
  "voice": "voice_to_text",
  "num": "numeric",
  "number": "numeric",
}

const ELEMENT_TYPES = [
  { id: "input", label: "Text Input" },
  { id: "checkbox", label: "Checkbox" },
  { id: "select", label: "Dropdown" },
  { id: "textarea", label: "Text Area" },
  { id: "datetime", label: "Date/Time" },
  { id: "signature", label: "Signature" },
  { id: "voice_to_text", label: "Voice to Text" },
  { id: "numeric", label: "Numeric Input" },
]

interface NoteEditorProps {
  templates: any[]
  selectedTemplate: any
  formData: Record<string, any>
  onTemplateSelect: (templateId: string) => void
  onDataChange: (key: string, value: any) => void
  onSave: (editorContent: any) => void
  versionHistory?: any[]
  onVersionRestore?: (version: any) => void
  isEditMode?: boolean
  initialContent?: any
  onPhysicalExamClick?: (fieldId: string) => void
}

export function NoteEditor({
  templates,
  selectedTemplate,
  formData,
  onTemplateSelect,
  onDataChange,
  onSave,
  versionHistory = [],
  onVersionRestore,
  isEditMode = false,
  initialContent,
  onPhysicalExamClick
}: NoteEditorProps) {
  const { toast } = useToast()
  const [isVersionDialogOpen, setIsVersionDialogOpen] = useState(false)
  const [isPdfPreviewOpen, setIsPdfPreviewOpen] = useState(false)
  const [pdfHtml, setPdfHtml] = useState("")

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
      Underline,
      TextStyle,
      Color,
      Highlight.configure({ multicolor: true }),
      FontFamily,
      FontSize,
      Link.configure({ openOnClick: false, autolink: true }),
      Image.configure({ HTMLAttributes: { class: "rounded-lg max-w-full" } }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Table.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell,
      FormElementExtension,
      Extension.create({
        name: 'suggestionEx',
        addProseMirrorPlugins() {
          return [
            Suggestion({
              editor: this.editor,
              char: '/',
              allowSpaces: false,
              items: ({ query }: { query: string }) => {
                const items = Object.entries(SHORTCUT_MAP)
                  .filter(([key]) => query.length === 0 || key.startsWith(query.toLowerCase()))
                  .map(([key, typeId]) => typeId)
                return Array.from(new Set(items)).slice(0, 8)
              },
              render: () => {
                let component: ReactRenderer<any>
                let popup: any

                return {
                  onStart: (props: any) => {
                    component = new ReactRenderer(SuggestionList, {
                      props,
                      editor: props.editor,
                    })

                    if (!props.clientRect) return

                    popup = tippy('body', {
                      getReferenceClientRect: props.clientRect,
                      appendTo: () => document.body,
                      content: component.element,
                      showOnCreate: true,
                      interactive: true,
                      trigger: 'manual',
                      placement: 'bottom-start',
                    })
                  },
                  onUpdate(props: any) {
                    component.updateProps(props)
                    if (!props.clientRect) return
                    popup[0].setProps({
                      getReferenceClientRect: props.clientRect,
                    })
                  },
                  onKeyDown(props: any) {
                    if (props.event.key === 'Escape') {
                      popup[0].hide()
                      return true
                    }
                    return component.ref?.onKeyDown(props)
                  },
                  onExit() {
                    popup[0].destroy()
                    component.destroy()
                  },
                }
              },
              command: ({ editor, range, props }: any) => {
                const typeId = props.id
                const elementType = ELEMENT_TYPES.find(e => e.id === typeId) || { label: "Element" }
                const elementKey = `${typeId}_${Date.now()}`

                editor
                  .chain()
                  .focus()
                  .deleteRange(range)
                  .insertContent({
                    type: "formElement",
                    attrs: {
                      elementType: typeId,
                      label: elementType.label,
                      elementKey: elementKey,
                      defaultValue: "",
                      required: false,
                      options: typeId === 'select' || typeId === 'multiselect' ? { values: [] } : null,
                    },
                  })
                  // Select inserted node
                  .command(({ dispatch }: any) => {
                    if (dispatch) {
                      const pos = range.from
                      try {
                        (editor as any).commands.setNodeSelection(pos);
                        return true;
                      } catch (e) {
                        console.error("Failed to set node selection", e);
                        return false;
                      }
                    }
                    return false
                  })
                  .run()
              },
            }),
          ]
        },
      }),
      Extension.create({
        name: 'keyboardShortcuts',
        addKeyboardShortcuts() {
          return {
            'Mod-Space': () => {
              this.editor.commands.insertContent('/')
              return true
            },
          }
        }
      })
    ] as any[],
    content: initialContent || selectedTemplate?.templateContent || "<p>Loading...</p>",
    editorProps: {
      attributes: {
        class: "prose prose-sm max-w-none focus:outline-none min-h-96 text-sm leading-relaxed p-6",
      },
    },
    editable: true,
  } as any)

  // Consolidate content loading and form element synchronization to prevent race conditions
  useEffect(() => {
    if (!editor) return

    // 1. Handle content loading (Initial content or Template content)
    let contentToSet = null
    if (isEditMode && initialContent) {
      contentToSet = initialContent
    } else if (!isEditMode && selectedTemplate?.templateContent) {
      contentToSet = selectedTemplate.templateContent
    }

    if (contentToSet) {
      // Set content synchronously to avoid race conditions with attribute syncing
      try {
        editor.commands.setContent(contentToSet)
      } catch (e) {
        console.error("Tiptap setContent error in NoteEditor:", e)
        editor.commands.setContent(JSON.stringify(contentToSet))
      }
    }

    // 2. Handle attribute synchronization (Auto-fill)
    if (formData && Object.keys(formData).length > 0) {
      const { state } = editor
      const { tr } = state
      let updated = false

      state.doc.descendants((node, pos) => {
        if (node.type.name === "formElement") {
          const elementKey = node.attrs.elementKey
          const newValue = formData[elementKey] ?? ""
          const currentValue = node.attrs.defaultValue ?? ""

          if (newValue !== currentValue) {
            tr.setNodeMarkup(pos, undefined, {
              ...node.attrs,
              defaultValue: newValue,
            })
            updated = true
          }
        }
      })

      if (updated) {
        editor.view.dispatch(tr)
      }
    }
  }, [editor, selectedTemplate, initialContent, isEditMode, formData])

  const handleVersionSelect = (version: any) => {
    if (onVersionRestore && editor) {
      // Load version data without saving (user must click Save to persist)
      onVersionRestore(version)
      if (version.noteContent) {
        setTimeout(() => {
          try {
            editor.commands.setContent(version.noteContent)
          } catch (e) {
            console.error("Tiptap version restore error:", e)
            editor.commands.setContent(JSON.stringify(version.noteContent))
          }
        }, 0)
      }
      setIsVersionDialogOpen(false)
      toast({
        title: "Version Loaded",
        description: `Version ${version.version} loaded. Click ${isEditMode ? 'Update' : 'Save'} to persist changes.`,
        variant: "default"
      })
    }
  }

  const generatePdfHtml = (content: any, data: Record<string, any>, title: string): string => {
    const renderNode = (node: any): string => {
      if (!node) return ""

      switch (node.type) {
        case "heading":
          const level = node.attrs?.level || 1
          const hAlign = node.attrs?.textAlign ? `text-align: ${node.attrs.textAlign};` : ""
          return `<h${level} style="${hAlign}">${renderContent(node.content)}</h${level}>`

        case "paragraph":
          const pAlign = node.attrs?.textAlign ? `text-align: ${node.attrs.textAlign};` : ""
          return `<p style="${pAlign}">${renderContent(node.content)}</p>`

        case "bulletList":
          return `<ul>${node.content?.map((item: any) => `<li>${renderContent(item.content)}</li>`).join("") || ""}</ul>`

        case "orderedList":
          return `<ol>${node.content?.map((item: any) => `<li>${renderContent(item.content)}</li>`).join("") || ""}</ol>`

        case "table":
          const rows = node.content?.map((row: any) => {
            const cells = row.content?.map((cell: any) => {
              const isHeader = cell.type === "tableHeader"
              const tag = isHeader ? "th" : "td"
              return `<${tag}>${renderContent(cell.content)}</${tag}>`
            }).join("") || ""
            return `<tr>${cells}</tr>`
          }).join("") || ""
          return `<table>${rows}</table>`

        case "formElement":
          const elementType = node.attrs?.elementType
          const fieldValue = data[node.attrs?.elementKey]

          if (elementType === "checkbox") {
            const checked = fieldValue === true ? "<strong>☑</strong>" : "☐"
            return `<span>${checked}</span>`
          }

          if (elementType === "select" || elementType === "dropdown") {
            return `<span><strong>${fieldValue || ""}</strong></span>`
          }

          if (elementType === "datetime") {
            let displayValue = fieldValue || ""
            if (fieldValue) {
              try {
                const date = new Date(fieldValue)
                if (!isNaN(date.getTime())) {
                  const day = String(date.getDate()).padStart(2, '0')
                  const month = String(date.getMonth() + 1).padStart(2, '0')
                  const year = date.getFullYear()
                  let hours = date.getHours()
                  const minutes = String(date.getMinutes()).padStart(2, '0')
                  const ampm = hours >= 12 ? 'pm' : 'am'
                  hours = hours % 12 || 12
                  if (node.attrs?.showTimeOnly) {
                    displayValue = `${hours}:${minutes}${ampm}`
                  } else {
                    displayValue = `${day}-${month}-${year} ${hours}:${minutes}${ampm}`
                  }
                }
              } catch { }
            }
            return `<span><strong>${displayValue}</strong></span>`
          }

          if (elementType === "signature") {
            if (fieldValue && typeof fieldValue === 'string') {
              try {
                const paths = JSON.parse(fieldValue)
                if (Array.isArray(paths) && paths.length > 0) {
                  const pathElements = paths.map(p => `<path d="${p}" stroke="#000" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round" />`).join('')
                  return `<svg width="150" height="60" style="display: inline-block; vertical-align: middle; margin: 0 4px;">${pathElements}</svg>`
                }
              } catch { }
            }
            return ``
          }

          if (elementType === "input" || elementType === "textarea" || elementType === "voice_to_text" || elementType === "numeric") {
            return `<span><strong>${fieldValue || ""}</strong></span>`
          }

          return `<span>${fieldValue || ""}</span>`

        case "image":
          return `<img src="${node.attrs?.src || ""}" style="max-width: 100%;" />`

        case "hardBreak":
          return "<br>"

        default:
          return ""
      }
    }

    const renderContent = (nodes: any[]): string => {
      if (!Array.isArray(nodes)) return ""
      return nodes.map((n) => {
        if (n.type === "text") {
          let text = n.text || ""
          if (n.marks) {
            n.marks.forEach((mark: any) => {
              if (mark.type === "bold") text = `<strong>${text}</strong>`
              if (mark.type === "italic") text = `<em>${text}</em>`
              if (mark.type === "underline") text = `<u>${text}</u>`
              if (mark.type === "link") text = `<a href="${mark.attrs?.href || "#"}">${text}</a>`
            })
          }
          return text
        }
        return renderNode(n)
      }).join("")
    }

    const bodyContent = content.content.map((node: any) => renderNode(node)).join("")

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <title>${title}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; font-size: 14px; line-height: 1.6; }
            h1 { font-size: 2em; font-weight: bold; margin: 0.67em 0; }
            h2 { font-size: 1.5em; font-weight: bold; margin: 0.75em 0; }
            h3 { font-size: 1.17em; font-weight: bold; margin: 0.83em 0; }
            p { margin: 1em 0; }
            ul, ol { margin: 1em 0; padding-left: 40px; }
            li { margin: 0.5em 0; }
            table { border-collapse: collapse; width: 100%; margin: 1em 0; }
            th, td { border: 1px solid #000; padding: 8px; text-align: left; }
            th { font-weight: bold; background-color: #f0f0f0; }
            img { max-width: 100%; height: auto; }
            strong { font-weight: bold; }
          </style>
        </head>
        <body>${bodyContent}</body>
      </html>
    `
  }

  const handlePdfPreview = () => {
    if (!selectedTemplate || !editor) {
      toast({ title: "Error", description: "No content to preview", variant: "destructive" })
      return
    }

    const content = editor.getJSON()
    if (!content || !content.content) {
      toast({ title: "Error", description: "Invalid content", variant: "destructive" })
      return
    }

    const html = generatePdfHtml(content, formData, selectedTemplate.templateName)
    setPdfHtml(html)
    setIsPdfPreviewOpen(true)
  }

  const handlePdfDownload = () => {
    const printWindow = window.open('', '_blank')
    if (!printWindow) {
      toast({ title: "Error", description: "Popup blocked", variant: "destructive" })
      return
    }

    printWindow.document.write(pdfHtml)
    printWindow.document.close()

    setTimeout(() => {
      printWindow.print()
    }, 250)

    setIsPdfPreviewOpen(false)
  }

  const groups = useMemo(() => selectedTemplate?.groups || [], [selectedTemplate])
  const elements = useMemo(() => extractFormElements(selectedTemplate?.templateContent), [selectedTemplate])

  return (
    <div className="flex h-full">
      <div className="w-[250px] border-r bg-white" />

      <div className="flex-1 overflow-y-auto p-6">
        {selectedTemplate ? (
          <div className="max-w-[900px] mx-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">{selectedTemplate.templateName}</h2>
              <div className="flex gap-2">
                {versionHistory.length > 0 && (
                  <Button size="sm" variant="outline" onClick={() => setIsVersionDialogOpen(true)} className="gap-1">
                    <Clock className="w-4 h-4" />
                    Versions ({versionHistory.length})
                  </Button>
                )}
                <Button size="sm" variant="outline" onClick={handlePdfPreview} className="gap-1">
                  <Download className="w-4 h-4" />
                  PDF
                </Button>
                <Button size="sm" onClick={() => onSave(editor?.getJSON())}>
                  {isEditMode ? "Update" : "Save"}
                </Button>
              </div>
            </div>
            <div className="bg-white border rounded-md shadow-sm">
              <EditorContent editor={editor} />
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-500">Select a template from the right panel to start</p>
          </div>
        )}
      </div>

      <div className="w-[380px] border-l border-t border-r border-b bg-white overflow-y-auto p-3">
        <div className="mb-3">
          <p className="text-[10px] font-semibold mb-1.5 uppercase">Select Template</p>
          <Select value={selectedTemplate?.id?.toString() || ""} onValueChange={onTemplateSelect} disabled={isEditMode}>
            <SelectTrigger className="h-7 text-xs">
              <SelectValue placeholder="Choose Template" />
            </SelectTrigger>
            <SelectContent>
              {templates?.map((t) => (
                <SelectItem key={t.id} value={t.id.toString()} className="text-xs">
                  {t.templateName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="h-px bg-gray-200 my-3" />

        <p className="text-xs font-semibold mb-2">Fields</p>
        {elements.length === 0 ? (
          <div className="p-4 text-center">
            <p className="text-xs text-gray-500">No form fields in this template.</p>
            <p className="text-xs text-gray-400 mt-2">Add form elements to the template first.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {groups.map((group: any) => {
              const groupElements = elements.filter((el: any) => el.group_id === group.id)
              if (groupElements.length === 0) return null

              return (
                <div key={group.id}>
                  <p className="text-[10px] font-semibold text-gray-600 mb-1 uppercase">
                    {group.group_name}
                  </p>
                  <div className="space-y-0.5">
                    {groupElements.map((element: any, idx: number) => (
                      <FieldInput
                        key={`${element.elementKey}-${idx}`}
                        element={element}
                        value={formData[element.elementKey] || ""}
                        onChange={(val: any) => onDataChange(element.elementKey, val)}
                        onPhysicalExamClick={onPhysicalExamClick}
                      />
                    ))}
                  </div>
                </div>
              )
            })}

            {elements.filter((el: any) => !el.group_id).length > 0 && (
              <div>
                <p className="text-[10px] font-semibold text-gray-600 mb-1 uppercase">
                  Other Fields
                </p>
                <div className="space-y-0.5">
                  {elements
                    .filter((el: any) => !el.group_id)
                    .map((element: any, idx: number) => (
                      <FieldInput
                        key={`${element.elementKey}-${idx}`}
                        element={element}
                        value={formData[element.elementKey] || ""}
                        onChange={(val: any) => onDataChange(element.elementKey, val)}
                        onPhysicalExamClick={onPhysicalExamClick}
                      />
                    ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <Dialog open={isPdfPreviewOpen} onOpenChange={setIsPdfPreviewOpen}>
        <DialogContent className="max-w-[1400px] w-full max-h-[90vh] flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle>PDF Preview</DialogTitle>
          </DialogHeader>
          <div className="border rounded-md bg-white flex-1 overflow-y-auto p-8" dangerouslySetInnerHTML={{ __html: pdfHtml }} />
          <DialogFooter className="flex-shrink-0">
            <Button variant="ghost" onClick={() => setIsPdfPreviewOpen(false)}>Cancel</Button>
            <Button onClick={handlePdfDownload} className="gap-1">
              <Download className="w-4 h-4" />
              Download PDF
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isVersionDialogOpen} onOpenChange={setIsVersionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Version History</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            {versionHistory.map((version: any) => (
              <div
                key={version.version}
                className="p-3 border rounded-md hover:bg-gray-50 cursor-pointer"
                onClick={() => handleVersionSelect(version)}
              >
                <div className="flex justify-between items-center">
                  <Badge variant="outline">Version {version.version}</Badge>
                  <span className="text-xs text-gray-500">
                    {new Date(version.timestamp).toLocaleString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

const FieldInput = memo(function FieldInput({ element, value, onChange, onPhysicalExamClick }: any) {
  const {
    elementType, label, required, placeholder, options, dataField, showTimeOnly,
    minLength, maxLength, pattern, min, max, step
  } = element
  const [isRecording, setIsRecording] = useState(false)
  const [isSignatureOpen, setIsSignatureOpen] = useState(false)
  const [dynamicOptions, setDynamicOptions] = useState<{ value: string; label: string }[]>([])

  const getApiForField = useMemo(() => {
    if (!dataField) return null
    const field = PREDEFINED_DATA_FIELDS.find(f => f.id === dataField)
    return field && isEnhancedDataField(field) && field.actions?.type === 'API_CALL' ? field.actions.api : null
  }, [dataField])

  useEffect(() => {
    if (getApiForField) {
      const fetchOptions = async () => {
        try {
          const res = await fetcher({ path: `/${getApiForField}` }, { json: { keywords: "" } });
          if (res?.success && Array.isArray(res.data)) {
            setDynamicOptions(res.data.map((item: any) => {
              if (typeof item === 'string') return { value: item, label: item }
              if (getApiForField.includes('doctor')) {
                const name = `${item.first_name || ''} ${item.last_name || ''}`.trim()
                return { value: name, label: name }
              }
              const label = item.label || item.name || item.text || item.title || item.id || JSON.stringify(item)
              const value = item.value || item.id || label
              return { value, label }
            }));
          }
        } catch (error) {
          console.error("Error fetching dynamic options:", error);
        }
      };
      fetchOptions();
    }
  }, [getApiForField]);
  const recognitionRef = useRef<any>(null)
  const isDrawingRef = useRef(false)

  const isPhysicalExamField = dataField && (() => {
    const field = PREDEFINED_DATA_FIELDS.find(f => f.id === dataField)
    if (!field || !isEnhancedDataField(field)) return false
    return field.actions?.type === 'MODEL_OPEN' && field.call_time?.on_click_element
  })()

  useEffect(() => {
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
        onChange(value + ' ' + transcript)
      }

      recognitionRef.current.onerror = () => {
        setIsRecording(false)
      }

      recognitionRef.current.onend = () => {
        setIsRecording(false)
      }
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop()
      }
    }
  }, [])

  const toggleRecording = () => {
    if (!recognitionRef.current) return

    if (isRecording) {
      recognitionRef.current.stop()
      setIsRecording(false)
    } else {
      recognitionRef.current.start()
      setIsRecording(true)
    }
  }

  if (getApiForField && (elementType === "select" || elementType === "dropdown" || dataField === "doctorList")) {
    const selectOptions = dynamicOptions
    return (
      <div className="flex items-center gap-1">
        <Label className="text-[10px] w-20 flex-shrink-0">
          {label}{required && <span className="text-red-500">*</span>}
        </Label>
        <Select value={value} onValueChange={onChange}>
          <SelectTrigger className="h-6 text-[10px] flex-1 p-1">
            <SelectValue placeholder={placeholder || `Select ${label}...`} />
          </SelectTrigger>
          <SelectContent>
            {Array.isArray(selectOptions) && selectOptions.map((opt: any) => (
              <SelectItem key={opt.value} value={opt.value} className="text-[10px]">
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    )
  }

  if (elementType === "input" || elementType === "datetime" || elementType === "numeric") {
    // For datetime-local input, convert ISO to datetime-local format (YYYY-MM-DDTHH:mm)
    let inputValue = value
    if (elementType === "datetime" && value) {
      try {
        const date = new Date(value)
        if (!isNaN(date.getTime())) {
          if (showTimeOnly) {
            const hours = String(date.getHours()).padStart(2, '0')
            const minutes = String(date.getMinutes()).padStart(2, '0')
            inputValue = `${hours}:${minutes}`
          } else {
            const year = date.getFullYear()
            const month = String(date.getMonth() + 1).padStart(2, '0')
            const day = String(date.getDate()).padStart(2, '0')
            const hours = String(date.getHours()).padStart(2, '0')
            const minutes = String(date.getMinutes()).padStart(2, '0')
            inputValue = `${year}-${month}-${day}T${hours}:${minutes}`
          }
        }
      } catch { }
    }

    // Physical exam fields show as button
    if (isPhysicalExamField && onPhysicalExamClick) {
      return (
        <div className="flex items-center gap-1">
          <Label className="text-[10px] w-20 flex-shrink-0">
            {label}{required && <span className="text-red-500">*</span>}
          </Label>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => onPhysicalExamClick(element.elementKey)}
            className="h-6 text-[10px] flex-1 justify-start"
          >
            {value || "Click to examine"}
          </Button>
        </div>
      )
    }

    return (
      <div className="flex items-center gap-1">
        <Label className="text-[10px] w-20 flex-shrink-0">
          {label}{required && <span className="text-red-500">*</span>}
        </Label>
        <Input
          type={elementType === "numeric" ? "number" : elementType === "datetime" ? (showTimeOnly ? "time" : "datetime-local") : "text"}
          value={inputValue}
          onChange={(e) => {
            if (elementType === "datetime") {
              if (showTimeOnly) {
                onChange(e.target.value)
              } else {
                onChange(e.target.value ? new Date(e.target.value).toISOString() : e.target.value)
              }
            } else {
              onChange(e.target.value)
            }
          }}
          placeholder={placeholder}
          minLength={minLength}
          maxLength={maxLength}
          pattern={pattern}
          min={min}
          max={max}
          step={step}
          className="h-6 text-[10px] flex-1"
        />
      </div>
    )
  }

  if (elementType === "textarea") {
    return (
      <div className="flex items-start gap-1">
        <Label className="text-[10px] w-20 flex-shrink-0 pt-1">
          {label}{required && <span className="text-red-500">*</span>}
        </Label>
        <Textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          minLength={minLength}
          maxLength={maxLength}
          className="min-h-[60px] text-[10px] flex-1"
        />
      </div>
    )
  }

  if (elementType === "voice_to_text") {
    return (
      <div className="flex items-start gap-1">
        <Label className="text-[10px] w-20 flex-shrink-0 pt-1">
          {label}{required && <span className="text-red-500">*</span>}
        </Label>
        <div className="flex-1 flex gap-1">
          <Textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="min-h-[60px] text-[10px] flex-1"
          />
          <Button
            type="button"
            size="sm"
            variant={isRecording ? "destructive" : "outline"}
            onClick={toggleRecording}
            className="h-6 w-6 p-0 flex-shrink-0"
          >
            {isRecording ? <MicOff className="w-3 h-3" /> : <Mic className="w-3 h-3" />}
          </Button>
        </div>
      </div>
    )
  }

  if (elementType === "checkbox") {
    return (
      <div className="flex items-center gap-1">
        <Checkbox
          checked={value === true}
          onCheckedChange={(checked) => onChange(checked)}
          className="h-3 w-3"
        />
        <Label className="text-[10px] cursor-pointer">
          {label}{required && <span className="text-red-500">*</span>}
        </Label>
      </div>
    )
  }

  if (elementType === "signature") {
    const [currentPath, setCurrentPath] = useState<string>("")
    const [allPaths, setAllPaths] = useState<string[]>([])
    const [historyStep, setHistoryStep] = useState(-1)
    const svgRef = useRef<SVGSVGElement>(null)
    const isDrawingRef = useRef(false)
    const pathRef = useRef<string>("")

    useEffect(() => {
      if (value && typeof value === 'string') {
        try {
          const paths = JSON.parse(value)
          if (Array.isArray(paths)) {
            setAllPaths(paths)
            setHistoryStep(paths.length - 1)
          }
        } catch { }
      }
    }, [value])

    const startDrawing = (e: React.MouseEvent<SVGSVGElement>) => {
      if (!svgRef.current) return
      isDrawingRef.current = true
      const rect = svgRef.current.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top
      pathRef.current = `M ${x} ${y}`
      setCurrentPath(pathRef.current)
    }

    const draw = (e: React.MouseEvent<SVGSVGElement>) => {
      if (!isDrawingRef.current || !svgRef.current) return
      const rect = svgRef.current.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top
      pathRef.current += ` L ${x} ${y}`
      setCurrentPath(pathRef.current)
    }

    const stopDrawing = () => {
      if (isDrawingRef.current && pathRef.current) {
        const newPaths = allPaths.slice(0, historyStep + 1)
        newPaths.push(pathRef.current)
        setAllPaths(newPaths)
        setHistoryStep(newPaths.length - 1)
        pathRef.current = ""
        setCurrentPath("")
      }
      isDrawingRef.current = false
    }

    const undo = () => {
      if (historyStep > 0) {
        setHistoryStep(historyStep - 1)
      }
    }

    const redo = () => {
      if (historyStep < allPaths.length - 1) {
        setHistoryStep(historyStep + 1)
      }
    }

    const clearSignature = () => {
      setAllPaths([])
      setHistoryStep(-1)
      setCurrentPath("")
      pathRef.current = ""
    }

    const saveSignature = () => {
      const pathsToSave = allPaths.slice(0, historyStep + 1)
      onChange(JSON.stringify(pathsToSave))
      setIsSignatureOpen(false)
    }

    const displayPaths = allPaths.slice(0, historyStep + 1)

    return (
      <>
        <div className="flex items-center gap-1">
          <Label className="text-[10px] w-20 flex-shrink-0">
            {label}{required && <span className="text-red-500">*</span>}
          </Label>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => setIsSignatureOpen(true)}
            className="h-6 text-[10px] flex-1"
          >
            {value ? "Edit Signature" : "Add Signature"}
          </Button>
        </div>
        {value && (
          <div className="ml-[84px] mt-1">
            <svg width="150" height="60" className="border rounded bg-white">
              {(() => {
                try {
                  const paths = JSON.parse(value)
                  return Array.isArray(paths) && paths.map((path: string, i: number) => (
                    <path key={i} d={path} stroke="#000" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                  ))
                } catch {
                  return null
                }
              })()}
            </svg>
          </div>
        )}
        <Dialog open={isSignatureOpen} onOpenChange={setIsSignatureOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>Draw Your Signature</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div className="flex gap-2 items-center">
                <Button size="sm" variant="outline" onClick={undo} disabled={historyStep <= 0} className="h-7">
                  <span className="text-xs">Undo</span>
                </Button>
                <Button size="sm" variant="outline" onClick={redo} disabled={historyStep >= allPaths.length - 1} className="h-7">
                  <span className="text-xs">Redo</span>
                </Button>
                <Button size="sm" variant="outline" onClick={clearSignature} className="h-7">
                  <span className="text-xs">Clear</span>
                </Button>
              </div>
              <svg
                ref={svgRef}
                width="500"
                height="250"
                className="border-2 rounded cursor-crosshair bg-white w-full"
                style={{ touchAction: 'none' }}
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
              >
                {displayPaths.map((path, i) => (
                  <path key={i} d={path} stroke="#000" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                ))}
                {currentPath && (
                  <path d={currentPath} stroke="#000" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                )}
              </svg>
              <div className="flex gap-2 justify-end">
                <Button size="sm" variant="outline" onClick={() => setIsSignatureOpen(false)}>Cancel</Button>
                <Button size="sm" onClick={saveSignature}>Save Signature</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </>
    )
  }

  if (elementType === "select" || elementType === "dropdown") {
    const selectOptions = options?.values || options || []
    return (
      <div className="flex items-center gap-1">
        <Label className="text-[10px] w-20 flex-shrink-0">
          {label}{required && <span className="text-red-500">*</span>}
        </Label>
        <Select value={value} onValueChange={onChange}>
          <SelectTrigger className="h-6 text-[10px] flex-1 p-1">
            <SelectValue placeholder={placeholder || "Select..."} />
          </SelectTrigger>
          <SelectContent>
            {Array.isArray(selectOptions) && selectOptions.map((opt: string) => (
              <SelectItem key={opt} value={opt} className="text-[10px]">
                {opt}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    )
  }

  return null
})

function extractFormElements(content: any): any[] {
  if (!content || !content.content) return []

  const elements: any[] = []

  const traverse = (nodes: any[]) => {
    if (!Array.isArray(nodes)) return
    nodes.forEach((node) => {
      if (node.type === "formElement" && node.attrs) {
        elements.push(node.attrs)
      }
      if (Array.isArray(node.content)) {
        traverse(node.content)
      }
    })
  }

  traverse(content.content)
  return elements
}
