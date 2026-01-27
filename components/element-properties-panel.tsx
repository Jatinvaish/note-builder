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
import { Trash2, Check, Search, Database } from "lucide-react"
import { cn } from "@/lib/utils"
import { Textarea } from "@/components/ui/textarea"

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
  const [selectedCategory, setSelectedCategory] = useState<string>("")
  const [searchTerm, setSearchTerm] = useState<string>("")

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

    if (found?.attrs?.dataField) {
      const field = PREDEFINED_DATA_FIELDS.find(f => f.id === found.attrs.dataField)
      if (field && !selectedCategory) setSelectedCategory(field.category)
    }
  }, [elementId, templateContent])

  const handleUpdate = useCallback((key: string, value: any) => {
    const updated = {
      ...element,
      attrs: {
        ...element.attrs,
        [key]: value,
      },
    }

    setElement(updated)

    // Defer the parent update to avoid setState during render
    setTimeout(() => {
      const newContent = updateElementInContent(templateContent, elementId, updated)
      onUpdate(newContent)
    }, 0)
  }, [element, elementId, templateContent, onUpdate])

  const handleDataFieldSelect = useCallback((field: any) => {
    const isClearing = attrs.dataField === field.id
    const updated = {
      ...element,
      attrs: {
        ...element.attrs,
        dataField: isClearing ? "" : field.id,
        label: isClearing ? element.attrs.label : field.label,
      },
    }

    setElement(updated)

    // Defer the parent update to avoid setState during render
    setTimeout(() => {
      const newContent = updateElementInContent(templateContent, elementId, updated)
      onUpdate(newContent)
    }, 0)
  }, [element, elementId, templateContent, onUpdate, attrs.dataField])

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
  const categories = Array.from(new Set(PREDEFINED_DATA_FIELDS.map(f => f.category)))

  const filteredFields = PREDEFINED_DATA_FIELDS.filter(f => {
    const matchesCategory = !selectedCategory || f.category === selectedCategory
    const matchesSearch = !searchTerm ||
      f.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.id.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesCategory && matchesSearch
  })

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between">
        <h3 className="text-sm font-semibold">Element Properties</h3>
        <Button
          size="sm"
          variant="ghost"
          onClick={handleDelete}
          className="h-6 text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
        >
          <Trash2 className="w-3 h-3 mr-1" />
          Delete
        </Button>
      </div>

      <Tabs defaultValue="databinding" className="w-full">
        <TabsList className="w-full grid grid-cols-2">
          <TabsTrigger value="properties" className="text-xs">Properties</TabsTrigger>
          <TabsTrigger value="databinding" className="text-xs">Data Binding</TabsTrigger>
        </TabsList>

        <TabsContent value="properties" className="space-y-4 py-4">
          <div className="space-y-1.5">
            <Label htmlFor="label" className="text-xs font-bold">Label *</Label>
            <Input
              id="label"
              key={`label-${elementId}`}
              defaultValue={attrs.label || ""}
              onBlur={(e) => handleUpdate("label", e.target.value)}
              placeholder="Field label"
              className="h-8 text-xs"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="type" className="text-xs font-bold">Type</Label>
            <Select value={attrs.elementType || "input"} disabled>
              <SelectTrigger id="type" className="h-8 text-xs bg-muted/30"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="input">Text Input</SelectItem>
                <SelectItem value="numeric">Numeric</SelectItem>
                <SelectItem value="checkbox">Checkbox</SelectItem>
                <SelectItem value="select">Dropdown</SelectItem>
                <SelectItem value="textarea">Text Area</SelectItem>
                <SelectItem value="datetime">Date/Time</SelectItem>
                <SelectItem value="signature">Signature</SelectItem>
                <SelectItem value="voice_to_text">Voice to Text</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="defaultValue" className="text-xs font-bold">Default Value</Label>
            {attrs.elementType === "datetime" ? (
              <div className="space-y-2">
                <Input
                  id="defaultValue"
                  type="datetime-local"
                  key={`defaultValue-${elementId}`}
                  defaultValue={attrs.defaultValue || ""}
                  onBlur={(e) => handleUpdate("defaultValue", e.target.value)}
                  className="h-8 text-xs"
                />
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="useCurrentDateTime"
                    checked={attrs.useCurrentDateTime || false}
                    onCheckedChange={(checked) => handleUpdate("useCurrentDateTime", checked)}
                  />
                  <Label htmlFor="useCurrentDateTime" className="text-[10px] cursor-pointer">Use Current Date/Time</Label>
                </div>
              </div>
            ) : (
              <Input
                id="defaultValue"
                key={`defaultValue-${elementId}`}
                defaultValue={attrs.defaultValue || ""}
                onBlur={(e) => handleUpdate("defaultValue", e.target.value)}
                placeholder="Set default value"
                className="h-8 text-xs"
              />
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="placeholder" className="text-xs font-bold">Placeholder</Label>
            <Input
              id="placeholder"
              key={`placeholder-${elementId}`}
              defaultValue={attrs.placeholder || ""}
              onBlur={(e) => handleUpdate("placeholder", e.target.value)}
              placeholder="Field placeholder"
              className="h-8 text-xs"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="helpText" className="text-xs font-bold">Help Text</Label>
            <Input
              id="helpText"
              key={`helpText-${elementId}`}
              defaultValue={attrs.helpText || ""}
              onBlur={(e) => handleUpdate("helpText", e.target.value)}
              placeholder="Help text for the user"
              className="h-8 text-xs"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="group" className="text-xs font-bold">Group</Label>
            <Select value={attrs.group_id || "noGroup"} onValueChange={(val) => handleUpdate("group_id", val === "noGroup" ? null : val)}>
              <SelectTrigger id="group" className="h-8 text-xs"><SelectValue placeholder="No group" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="noGroup">No Group</SelectItem>
                {groups.map((group) => (<SelectItem key={group.id} value={group.id}>{group.group_name}</SelectItem>))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <Checkbox
              id="required"
              checked={attrs.required || false}
              onCheckedChange={(checked) => handleUpdate("required", checked)}
            />
            <Label htmlFor="required" className="text-xs font-medium cursor-pointer">Mark as Required</Label>
          </div>

          {attrs.elementType === "datetime" && (
            <div className="flex items-center gap-2">
              <Checkbox
                id="showTimeOnly"
                checked={attrs.showTimeOnly || false}
                onCheckedChange={(checked) => handleUpdate("showTimeOnly", checked)}
              />
              <Label htmlFor="showTimeOnly" className="text-xs font-medium cursor-pointer text-orange-700">Show Time Only</Label>
            </div>
          )}

          {attrs.elementType === "select" && (
            <div className="space-y-2 p-3 border rounded-md bg-blue-50/50 border-blue-100">
              <Label className="text-xs font-bold text-blue-800">Dropdown Options</Label>
              <p className="text-[10px] text-blue-600 mb-2">Comma-separated static options</p>
              <Textarea
                key={`options-${elementId}`}
                defaultValue={attrs.options?.values?.join(", ") || ""}
                onBlur={(e) => handleUpdate("options", { source: "static", values: e.target.value.split(",").map((v) => v.trim()).filter(Boolean) })}
                placeholder="Option 1, Option 2..."
                className="text-xs min-h-[60px] bg-white"
              />
            </div>
          )}

          {/* Validation Properties */}
          {(attrs.elementType === "input" || attrs.elementType === "numeric" || attrs.elementType === "textarea") && (
            <div className="p-3 border rounded-md bg-muted/10 space-y-3">
              <Label className="text-xs font-bold">Validation</Label>

              {(attrs.elementType === "input" || attrs.elementType === "textarea") && (
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-medium">Min Length</Label>
                    <Input
                      type="number"
                      key={`minLength-${elementId}`}
                      defaultValue={attrs.minLength || ""}
                      onBlur={(e) => handleUpdate("minLength", e.target.value ? Number(e.target.value) : undefined)}
                      placeholder="Minimum length"
                      className="h-7 text-[10px]"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-medium">Max Length</Label>
                    <Input
                      type="number"
                      key={`maxLength-${elementId}`}
                      defaultValue={attrs.maxLength || ""}
                      onBlur={(e) => handleUpdate("maxLength", e.target.value ? Number(e.target.value) : undefined)}
                      placeholder="Maximum length"
                      className="h-7 text-[10px]"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-medium">Pattern (Regex)</Label>
                    <Input
                      key={`pattern-${elementId}`}
                      defaultValue={attrs.pattern || ""}
                      onBlur={(e) => handleUpdate("pattern", e.target.value)}
                      placeholder="^[A-Za-z]+$"
                      className="h-7 text-[10px]"
                    />
                  </div>
                </div>
              )}

              {attrs.elementType === "numeric" && (
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-medium">Min Value</Label>
                    <Input
                      type="number"
                      key={`min-${elementId}`}
                      defaultValue={attrs.min || ""}
                      onBlur={(e) => handleUpdate("min", e.target.value ? Number(e.target.value) : undefined)}
                      placeholder="Minimum value"
                      className="h-7 text-[10px]"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-medium">Max Value</Label>
                    <Input
                      type="number"
                      key={`max-${elementId}`}
                      defaultValue={attrs.max || ""}
                      onBlur={(e) => handleUpdate("max", e.target.value ? Number(e.target.value) : undefined)}
                      placeholder="Maximum value"
                      className="h-7 text-[10px]"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-medium">Step</Label>
                    <Input
                      type="number"
                      key={`step-${elementId}`}
                      defaultValue={attrs.step || 1}
                      onBlur={(e) => handleUpdate("step", e.target.value ? Number(e.target.value) : 1)}
                      placeholder="Step value"
                      className="h-7 text-[10px]"
                    />
                  </div>
                </div>
              )}

              <div className="space-y-1.5 pt-1">
                <Label className="text-[10px] font-medium">Custom Validation Message</Label>
                <Input
                  key={`validationMessage-${elementId}`}
                  defaultValue={attrs.validationMessage || ""}
                  onBlur={(e) => handleUpdate("validationMessage", e.target.value)}
                  placeholder="Error message"
                  className="h-7 text-[10px]"
                />
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="databinding" className="space-y-5 py-4">
          <div className="space-y-2">
            <Label className="text-xs font-bold flex items-center gap-1.5">
              <Search className="w-3 h-3" />
              1. Search Fields
            </Label>
            <div className="relative">
              <Input
                placeholder="Filter by name or ID..."
                className="h-8 text-xs bg-muted/20"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-bold">2. Filter Category</Label>
            <div className="flex flex-wrap gap-1.5">
              <Button
                variant={selectedCategory === "" ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory("")}
                className="h-6 text-[10px] rounded-full px-3"
              >
                All
              </Button>
              {categories.map(cat => (
                <Button
                  key={cat}
                  variant={selectedCategory === cat ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory(cat)}
                  className="h-6 text-[10px] rounded-full px-3"
                >
                  {cat}
                </Button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-bold">3. Select Field (Click to Bind)</Label>
            <div className="border rounded-md p-2 bg-muted/10 min-h-[120px] max-h-[300px] overflow-y-auto flex flex-wrap gap-1.5 content-start">
              {filteredFields.length > 0 ? (
                filteredFields.map(field => (
                  <Button
                    key={field.id}
                    variant={attrs.dataField === field.id ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleDataFieldSelect(field)}
                    className={cn(
                      "h-7 text-[10px] font-normal transition-all",
                      attrs.dataField === field.id ? "bg-green-600 hover:bg-green-700 text-white" : "hover:bg-muted"
                    )}
                  >
                    {field.label}
                  </Button>
                ))
              ) : (
                <div className="w-full py-10 text-center">
                  <p className="text-xs text-muted-foreground">No matches found</p>
                  <Button variant="link" size="sm" onClick={() => { setSearchTerm(""); setSelectedCategory(""); }}>Reset</Button>
                </div>
              )}
            </div>
          </div>

          {attrs.dataField && (
            <div className="p-3 bg-green-50 rounded-md border border-green-100 flex items-start gap-3">
              <Database className="w-4 h-4 text-green-600 mt-0.5" />
              <div>
                <p className="text-xs font-bold text-green-800">Linked to:</p>
                <p className="text-[11px] text-green-700">
                  {PREDEFINED_DATA_FIELDS.find(f => f.id === attrs.dataField)?.label}
                </p>
                <code className="text-[10px] text-green-600">ID: {attrs.dataField}</code>
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <Label className="text-xs font-bold">Binding Type</Label>
            <Select value={attrs.data_binding?.type || "manual"} onValueChange={(val) => handleUpdate("data_binding", { ...(attrs.data_binding || {}), type: val })}>
              <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="manual" className="text-xs">Manual Entry</SelectItem>
                <SelectItem value="api" className="text-xs">Auto-fill (API)</SelectItem>
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
