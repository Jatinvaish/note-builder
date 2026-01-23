"use client"

import { useState } from "react"
import type { Template, Group, FormElement } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Card } from "@/components/ui/card"
import { Download, Eye } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface NotesDataPanelProps {
  template: Template
  formData: Record<string, any>
  onDataChange: (key: string, value: any) => void
  onDownloadPDF?: () => void
}

export function NotesDataPanel({
  template,
  formData,
  onDataChange,
  onDownloadPDF,
}: NotesDataPanelProps) {
  const [selectedTemplate, setSelectedTemplate] = useState(template.id)
  const [showPreview, setShowPreview] = useState(false)

  // Extract all form elements from template content
  const extractFormElements = (): { element: FormElement; node: any }[] => {
    const elements: { element: FormElement; node: any }[] = []
    
    const processNode = (node: any) => {
      if (node.type === "formElement" && node.attrs) {
        elements.push({ element: node.attrs as FormElement, node })
      }
      if (Array.isArray(node.content)) {
        node.content.forEach(processNode)
      }
    }

    if (template.templateContent?.content) {
      template.templateContent.content.forEach(processNode)
    }

    return elements
  }

  // Group elements by group_id
  const groupElements = () => {
    const elements = extractFormElements()
    const grouped: { [key: string]: { element: FormElement; node: any }[] } = {
      ungrouped: [],
    }

    elements.forEach(({ element, node }) => {
      const groupId = element.group_id || "ungrouped"
      if (!grouped[groupId]) {
        grouped[groupId] = []
      }
      grouped[groupId].push({ element, node })
    })

    return grouped
  }

  // Sort groups by order_by
  const getSortedGroupedElements = () => {
    const grouped = groupElements()
    const sortedGroups: any[] = []

    // Add groups in order_by sequence
    if (template.groups) {
      template.groups
        .sort((a, b) => a.order_by - b.order_by)
        .forEach((group) => {
          if (grouped[group.id] && grouped[group.id].length > 0) {
            sortedGroups.push({
              group,
              elements: grouped[group.id],
            })
          }
        })
    }

    // Add ungrouped elements at the end
    if (grouped.ungrouped.length > 0) {
      sortedGroups.push({
        group: null,
        elements: grouped.ungrouped,
      })
    }

    return sortedGroups
  }

  const renderInput = (element: FormElement) => {
    const value = formData[element.elementKey] || ""

    switch (element.elementType) {
      case "checkbox":
        return (
          <div className="flex items-center gap-2">
            <Checkbox
              id={element.elementKey}
              checked={value === "true" || value === true}
              onCheckedChange={(checked) =>
                onDataChange(element.elementKey, checked ? "true" : "false")
              }
            />
            <Label htmlFor={element.elementKey} className="text-xs cursor-pointer">
              {element.label}
            </Label>
          </div>
        )
      case "textarea":
        return (
          <Textarea
            value={value}
            onChange={(e) => onDataChange(element.elementKey, e.target.value)}
            placeholder={element.label}
            className="min-h-20 text-xs"
          />
        )
      case "select":
        return (
          <Select value={value} onValueChange={(val) => onDataChange(element.elementKey, val)}>
            <SelectTrigger className="h-8 text-xs">
              <SelectValue placeholder="Select..." />
            </SelectTrigger>
            <SelectContent>
              {element.options?.values?.map((opt) => (
                <SelectItem key={opt} value={opt}>
                  {opt}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )
      case "datetime":
        return (
          <Input
            type="datetime-local"
            value={value}
            onChange={(e) => onDataChange(element.elementKey, e.target.value)}
            className="h-8 text-xs"
          />
        )
      default:
        return (
          <Input
            value={value}
            onChange={(e) => onDataChange(element.elementKey, e.target.value)}
            placeholder={element.label}
            className="h-8 text-xs"
            type={element.elementType === "input" ? "text" : element.elementType}
          />
        )
    }
  }

  const sortedGroups = getSortedGroupedElements()

  return (
    <div className="w-72 border-l border-border bg-card flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="border-b border-border p-2 bg-muted/50">
        <div className="space-y-2">
          <h3 className="text-xs font-semibold">Data Entry</h3>
          <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
            <SelectTrigger className="h-7 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={template.id}>{template.templateName}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Scrollable Content */}
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-3">
          {sortedGroups.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-4">No fields in template</p>
          ) : (
            sortedGroups.map((groupItem, groupIdx) => (
              <div key={groupIdx} className="space-y-2">
                {groupItem.group && (
                  <div className="bg-muted/50 px-2 py-1 rounded border border-border">
                    <p className="text-xs font-semibold text-foreground">{groupItem.group.group_name}</p>
                  </div>
                )}
                <div className="space-y-2 pl-1">
                  {groupItem.elements.map(({ element }) => (
                    <div key={element.elementKey} className="space-y-1">
                      <Label className="text-xs font-medium">
                        {element.label}
                        {element.required && <span className="text-red-500 ml-1">*</span>}
                      </Label>
                      {renderInput(element)}
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </ScrollArea>

      {/* Footer Actions */}
      <div className="border-t border-border p-2 bg-muted/50 flex gap-2">
        <Button
          onClick={() => setShowPreview(true)}
          variant="outline"
          size="sm"
          className="flex-1 h-7 text-xs gap-1 bg-transparent"
        >
          <Eye className="w-3 h-3" />
          Preview
        </Button>
        <Button
          onClick={onDownloadPDF}
          variant="outline"
          size="sm"
          className="flex-1 h-7 text-xs gap-1 bg-transparent"
        >
          <Download className="w-3 h-3" />
          PDF
        </Button>
      </div>

      {/* Preview Dialog */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-2xl max-h-96">
          <DialogHeader>
            <DialogTitle>Data Preview</DialogTitle>
          </DialogHeader>
          <div className="overflow-auto max-h-80 text-xs font-mono whitespace-pre-wrap bg-muted p-2 rounded border border-border">
            {JSON.stringify(formData, null, 2)}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
