"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import type { Group } from "@/lib/types"
import { PREDEFINED_DATA_FIELDS } from "@/lib/predefined-data-fields"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Trash2 } from "lucide-react"

interface ElementPropertiesPanelProps {
  elementId: string
  groups: Group[]
  templateContent: any
  onUpdate: (content: any) => void
}

export function ElementPropertiesPanel({
  elementId,
  groups,
  templateContent,
  onUpdate,
}: ElementPropertiesPanelProps) {
  const [element, setElement] = useState<any>(null)

  useEffect(() => {
    const traverse = (nodes: any[]): any => {
      for (const node of nodes) {
        if (node.type === "formElement" && node.attrs?.elementKey === elementId) {
          return node
        }
        if (Array.isArray(node.content)) {
          const result = traverse(node.content)
          if (result) return result
        }
      }
      return null
    }

    const found = traverse(templateContent?.content || [])
    setElement(found)
  }, [elementId, templateContent])

  const handleUpdate = useCallback((key: string, value: any) => {
    setElement((prev: any) => {
      if (!prev) return prev
      const updated = {
        ...prev,
        attrs: {
          ...prev.attrs,
          [key]: value,
        },
      }
      
      const newContent = updateElementInContent(templateContent, elementId, updated)
      onUpdate(newContent)
      return updated
    })
  }, [elementId, templateContent, onUpdate])

  const handleDelete = useCallback(() => {
    const newContent = removeElementFromContent(templateContent, elementId)
    onUpdate(newContent)
  }, [elementId, templateContent, onUpdate])

  if (!element) {
    return (
      <div className="text-xs text-muted-foreground p-3">
        Select an element to edit its properties
      </div>
    )
  }

  const attrs = element.attrs || {}
  const hasDropdownValidation = attrs.elementType === "select" && (!attrs.options?.values || attrs.options.values.length === 0) && !attrs.dataField

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between">
        <h3 className="text-sm font-semibold">Element Properties</h3>
        <Button
          size="sm"
          variant="destructive"
          onClick={handleDelete}
          className="h-6 text-xs"
        >
          <Trash2 className="w-3 h-3" />
        </Button>
      </div>

      <Tabs defaultValue="basic" className="w-full">
        <TabsList className="w-full grid grid-cols-3">
          <TabsTrigger value="basic" className="text-xs">Basic</TabsTrigger>
          <TabsTrigger value="data" className="text-xs">Data Field</TabsTrigger>
          <TabsTrigger value="binding" className="text-xs">Binding</TabsTrigger>
        </TabsList>

        <TabsContent value="basic" className="space-y-3">
          <div className="space-y-1">
            <Label htmlFor="label" className="text-xs font-medium">Label *</Label>
            <Input
              id="label"
              key={`label-${elementId}`}
              defaultValue={attrs.label || ""}
              onBlur={(e) => handleUpdate("label", e.target.value)}
              placeholder="Field label"
              className="h-7 text-xs"
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="elementKey" className="text-xs font-medium">Element Key</Label>
            <Input id="elementKey" value={attrs.elementKey || ""} disabled className="h-7 text-xs bg-muted" />
          </div>

          <div className="space-y-1">
            <Label htmlFor="type" className="text-xs font-medium">Type</Label>
            <Select value={attrs.elementType || "input"}>
              <SelectTrigger id="type" className="h-7 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="input">Text Input</SelectItem>
                <SelectItem value="checkbox">Checkbox</SelectItem>
                <SelectItem value="select">Dropdown</SelectItem>
                <SelectItem value="textarea">Text Area</SelectItem>
                <SelectItem value="datetime">Date/Time</SelectItem>
                <SelectItem value="signature">Signature</SelectItem>
                <SelectItem value="voice_to_text">Voice to Text</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label htmlFor="group" className="text-xs font-medium">Group</Label>
            <Select value={attrs.group_id || "noGroup"} onValueChange={(val) => handleUpdate("group_id", val === "noGroup" ? null : val)}>
              <SelectTrigger id="group" className="h-7 text-xs"><SelectValue placeholder="No group" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="noGroup">No Group</SelectItem>
                {groups.map((group) => (<SelectItem key={group.id} value={group.id}>{group.group_name}</SelectItem>))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <Checkbox id="required" checked={attrs.required || false} onCheckedChange={(checked) => handleUpdate("required", checked)} />
            <Label htmlFor="required" className="text-xs font-medium cursor-pointer">Required</Label>
          </div>

          <div className="space-y-1">
            <Label htmlFor="default" className="text-xs font-medium">Default Value</Label>
            <Input id="default" key={`default-${elementId}`} defaultValue={attrs.defaultValue || ""} onBlur={(e) => handleUpdate("defaultValue", e.target.value)} placeholder="Default value" className="h-7 text-xs" />
          </div>

          <div className="space-y-1">
            <Label htmlFor="placeholder" className="text-xs font-medium">Placeholder</Label>
            <Input id="placeholder" key={`placeholder-${elementId}`} defaultValue={attrs.placeholder || ""} onBlur={(e) => handleUpdate("placeholder", e.target.value)} placeholder="Placeholder text" className="h-7 text-xs" />
          </div>

          <div className="space-y-1">
            <Label htmlFor="helpText" className="text-xs font-medium">Help Text</Label>
            <Input id="helpText" key={`helpText-${elementId}`} defaultValue={attrs.helpText || ""} onBlur={(e) => handleUpdate("helpText", e.target.value)} placeholder="Help text for users" className="h-7 text-xs" />
          </div>

          {attrs.elementType === "select" && (
            <div className="space-y-2 p-3 border rounded bg-muted/30">
              <Label className="text-xs font-medium">Dropdown Options *</Label>
              <p className="text-xs text-muted-foreground">Either add options OR select a data field (required)</p>
              <div className="space-y-1">
                <Label htmlFor="options" className="text-xs">Options (comma-separated)</Label>
                <Input
                  id="options"
                  key={`options-${elementId}`}
                  defaultValue={attrs.options?.values?.join(", ") || ""}
                  onBlur={(e) => handleUpdate("options", { source: "static", values: e.target.value.split(",").map((v) => v.trim()).filter(Boolean) })}
                  placeholder="Option 1, Option 2, Option 3"
                  className="h-7 text-xs"
                />
              </div>
              {hasDropdownValidation && <p className="text-xs text-destructive">⚠️ Add options or select a data field</p>}
            </div>
          )}
        </TabsContent>

        <TabsContent value="data" className="space-y-3">
          <p className="text-xs text-muted-foreground mb-2">Select the clinical data field this element will capture</p>
          <div className="space-y-2">
            <Label className="text-xs font-medium">Clinical Data Field</Label>
            <Select value={attrs.dataField || ""} onValueChange={(val) => handleUpdate("dataField", val)}>
              <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Select field..." /></SelectTrigger>
              <SelectContent className="max-h-64">
                {PREDEFINED_DATA_FIELDS.map((field) => (
                  <SelectItem key={field.id} value={field.id} className="text-xs">
                    {field.label} <span className="text-muted-foreground ml-1">({field.category})</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {attrs.dataField && <p className="text-xs text-muted-foreground mt-2 p-2 bg-muted rounded">Field ID: <code className="font-mono">{attrs.dataField}</code></p>}
          </div>
        </TabsContent>

        <TabsContent value="binding" className="space-y-3">
          <p className="text-xs text-muted-foreground">Configure data binding for this field</p>
          <div className="space-y-1">
            <Label className="text-xs font-medium">Binding Type</Label>
            <Select value={attrs.data_binding?.type || "manual"} onValueChange={(val) => handleUpdate("data_binding", { ...(attrs.data_binding || {}), type: val })}>
              <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="manual">Manual</SelectItem>
                <SelectItem value="api">API</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

function updateElementInContent(content: any, elementId: string, updatedElement: any): any {
  if (!content || !content.content) return content
  const traverse = (nodes: any[]): any[] => {
    return nodes.map((node) => {
      if (node.type === "formElement" && node.attrs?.elementKey === elementId) return updatedElement
      if (Array.isArray(node.content)) return { ...node, content: traverse(node.content) }
      return node
    })
  }
  return { ...content, content: traverse(content.content) }
}

function removeElementFromContent(content: any, elementId: string): any {
  if (!content || !content.content) return content
  const traverse = (nodes: any[]): any[] => {
    return nodes.filter((node) => !(node.type === "formElement" && node.attrs?.elementKey === elementId)).map((node) => {
      if (Array.isArray(node.content)) return { ...node, content: traverse(node.content) }
      return node
    })
  }
  return { ...content, content: traverse(content.content) }
}
