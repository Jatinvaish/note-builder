"use client"

import { useState, useEffect, useMemo, memo } from "react"
import { useEditor, EditorContent } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import Underline from "@tiptap/extension-underline"
import Link from "@tiptap/extension-link"
import Image from "@tiptap/extension-image"
import TextAlign from "@tiptap/extension-text-align"
import { Table } from "@tiptap/extension-table"
import TableRow from "@tiptap/extension-table-row"
import TableCell from "@tiptap/extension-table-cell"
import TableHeader from "@tiptap/extension-table-header"
import { FormElementExtension } from "@/lib/tiptap-extensions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { Download, Clock } from "lucide-react"

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
  initialContent
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
      Link.configure({ openOnClick: false, autolink: true }),
      Image.configure({ HTMLAttributes: { class: "rounded-lg max-w-full" } }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Table.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell,
      FormElementExtension,
    ],
    content: initialContent || selectedTemplate?.templateContent || "<p>Loading...</p>",
    editorProps: {
      attributes: {
        class: "prose prose-sm max-w-none focus:outline-none min-h-96 text-sm leading-relaxed p-6",
      },
    },
    editable: true,
  })

  useEffect(() => {
    if (editor && !isEditMode && selectedTemplate?.templateContent) {
      setTimeout(() => {
        editor.commands.setContent(selectedTemplate.templateContent)
      }, 0)
    }
  }, [editor, selectedTemplate, isEditMode])

  useEffect(() => {
    if (editor && isEditMode && initialContent) {
      setTimeout(() => {
        editor.commands.setContent(initialContent)
      }, 0)
    }
  }, [editor, initialContent, isEditMode])

  useEffect(() => {
    if (!editor) return

    const { state } = editor
    const { tr } = state
    let updated = false

    state.doc.descendants((node, pos) => {
      if (node.type.name === "formElement") {
        const elementKey = node.attrs.elementKey
        const newValue = formData[elementKey] || ""
        const currentValue = node.attrs.defaultValue || ""

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
  }, [formData, editor])

  const handleVersionRestore = (version: any) => {
    if (onVersionRestore && editor) {
      onVersionRestore(version)
      if (version.noteContent) {
        setTimeout(() => {
          editor.commands.setContent(version.noteContent)
        }, 0)
      }
      setIsVersionDialogOpen(false)
      toast({ title: "Version Restored", description: `Restored to version ${version.version}` })
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
          const value = data[node.attrs?.elementKey] || ""
          return `<strong>${node.attrs?.label || "Field"}:</strong> ${value || "____________________________"}`

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
    const content = editor?.getJSON() || selectedTemplate.templateContent
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
                  Save
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
          <Select value={selectedTemplate?.id || ""} onValueChange={onTemplateSelect} disabled={isEditMode}>
            <SelectTrigger className="h-7 text-xs">
              <SelectValue placeholder="Choose Template" />
            </SelectTrigger>
            <SelectContent>
              {templates?.map((t) => (
                <SelectItem key={t.id} value={t.id} className="text-xs">
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
                    {groupElements.map((element: any) => (
                      <FieldInput
                        key={element.elementKey}
                        element={element}
                        value={formData[element.elementKey] || ""}
                        onChange={(val: any) => onDataChange(element.elementKey, val)}
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
                    .map((element: any) => (
                      <FieldInput
                        key={element.elementKey}
                        element={element}
                        value={formData[element.elementKey] || ""}
                        onChange={(val: any) => onDataChange(element.elementKey, val)}
                      />
                    ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <Dialog open={isPdfPreviewOpen} onOpenChange={setIsPdfPreviewOpen}>
        <DialogContent className="max-w-[90vw] w-full max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>PDF Preview</DialogTitle>
          </DialogHeader>
          <div className="border rounded-md bg-white flex-1 overflow-y-auto p-6" dangerouslySetInnerHTML={{ __html: pdfHtml }} />
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
                onClick={() => handleVersionRestore(version)}
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

const FieldInput = memo(function FieldInput({ element, value, onChange }: any) {
  const { elementType, label, required, placeholder, options } = element

  if (elementType === "input" || elementType === "datetime") {
    return (
      <div className="flex items-center gap-1">
        <Label className="text-[10px] w-20 flex-shrink-0">
          {label}{required && <span className="text-red-500">*</span>}
        </Label>
        <Input
          type={elementType === "datetime" ? "datetime-local" : "text"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
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
          className="min-h-[60px] text-[10px] flex-1"
        />
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

  if (elementType === "select") {
    return (
      <div className="flex items-center gap-1">
        <Label className="text-[10px] w-24 flex-shrink-0">
          {label}{required && <span className="text-red-500">*</span>}
        </Label>
        <Select value={value} onValueChange={onChange}>
          <SelectTrigger className="h-6 text-[10px] flex-1">
            <SelectValue placeholder={placeholder || "Select..."} />
          </SelectTrigger>
          <SelectContent>
            {options?.values?.map((opt: string) => (
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
