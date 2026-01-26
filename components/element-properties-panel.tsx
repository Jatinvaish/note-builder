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
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Trash2, Check, ChevronsUpDown } from "lucide-react"
import { cn } from "@/lib/utils"

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
  const [open, setOpen] = useState(false)

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

      <Tabs defaultValue="properties" className="w-full">
        <TabsList className="w-full grid grid-cols-2">
          <TabsTrigger value="properties" className="text-xs">Properties</TabsTrigger>
          <TabsTrigger value="databinding" className="text-xs">Data Binding</TabsTrigger>
        </TabsList>

        <TabsContent value="properties" className="space-y-3">
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

          {/* COMMENTED: Element Key
          <div className="space-y-1">
            <Label htmlFor="elementKey" className="text-xs font-medium">Element Key</Label>
            <Input id="elementKey" value={attrs.elementKey || ""} disabled className="h-7 text-xs bg-muted" />
          </div>
          */}

          <div className="space-y-1">
            <Label htmlFor="type" className="text-xs font-medium">Type</Label>
            <Select value={attrs.elementType || "input"}>
              <SelectTrigger id="type" className="h-7 text-xs"><SelectValue /></SelectTrigger>
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

          {/* Smart Default Value based on element type */}
          {attrs.elementType === "datetime" ? (
            <div className="space-y-1">
              <Label htmlFor="defaultDatetime" className="text-xs font-medium">Default Date/Time</Label>
              <Select value={attrs.defaultDatetime || "none"} onValueChange={(val) => handleUpdate("defaultDatetime", val)}>
                <SelectTrigger id="defaultDatetime" className="h-7 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  <SelectItem value="now">Current Date/Time</SelectItem>
                  <SelectItem value="today">Today (00:00)</SelectItem>
                  <SelectItem value="custom">Custom Value</SelectItem>
                </SelectContent>
              </Select>
              {attrs.defaultDatetime === "custom" && (
                <Input
                  type="datetime-local"
                  key={`defaultValue-${elementId}`}
                  defaultValue={attrs.defaultValue || ""}
                  onBlur={(e) => handleUpdate("defaultValue", e.target.value)}
                  className="h-7 text-xs mt-2"
                />
              )}
            </div>
          ) : attrs.elementType === "checkbox" ? (
            <div className="space-y-1">
              <Label htmlFor="defaultChecked" className="text-xs font-medium">Default State</Label>
              <Select value={attrs.defaultValue === true || attrs.defaultValue === "true" ? "checked" : "unchecked"} onValueChange={(val) => handleUpdate("defaultValue", val === "checked")}>
                <SelectTrigger id="defaultChecked" className="h-7 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="unchecked">Unchecked</SelectItem>
                  <SelectItem value="checked">Checked</SelectItem>
                </SelectContent>
              </Select>
            </div>
          ) : attrs.elementType === "select" ? (
            <div className="space-y-1">
              <Label htmlFor="defaultSelect" className="text-xs font-medium">Default Selection</Label>
              <Select value={attrs.defaultValue || ""} onValueChange={(val) => handleUpdate("defaultValue", val)}>
                <SelectTrigger id="defaultSelect" className="h-7 text-xs"><SelectValue placeholder="Select default..." /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="">None</SelectItem>
                  {(attrs.options?.values || []).map((opt: string) => (
                    <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : (
            <div className="space-y-1">
              <Label htmlFor="default" className="text-xs font-medium">Default Value</Label>
              <Input
                id="default"
                type={attrs.elementType === "numeric" ? "number" : "text"}
                key={`default-${elementId}`}
                defaultValue={attrs.defaultValue || ""}
                onBlur={(e) => handleUpdate("defaultValue", e.target.value)}
                placeholder="Default value"
                className="h-7 text-xs"
              />
            </div>
          )}

          {/* COMMENTED: Placeholder
          <div className="space-y-1">
            <Label htmlFor="placeholder" className="text-xs font-medium">Placeholder</Label>
            <Input id="placeholder" key={`placeholder-${elementId}`} defaultValue={attrs.placeholder || ""} onBlur={(e) => handleUpdate("placeholder", e.target.value)} placeholder="Placeholder text" className="h-7 text-xs" />
          </div>
          */}

          {/* COMMENTED: Help Text
          <div className="space-y-1">
            <Label htmlFor="helpText" className="text-xs font-medium">Help Text</Label>
            <Input id="helpText" key={`helpText-${elementId}`} defaultValue={attrs.helpText || ""} onBlur={(e) => handleUpdate("helpText", e.target.value)} placeholder="Help text for users" className="h-7 text-xs" />
          </div>
          */}

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

          {/* Validation Properties */}
          {(attrs.elementType === "input" || attrs.elementType === "numeric" || attrs.elementType === "textarea") && (
            <div className="space-y-2 p-3 border rounded bg-muted/30">
              <Label className="text-xs font-semibold">Validation</Label>
              
              {(attrs.elementType === "input" || attrs.elementType === "textarea") && (
                <>
                  <div className="space-y-1">
                    <Label htmlFor="minLength" className="text-xs">Min Length</Label>
                    <Input
                      id="minLength"
                      type="number"
                      key={`minLength-${elementId}`}
                      defaultValue={attrs.minLength || ""}
                      onBlur={(e) => handleUpdate("minLength", e.target.value ? Number(e.target.value) : undefined)}
                      placeholder="Minimum length"
                      className="h-7 text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="maxLength" className="text-xs">Max Length</Label>
                    <Input
                      id="maxLength"
                      type="number"
                      key={`maxLength-${elementId}`}
                      defaultValue={attrs.maxLength || ""}
                      onBlur={(e) => handleUpdate("maxLength", e.target.value ? Number(e.target.value) : undefined)}
                      placeholder="Maximum length"
                      className="h-7 text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="pattern" className="text-xs">Pattern (Regex)</Label>
                    <Input
                      id="pattern"
                      key={`pattern-${elementId}`}
                      defaultValue={attrs.pattern || ""}
                      onBlur={(e) => handleUpdate("pattern", e.target.value)}
                      placeholder="^[A-Za-z]+$"
                      className="h-7 text-xs"
                    />
                  </div>
                </>
              )}
              
              {attrs.elementType === "numeric" && (
                <>
                  <div className="space-y-1">
                    <Label htmlFor="min" className="text-xs">Min Value</Label>
                    <Input
                      id="min"
                      type="number"
                      key={`min-${elementId}`}
                      defaultValue={attrs.min || ""}
                      onBlur={(e) => handleUpdate("min", e.target.value ? Number(e.target.value) : undefined)}
                      placeholder="Minimum value"
                      className="h-7 text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="max" className="text-xs">Max Value</Label>
                    <Input
                      id="max"
                      type="number"
                      key={`max-${elementId}`}
                      defaultValue={attrs.max || ""}
                      onBlur={(e) => handleUpdate("max", e.target.value ? Number(e.target.value) : undefined)}
                      placeholder="Maximum value"
                      className="h-7 text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="step" className="text-xs">Step</Label>
                    <Input
                      id="step"
                      type="number"
                      key={`step-${elementId}`}
                      defaultValue={attrs.step || 1}
                      onBlur={(e) => handleUpdate("step", e.target.value ? Number(e.target.value) : 1)}
                      placeholder="Step value"
                      className="h-7 text-xs"
                    />
                  </div>
                </>
              )}
              
              <div className="space-y-1">
                <Label htmlFor="validationMessage" className="text-xs">Custom Validation Message</Label>
                <Input
                  id="validationMessage"
                  key={`validationMessage-${elementId}`}
                  defaultValue={attrs.validationMessage || ""}
                  onBlur={(e) => handleUpdate("validationMessage", e.target.value)}
                  placeholder="Error message"
                  className="h-7 text-xs"
                />
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="databinding" className="space-y-3">
          <p className="text-xs text-muted-foreground mb-2">Configure data binding for this field</p>
          
          <div className="space-y-2">
            <Label className="text-xs font-medium">Clinical Data Field</Label>
            <Popover open={open} onOpenChange={setOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={open}
                  className="w-full justify-between h-8 text-xs font-normal"
                >
                  {attrs.dataField
                    ? PREDEFINED_DATA_FIELDS.find((field) => field.id === attrs.dataField)?.label
                    : "Select field..."}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[300px] p-0">
                <Command>
                  <CommandInput placeholder="Search field..." className="h-8 text-xs" />
                  <CommandList>
                    <CommandEmpty className="text-xs py-2 text-center">No field found.</CommandEmpty>
                    <CommandGroup>
                      {PREDEFINED_DATA_FIELDS.map((field) => (
                        <CommandItem
                          key={field.id}
                          value={field.id}
                          onSelect={(currentValue) => {
                            handleUpdate("dataField", currentValue === attrs.dataField ? "" : currentValue)
                            setOpen(false)
                          }}
                          className="text-xs"
                        >
                          <Check
                            className={cn(
                              "mr-2 h-3 w-3",
                              attrs.dataField === field.id ? "opacity-100" : "opacity-0"
                            )}
                          />
                          {field.label}
                          <span className="ml-auto text-muted-foreground text-[10px]">({field.category})</span>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
            {attrs.dataField && <p className="text-xs text-muted-foreground mt-2 p-2 bg-muted rounded">Field ID: <code className="font-mono">{attrs.dataField}</code></p>}
          </div>

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
