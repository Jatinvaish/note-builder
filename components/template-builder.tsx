"use client"

import React, { useState, useCallback, useMemo } from "react"
import type { Template, Group, FormElement } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { FreeFormEditor } from "./free-form-editor"
import { GroupMasterPanel } from "./group-master-panel"
import { ElementPropertiesPanel } from "./element-properties-panel"
import { GroupWisePreview } from "./group-wise-preview"
import { Save, X, Eye } from "lucide-react"

interface TemplateBuilderProps {
  template?: Template
  onSave: (template: Template) => Promise<void>
  onCancel: () => void
}

// Helper to render template content for PDF preview
function renderTemplatePreview(content: any): React.ReactNode {
  if (!content || !content.content) return null

  function renderContent(nodes: any[]): React.ReactNode {
    if (!Array.isArray(nodes)) return null
    return nodes.map((n, i) => {
      if (n.type === "text") return <React.Fragment key={i}>{n.text}</React.Fragment>
      return renderNode(n, i)
    })
  }

  const renderNode = (node: any, idx: number): React.ReactNode => {
    if (!node) return null

    switch (node.type) {
      case "heading":
        const level = node.attrs?.level || 1
        if (level === 1) {
          return (
            <h1 key={idx} className="text-2xl font-bold mt-4 mb-2">
              {renderContent(node.content)}
            </h1>
          )
        } else if (level === 2) {
          return (
            <h2 key={idx} className="text-xl font-bold mt-3 mb-2">
              {renderContent(node.content)}
            </h2>
          )
        } else {
          return (
            <h3 key={idx} className="text-lg font-bold mt-3 mb-2">
              {renderContent(node.content)}
            </h3>
          )
        }

      case "paragraph":
        return (
          <p key={idx} className="mb-3 leading-relaxed">
            {renderContent(node.content)}
          </p>
        )

      case "bulletList":
        return (
          <ul key={idx} className="list-disc list-inside mb-3 space-y-1">
            {node.content?.map((item: any, i: number) => (
              <li key={i} className="ml-4">
                {renderContent(item.content)}
              </li>
            ))}
          </ul>
        )

      case "orderedList":
        return (
          <ol key={idx} className="list-decimal list-inside mb-3 space-y-1">
            {node.content?.map((item: any, i: number) => (
              <li key={i} className="ml-4">
                {renderContent(item.content)}
              </li>
            ))}
          </ol>
        )

      case "table":
        return (
          <table key={idx} className="w-full border-collapse border border-gray-300 mb-3">
            <tbody>
              {node.content?.map((row: any, i: number) => (
                <tr key={i} className="border border-gray-300">
                  {row.content?.map((cell: any, j: number) => {
                    const isHeader = cell.type === "tableHeader"
                    return isHeader ? (
                      <th key={j} className="border border-gray-300 p-2 bg-gray-100 font-bold">
                        {renderContent(cell.content)}
                      </th>
                    ) : (
                      <td key={j} className="border border-gray-300 p-2">
                        {renderContent(cell.content)}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        )

      case "formElement":
        return (
          <div key={idx} className="flex items-center gap-3 mb-2 p-2 bg-gray-50 rounded border border-gray-200">
            <label className="text-sm font-medium flex-shrink-0">{node.attrs?.label}</label>
            <div className="flex-1 border-b border-gray-400"></div>
            {node.attrs?.required && <span className="text-red-500 text-sm">*</span>}
          </div>
        )

      default:
        return null
    }
  }

  return content.content.map((node: any, idx: number) => renderNode(node, idx))
}

export function TemplateBuilder({
  template,
  onSave,
  onCancel,
}: TemplateBuilderProps) {
  const [name, setName] = useState(template?.templateName || "")
  const [description, setDescription] = useState(template?.templateDescription || "")
  const [type, setType] = useState<"normal" | "navigation_callback">(
    (template?.templateType as "normal" | "navigation_callback") || "normal"
  )
  const [status, setStatus] = useState<"active" | "inactive">(
    template?.status || "active"
  )
  const [groups, setGroups] = useState<Group[]>(template?.groups || [])
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null)
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [templateContent, setTemplateContent] = useState(template?.templateContent || { type: "doc", content: [] })
  const [versions, setVersions] = useState([]) // Declare versions variable
  const [selectedVersion, setSelectedVersion] = useState(0) // Declare selectedVersion variable

  // Group handlers
  const handleGroupCreate = useCallback((newGroup: Omit<Group, "id">) => {
    const group: Group = {
      id: `group-${Date.now()}`,
      ...newGroup,
    }
    setGroups((prev) => [...prev, group])
  }, [])

  const handleGroupUpdate = useCallback((updatedGroup: Group) => {
    setGroups((prev) => prev.map((g) => (g.id === updatedGroup.id ? updatedGroup : g)))
  }, [])

  const handleGroupDelete = useCallback((groupId: string) => {
    setGroups((prev) => prev.filter((g) => g.id !== groupId))
  }, [])

  const handleGroupReorder = useCallback((reorderedGroups: Group[]) => {
    setGroups(reorderedGroups)
  }, [])

  const handleSave = async () => {
    if (!name.trim()) {
      alert("Template name is required")
      return
    }

    setIsSaving(true)
    try {
      const updatedTemplate: Template = {
        ...(template || {
          id: `template-${Date.now()}`,
          versionHistory: [],
          createdAt: new Date().toISOString(),
        }),
        templateName: name,
        templateDescription: description,
        templateType: type,
        status,
        groups,
        templateContent,
        updatedAt: new Date().toISOString(),
      } as Template

      await onSave(updatedTemplate)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Header Row: Single row with metadata */}
      <div className="border-b bg-card p-3">
        <div className="flex items-center gap-3 max-w-7xl mx-auto">
          {/* Template Name */}
          <div className="flex-1 flex items-center gap-2">
            <Label htmlFor="template-name" className="text-xs font-medium whitespace-nowrap">
              Name:
            </Label>
            <Input
              id="template-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Template name"
              className="h-7 text-xs max-w-xs"
            />
          </div>

          {/* Template Type */}
          <div className="flex items-center gap-2">
            <Label htmlFor="template-type" className="text-xs font-medium whitespace-nowrap">
              Type:
            </Label>
            <Select value={type} onValueChange={(v) => setType(v as "normal" | "navigation_callback")}>
              <SelectTrigger id="template-type" className="h-7 text-xs w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="normal">Normal</SelectItem>
                <SelectItem value="navigation_callback">Navigation Callback</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Status */}
          <div className="flex items-center gap-2">
            <Label htmlFor="template-status" className="text-xs font-medium whitespace-nowrap">
              Status:
            </Label>
            <Select value={status} onValueChange={(v) => setStatus(v as "active" | "inactive")}>
              <SelectTrigger id="template-status" className="h-7 text-xs w-28">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Version Selector */}
          {versions.length > 0 && (
            <div className="flex items-center gap-2">
              <Label htmlFor="version-select" className="text-xs font-medium whitespace-nowrap">
                Version:
              </Label>
              <Select value={String(selectedVersion)} onValueChange={(v) => setSelectedVersion(Number(v))}>
                <SelectTrigger id="version-select" className="h-7 text-xs w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {versions.map((v) => (
                    <SelectItem key={v.version} value={String(v.version)}>
                      v{v.version}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center gap-2 ml-auto">
            <Button
              size="sm"
              variant="outline"
              onClick={onCancel}
              className="h-7 text-xs bg-transparent"
            >
              <X className="w-3 h-3 mr-1" />
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleSave}
              disabled={isSaving || !name.trim()}
              className="h-7 text-xs flex items-center gap-1"
            >
              <Save className="w-3 h-3 mr-1" />
              {isSaving ? "Saving..." : "Save"}
            </Button>
          </div>
        </div>
      </div>

      {/* 3-Panel Layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* LEFT PANEL: Groups & Elements */}
        <div className="w-64 border-r bg-card overflow-y-auto">
          <GroupMasterPanel
            groups={groups}
            onGroupCreate={handleGroupCreate}
            onGroupUpdate={handleGroupUpdate}
            onGroupDelete={handleGroupDelete}
            onGroupReorder={handleGroupReorder}
          />
        </div>

        {/* MIDDLE PANEL: Editor */}
        <div className="flex-1 overflow-hidden">
          <FreeFormEditor
            template={template}
            onSave={handleSave}
            onCancel={onCancel}
            selectedElementId={selectedElementId}
            groups={groups}
            onElementSelected={setSelectedElementId}
            onTemplateContentChange={setTemplateContent}
          />
        </div>

        {/* RIGHT PANEL: Properties & Preview */}
        <div className="w-80 border-l bg-card overflow-y-auto">
          <Tabs defaultValue="properties" className="h-full flex flex-col">
            <TabsList className="w-full rounded-none border-b grid grid-cols-3">
              <TabsTrigger value="properties" className="text-xs">
                Properties
              </TabsTrigger>
              <TabsTrigger value="preview" className="text-xs">
                Preview
              </TabsTrigger>
              <TabsTrigger value="raw" className="text-xs">
                Raw
              </TabsTrigger>
            </TabsList>

            {/* Properties Tab */}
            <TabsContent value="properties" className="flex-1 overflow-y-auto p-3">
              {selectedElementId && (
                <ElementPropertiesPanel
                  elementId={selectedElementId}
                  groups={groups}
                  templateContent={templateContent}
                  onUpdate={(updatedContent) => setTemplateContent(updatedContent)}
                />
              )}
              {!selectedElementId && (
                <div className="text-xs text-muted-foreground p-2">
                  Select an element in the editor to view its properties
                </div>
              )}
            </TabsContent>

            {/* Preview Tab */}
            <TabsContent value="preview" className="flex-1 overflow-y-auto p-3">
              <GroupWisePreview
                groups={groups}
                templateContent={templateContent}
              />
            </TabsContent>

            {/* Raw PDF Preview Tab */}
            <TabsContent value="raw" className="flex-1 overflow-y-auto p-3">
              <div className="space-y-3">
                <h3 className="text-sm font-semibold">PDF Preview</h3>
                <p className="text-xs text-muted-foreground">
                  This is how your template will look when exported as PDF (form fields will show as empty)
                </p>
                <div className="border border-border rounded-lg p-4 bg-white prose prose-sm max-w-none text-sm">
                  {renderTemplatePreview(templateContent)}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
