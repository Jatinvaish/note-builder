"use client"

import { useState, useEffect } from "react"
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

  // Find the element in the template content
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

  if (!element) {
    return (
      <div className="text-xs text-muted-foreground p-3">
        Select an element to edit its properties
      </div>
    )
  }

  const attrs = element.attrs || {}

  const handleUpdate = (key: string, value: any) => {
    const updated = {
      ...element,
      attrs: {
        ...attrs,
        [key]: value,
      },
    }
    setElement(updated)

    // Update the entire template content with the modified element
    const newContent = updateElementInContent(templateContent, elementId, updated)
    onUpdate(newContent)
  }

  const handleDelete = () => {
    const newContent = removeElementFromContent(templateContent, elementId)
    onUpdate(newContent)
  }

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
          <TabsTrigger value="basic" className="text-xs">
            Basic
          </TabsTrigger>
          <TabsTrigger value="data" className="text-xs">
            Data Field
          </TabsTrigger>
          <TabsTrigger value="binding" className="text-xs">
            Binding
          </TabsTrigger>
        </TabsList>

        {/* Basic Tab */}
        <TabsContent value="basic" className="space-y-3">
          {/* Label */}
          <div className="space-y-1">
            <Label htmlFor="label" className="text-xs font-medium">
              Label *
            </Label>
            <Input
              id="label"
              value={attrs.label || ""}
              onChange={(e) => handleUpdate("label", e.target.value)}
              placeholder="Field label"
              className="h-7 text-xs"
            />
          </div>

          {/* Element Key */}
          <div className="space-y-1">
            <Label htmlFor="elementKey" className="text-xs font-medium">
              Element Key
            </Label>
            <Input
              id="elementKey"
              value={attrs.elementKey || ""}
              disabled
              className="h-7 text-xs bg-muted"
            />
          </div>

          {/* Type */}
          <div className="space-y-1">
            <Label htmlFor="type" className="text-xs font-medium">
              Type
            </Label>
            <Select value={attrs.elementType || "input"}>
              <SelectTrigger id="type" className="h-7 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="input">Text Input</SelectItem>
                <SelectItem value="checkbox">Checkbox</SelectItem>
                <SelectItem value="select">Dropdown</SelectItem>
                <SelectItem value="textarea">Text Area</SelectItem>
                <SelectItem value="datetime">Date/Time</SelectItem>
                <SelectItem value="signature">Signature</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Group */}
          <div className="space-y-1">
            <Label htmlFor="group" className="text-xs font-medium">
              Group
            </Label>
            <Select
              value={attrs.group_id || "noGroup"}
              onValueChange={(val) => handleUpdate("group_id", val === "noGroup" ? null : val)}
            >
              <SelectTrigger id="group" className="h-7 text-xs">
                <SelectValue placeholder="No group" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="noGroup">No Group</SelectItem>
                {groups.map((group) => (
                  <SelectItem key={group.id} value={group.id}>
                    {group.group_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Required */}
          <div className="flex items-center gap-2">
            <Checkbox
              id="required"
              checked={attrs.required || false}
              onCheckedChange={(checked) => handleUpdate("required", checked)}
            />
            <Label htmlFor="required" className="text-xs font-medium cursor-pointer">
              Required
            </Label>
          </div>

          {/* Default Value */}
          <div className="space-y-1">
            <Label htmlFor="default" className="text-xs font-medium">
              Default Value
            </Label>
            <Input
              id="default"
              value={attrs.defaultValue || ""}
              onChange={(e) => handleUpdate("defaultValue", e.target.value)}
              placeholder="Default value"
              className="h-7 text-xs"
            />
          </div>

          {/* Placeholder */}
          <div className="space-y-1">
            <Label htmlFor="placeholder" className="text-xs font-medium">
              Placeholder
            </Label>
            <Input
              id="placeholder"
              value={attrs.placeholder || ""}
              onChange={(e) => handleUpdate("placeholder", e.target.value)}
              placeholder="Placeholder text"
              className="h-7 text-xs"
            />
          </div>

          {/* Help Text */}
          <div className="space-y-1">
            <Label htmlFor="helpText" className="text-xs font-medium">
              Help Text
            </Label>
            <Input
              id="helpText"
              value={attrs.helpText || ""}
              onChange={(e) => handleUpdate("helpText", e.target.value)}
              placeholder="Help text for users"
              className="h-7 text-xs"
            />
          </div>
        </TabsContent>

        {/* Data Field Tab */}
        <TabsContent value="data" className="space-y-3">
          <p className="text-xs text-muted-foreground mb-2">
            Select the clinical data field this element will capture
          </p>

          <div className="space-y-2">
            <Label className="text-xs font-medium">Clinical Data Field</Label>
            <Select
              value={attrs.dataField || ""}
              onValueChange={(val) => handleUpdate("dataField", val)}
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="Select field..." />
              </SelectTrigger>
              <SelectContent className="max-h-64">
                {PREDEFINED_DATA_FIELDS.map((field) => (
                  <SelectItem key={field.id} value={field.id} className="text-xs">
                    {field.label} <span className="text-muted-foreground ml-1">({field.category})</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {attrs.dataField && (
              <p className="text-xs text-muted-foreground mt-2 p-2 bg-muted rounded">
                Field ID: <code className="font-mono">{attrs.dataField}</code>
              </p>
            )}
          </div>

          <div className="space-y-2 pt-3 border-t">
            <Label htmlFor="metadata" className="text-xs font-medium">
              Metadata (JSON)
            </Label>
            <textarea
              id="metadata"
              value={attrs.metadata ? JSON.stringify(attrs.metadata, null, 2) : ""}
              onChange={(e) => {
                try {
                  const parsed = e.target.value ? JSON.parse(e.target.value) : null
                  handleUpdate("metadata", parsed)
                } catch {
                  // Invalid JSON, don't update
                }
              }}
              placeholder='{"key": "value"}'
              className="w-full h-32 text-xs font-mono p-2 border rounded"
            />
            <p className="text-xs text-muted-foreground">
              Add custom metadata as JSON
            </p>
          </div>
        </TabsContent>

        {/* Binding Tab */}
        <TabsContent value="binding" className="space-y-3">
          <p className="text-xs text-muted-foreground">
            Configure data binding for this field
          </p>

          {/* Binding Type */}
          <div className="space-y-1">
            <Label className="text-xs font-medium">Binding Type</Label>
            <Select
              value={attrs.data_binding?.type || "manual"}
              onValueChange={(val) =>
                handleUpdate("data_binding", {
                  ...(attrs.data_binding || {}),
                  type: val,
                })
              }
            >
              <SelectTrigger className="h-7 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="manual">Manual</SelectItem>
                <SelectItem value="api">API</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {attrs.data_binding?.type === "api" && (
            <>
              {/* Source */}
              <div className="space-y-1">
                <Label className="text-xs font-medium">Source</Label>
                <Input
                  value={attrs.data_binding?.source || ""}
                  onChange={(e) =>
                    handleUpdate("data_binding", {
                      ...attrs.data_binding,
                      source: e.target.value,
                    })
                  }
                  placeholder="e.g., appointment.date"
                  className="h-7 text-xs"
                />
              </div>

              {/* API Endpoint */}
              <div className="space-y-1">
                <Label className="text-xs font-medium">API Endpoint</Label>
                <Input
                  value={attrs.data_binding?.apiEndpoint || ""}
                  onChange={(e) =>
                    handleUpdate("data_binding", {
                      ...attrs.data_binding,
                      apiEndpoint: e.target.value,
                    })
                  }
                  placeholder="/api/appointments/{id}"
                  className="h-7 text-xs"
                />
              </div>

              {/* Fallback */}
              <div className="space-y-1">
                <Label className="text-xs font-medium">Fallback Value</Label>
                <Input
                  value={attrs.data_binding?.fallbackValue || ""}
                  onChange={(e) =>
                    handleUpdate("data_binding", {
                      ...attrs.data_binding,
                      fallbackValue: e.target.value,
                    })
                  }
                  placeholder="Used if API fails"
                  className="h-7 text-xs"
                />
              </div>
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

// Helper functions
function updateElementInContent(content: any, elementId: string, updatedElement: any): any {
  if (!content || !content.content) return content

  const traverse = (nodes: any[]): any[] => {
    return nodes.map((node) => {
      if (node.type === "formElement" && node.attrs?.elementKey === elementId) {
        return updatedElement
      }
      if (Array.isArray(node.content)) {
        return {
          ...node,
          content: traverse(node.content),
        }
      }
      return node
    })
  }

  return {
    ...content,
    content: traverse(content.content),
  }
}

function removeElementFromContent(content: any, elementId: string): any {
  if (!content || !content.content) return content

  const traverse = (nodes: any[]): any[] => {
    return nodes
      .filter((node) => !(node.type === "formElement" && node.attrs?.elementKey === elementId))
      .map((node) => {
        if (Array.isArray(node.content)) {
          return {
            ...node,
            content: traverse(node.content),
          }
        }
        return node
      })
  }

  return {
    ...content,
    content: traverse(content.content),
  }
}
