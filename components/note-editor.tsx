"use client"

import { useState, useEffect, useMemo, memo } from "react"
import { useEditor, EditorContent } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import Underline from "@tiptap/extension-underline"
import Link from "@tiptap/extension-link"
import Image from "@tiptap/extension-image"
import TextAlign from "@tiptap/extension-text-align"
import {Table} from "@tiptap/extension-table"
import TableRow from "@tiptap/extension-table-row"
import TableCell from "@tiptap/extension-table-cell"
import TableHeader from "@tiptap/extension-table-header"
import { FormElementExtension } from "@/lib/tiptap-extensions"
import type { Template, VersionEntry } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Download, History } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { VoiceInput } from "@/components/voice-input"
import { formatDateTime } from "@/lib/date-utils"

interface NoteEditorProps {
  template: Template
  formData: Record<string, any>
  onDataChange: (key: string, value: any) => void
  onSave: () => void
  versionHistory?: VersionEntry[]
  onVersionRestore?: (version: VersionEntry) => void
}

export function NoteEditor({ template, formData, onDataChange, versionHistory = [], onVersionRestore }: NoteEditorProps) {
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
    content: template?.templateContent || "<p>Loading...</p>",
    editorProps: {
      attributes: {
        class: "prose prose-sm max-w-none focus:outline-none min-h-96 text-sm leading-relaxed p-6",
      },
    },
    editable: false,
  })

  useEffect(() => {
    if (editor && template?.templateContent) {
      editor.commands.setContent(template.templateContent)
    }
  }, [editor, template])

  useEffect(() => {
    if (!editor) return

    // Update form element nodes with new values from formData
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



  const handleVersionRestore = (version: VersionEntry) => {
    if (onVersionRestore) {
      onVersionRestore(version)
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
            h4 { font-size: 1em; font-weight: bold; margin: 1.12em 0; }
            h5 { font-size: 0.83em; font-weight: bold; margin: 1.5em 0; }
            h6 { font-size: 0.75em; font-weight: bold; margin: 1.67em 0; }
            p { margin: 1em 0; }
            ul, ol { margin: 1em 0; padding-left: 40px; }
            li { margin: 0.5em 0; }
            table { border-collapse: collapse; width: 100%; margin: 1em 0; }
            th, td { border: 1px solid #000; padding: 8px; text-align: left; }
            th { font-weight: bold; background-color: #f0f0f0; }
            img { max-width: 100%; height: auto; }
            strong { font-weight: bold; }
            em { font-style: italic; }
            u { text-decoration: underline; }
            a { color: #0000EE; text-decoration: underline; }
          </style>
        </head>
        <body>${bodyContent}</body>
      </html>
    `
  }

  const handlePdfPreview = () => {
    const html = generatePdfHtml(template.templateContent, formData, template.templateName)
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

  const groups = useMemo(() => template?.groups || [], [template])
  const elements = useMemo(() => extractFormElements(template?.templateContent), [template])

  return (
    <div className="flex h-full">
      <div className="w-64 border-r bg-card"></div>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-4xl mx-auto">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold">{template.templateName}</h2>
            <div className="flex gap-2">
              {versionHistory.length > 0 && (
                <Button size="sm" variant="outline" onClick={() => setIsVersionDialogOpen(true)} className="gap-1">
                  <History className="w-4 h-4" />
                  Versions ({versionHistory.length})
                </Button>
              )}
              <Button size="sm" variant="outline" onClick={handlePdfPreview} className="gap-1">
                <Download className="w-4 h-4" />
                PDF
              </Button>
            </div>
          </div>
          <div className="bg-white border rounded-lg shadow-sm">
            <EditorContent editor={editor} />
          </div>
        </div>
      </div>

      <div className="w-96 border-l bg-card overflow-y-auto p-3">
        <h3 className="text-xs font-semibold mb-2">Fields</h3>
        <div className="space-y-3">
          {groups.map((group) => {
            const groupElements = elements.filter((el) => el.group_id === group.id)
            if (groupElements.length === 0) return null

            return (
              <div key={group.id} className="space-y-1">
                <h4 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                  {group.group_name}
                </h4>
                <div className="space-y-0.5">
                  {groupElements.map((element) => (
                    <FieldInput
                      key={element.elementKey}
                      element={element}
                      value={formData[element.elementKey] || ""}
                      onChange={(val) => onDataChange(element.elementKey, val)}
                      onVoiceInput={(text) => onDataChange(element.elementKey, text)}
                    />
                  ))}
                </div>
              </div>
            )
          })}

          {elements.filter((el) => !el.group_id).length > 0 && (
            <div className="space-y-1">
              <h4 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                Other Fields
              </h4>
              <div className="space-y-0.5">
                {elements
                  .filter((el) => !el.group_id)
                  .map((element) => (
                    <FieldInput
                      key={element.elementKey}
                      element={element}
                      value={formData[element.elementKey] || ""}
                      onChange={(val) => onDataChange(element.elementKey, val)}
                      onVoiceInput={(text) => onDataChange(element.elementKey, text)}
                    />
                  ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <Dialog open={isVersionDialogOpen} onOpenChange={setIsVersionDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Version History</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            {versionHistory.length === 0 ? (
              <p className="text-sm text-muted-foreground">No version history</p>
            ) : (
              versionHistory.map((version) => (
                <div key={version.version} className="border rounded-lg p-3 hover:bg-muted/50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline">v{version.version}</Badge>
                        <span className="text-xs text-muted-foreground">
                          {formatDateTime(version.timestamp)}
                        </span>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleVersionRestore(version)}
                      className="text-xs"
                    >
                      Restore
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isPdfPreviewOpen} onOpenChange={setIsPdfPreviewOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>PDF Preview</DialogTitle>
          </DialogHeader>
          <div className="border rounded bg-white max-h-[70vh] overflow-y-auto" dangerouslySetInnerHTML={{ __html: pdfHtml }} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPdfPreviewOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handlePdfDownload} className="gap-1">
              <Download className="w-4 h-4" />
              Download PDF
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

const FieldInput = memo(function FieldInput({ element, value, onChange, onVoiceInput }: any) {
  const { elementType, label, required, placeholder, options } = element

  if (elementType === "voice") {
    return (
      <div className="flex items-center gap-1">
        <Label className="text-[10px] w-20 flex-shrink-0">
          {label}{required && <span className="text-red-500">*</span>}
        </Label>
        <div className="flex-1 flex items-center gap-1">
          <Input
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="h-6 text-[10px] flex-1"
          />
          <VoiceInput onTranscribed={onVoiceInput} />
        </div>
      </div>
    )
  }

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
          className="text-[10px] min-h-16 flex-1"
        />
      </div>
    )
  }

  if (elementType === "checkbox") {
    return (
      <div className="flex items-center gap-1">
        <Checkbox checked={value === true} onCheckedChange={onChange} id={element.elementKey} className="h-3 w-3" />
        <Label htmlFor={element.elementKey} className="text-[10px] cursor-pointer">
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
