"use client"

import React, { useState, useCallback, useEffect, useRef } from "react"
import type { Template, Group, TemplateVersion } from "@/lib/types"
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
import { Badge } from "@/components/ui/badge"
import { FreeFormEditor } from "./free-form-editor"
import { GroupMasterPanel } from "./group-master-panel"
import { ElementPropertiesPanel } from "./element-properties-panel"
import { Save, X, Printer, History, Clock } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface TemplateBuilderProps {
  template?: Template
  onSave: (template: Template) => Promise<void>
  onCancel: () => void
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
  const [versions, setVersions] = useState<TemplateVersion[]>(template?.versionHistory || [])
  const [selectedVersion, setSelectedVersion] = useState<number | null>(null)
  const [isVersionDialogOpen, setIsVersionDialogOpen] = useState(false)
  const [autoSaveEnabled] = useState(false)
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null)
  const [lastSaved, setLastSaved] = useState<Date | null>(template ? new Date(template.updatedAt) : null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [editor, setEditor] = useState<any>(null)

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

  // Auto-save functionality - DISABLED, only manual save creates versions
  // useEffect(() => {
  //   if (!autoSaveEnabled || !template?.id) return
  //   if (autoSaveTimerRef.current) {
  //     clearTimeout(autoSaveTimerRef.current)
  //   }
  //   autoSaveTimerRef.current = setTimeout(() => {
  //     handleSave(true)
  //   }, 3000)
  //   return () => {
  //     if (autoSaveTimerRef.current) {
  //       clearTimeout(autoSaveTimerRef.current)
  //     }
  //   }
  // }, [templateContent, name, description, type, status, groups])

  const handleSave = async () => {
    if (!name.trim()) {
      toast({
        title: "Error",
        description: "Template name is required",
        variant: "destructive",
      })
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
      setLastSaved(new Date())
      
      // Reload versions after save
      const { getTemplate } = await import("@/lib/template-storage")
      const saved = getTemplate(updatedTemplate.id)
      if (saved) {
        setVersions(saved.versionHistory || [])
      }
      
      toast({
        title: "Success",
        description: "Template saved successfully",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save template",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handlePrint = () => {
    window.print()
  }

  const handleImportDoc = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      const mammoth = (await import('mammoth')).default
      const arrayBuffer = await file.arrayBuffer()
      const result = await mammoth.convertToHtml({ arrayBuffer })
      
      if (editor) {
        editor.commands.setContent(result.value)
      }
      
      toast({
        title: "Success",
        description: "Document imported successfully",
      })
      
      event.target.value = ''
    } catch (error) {
      console.error('Import error:', error)
      toast({
        title: "Error",
        description: "Failed to import document",
        variant: "destructive",
      })
    }
  }

  const convertHTMLToTipTap = (element: HTMLElement): any => {
    const content: any[] = []
    
    const processNode = (node: Node): any => {
      if (node.nodeType === Node.TEXT_NODE) {
        const text = node.textContent || ''
        if (text.trim()) {
          return { type: 'text', text }
        }
        return null
      }
      
      if (node.nodeType === Node.ELEMENT_NODE) {
        const el = node as HTMLElement
        const tag = el.tagName.toLowerCase()
        const children = Array.from(el.childNodes).map(processNode).filter(Boolean)
        
        if (tag === 'p') {
          return {
            type: 'paragraph',
            content: children.length ? children : [{ type: 'text', text: '' }]
          }
        }
        
        if (tag.match(/^h[1-6]$/)) {
          return {
            type: 'heading',
            attrs: { level: parseInt(tag[1]) },
            content: children.length ? children : [{ type: 'text', text: '' }]
          }
        }
        
        if (tag === 'strong' || tag === 'b') {
          return children.map((c: any) => {
            if (c.type === 'text') {
              return { ...c, marks: [{ type: 'bold' }] }
            }
            return c
          })
        }
        
        if (tag === 'em' || tag === 'i') {
          return children.map((c: any) => {
            if (c.type === 'text') {
              return { ...c, marks: [{ type: 'italic' }] }
            }
            return c
          })
        }
        
        if (tag === 'u') {
          return children.map((c: any) => {
            if (c.type === 'text') {
              return { ...c, marks: [{ type: 'underline' }] }
            }
            return c
          })
        }
        
        if (tag === 'ul') {
          const items = Array.from(el.querySelectorAll(':scope > li')).map(li => ({
            type: 'listItem',
            content: [{
              type: 'paragraph',
              content: [{ type: 'text', text: li.textContent || '' }]
            }]
          }))
          return { type: 'bulletList', content: items }
        }
        
        if (tag === 'ol') {
          const items = Array.from(el.querySelectorAll(':scope > li')).map(li => ({
            type: 'listItem',
            content: [{
              type: 'paragraph',
              content: [{ type: 'text', text: li.textContent || '' }]
            }]
          }))
          return { type: 'orderedList', content: items }
        }
        
        if (tag === 'table') {
          const rows = Array.from(el.querySelectorAll('tr')).map(tr => ({
            type: 'tableRow',
            content: Array.from(tr.querySelectorAll('td, th')).map(cell => ({
              type: cell.tagName.toLowerCase() === 'th' ? 'tableHeader' : 'tableCell',
              content: [{
                type: 'paragraph',
                content: [{ type: 'text', text: cell.textContent || '' }]
              }]
            }))
          }))
          return { type: 'table', content: rows }
        }
        
        if (tag === 'br') {
          return { type: 'hardBreak' }
        }
        
        return children
      }
      
      return null
    }
    
    element.childNodes.forEach(node => {
      const result = processNode(node)
      if (result) {
        if (Array.isArray(result)) {
          content.push(...result.flat())
        } else {
          content.push(result)
        }
      }
    })
    
    return { type: 'doc', content: content.length ? content : [{ type: 'paragraph', content: [] }] }
  }

  const renderTemplateHTML = (content: any): string => {
    if (!content || !content.content) return "<p>No content</p>"

    const renderNode = (node: any): string => {
      if (!node) return ""

      switch (node.type) {
        case "heading":
          const level = node.attrs?.level || 1
          const sizes: Record<number, string> = { 1: "24px", 2: "20px", 3: "18px" }
          return `<h${level} style="font-size: ${sizes[level] || "16px"}; font-weight: bold; margin: 10px 0;">${renderContent(node.content)}</h${level}>`

        case "paragraph":
          const align = node.attrs?.textAlign || "left"
          return `<p style="margin: 8px 0; text-align: ${align};">${renderContent(node.content)}</p>`

        case "bulletList":
          return `<ul style="margin: 8px 0; padding-left: 20px;">${node.content?.map((item: any) => `<li>${renderContent(item.content)}</li>`).join("") || ""}</ul>`

        case "orderedList":
          return `<ol style="margin: 8px 0; padding-left: 20px;">${node.content?.map((item: any) => `<li>${renderContent(item.content)}</li>`).join("") || ""}</ol>`

        case "table":
          const rows = node.content?.map((row: any) => {
            const cells = row.content?.map((cell: any) => {
              const isHeader = cell.type === "tableHeader"
              const tag = isHeader ? "th" : "td"
              return `<${tag} style="border: 1px solid #000; padding: 8px; ${isHeader ? "font-weight: bold; background-color: #f0f0f0;" : ""}">${renderContent(cell.content)}</${tag}>`
            }).join("") || ""
            return `<tr>${cells}</tr>`
          }).join("") || ""
          return `<table style="border-collapse: collapse; width: 100%; margin: 10px 0;">${rows}</table>`

        case "formElement":
          return `<div class="form-field">
            <strong>${node.attrs?.label || "Field"}${node.attrs?.required ? " *" : ""}:</strong>
            <div class="form-field-input"></div>
          </div>`

        case "image":
          return `<img src="${node.attrs?.src || ""}" style="max-width: 100%; margin: 10px 0;" />`

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
              if (mark.type === "link") text = `<a href="${mark.attrs?.href || "#"}" style="color: blue; text-decoration: underline;">${text}</a>`
            })
          }
          return text
        }
        return renderNode(n)
      }).join("")
    }

    return content.content.map((node: any) => renderNode(node)).join("")
  }

  const handleVersionRestore = (version: TemplateVersion) => {
    setTemplateContent(version.templateContent)
    setVersions(template?.versionHistory || [])
    setIsVersionDialogOpen(false)
    
    if (editor) {
      editor.commands.setContent(version.templateContent)
    }
    
    toast({
      title: "Version Restored",
      description: `Restored to version ${version.version}`,
    })
  }

  const formatLastSaved = () => {
    if (!lastSaved) return "Not saved"
    const now = new Date()
    const diff = Math.floor((now.getTime() - lastSaved.getTime()) / 1000)
    if (diff < 60) return "Saved just now"
    if (diff < 3600) return `Saved ${Math.floor(diff / 60)} min ago`
    return `Saved ${Math.floor(diff / 3600)} hr ago`
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

          {/* Auto-save Status */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Clock className="w-3 h-3" />
            {formatLastSaved()}
          </div>

          {/* Version History Button */}
          {versions.length > 0 && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => setIsVersionDialogOpen(true)}
              className="h-7 text-xs bg-transparent gap-1"
            >
              <History className="w-3 h-3" />
              Versions ({versions.length})
            </Button>
          )}

          {/* Action Buttons */}
          <div className="flex items-center gap-2 ml-auto">
            <input
              type="file"
              accept=".doc,.docx"
              onChange={handleImportDoc}
              className="hidden"
              id="import-doc"
            />
            <Button
              size="sm"
              variant="outline"
              onClick={() => document.getElementById('import-doc')?.click()}
              className="h-7 text-xs bg-transparent gap-1"
            >
              <Printer className="w-3 h-3" />
              Import Doc
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={onCancel}
              className="h-7 text-xs bg-transparent gap-1"
            >
              <X className="w-3 h-3" />
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleSave}
              disabled={isSaving || !name.trim()}
              className="h-7 text-xs flex items-center gap-1"
            >
              <Save className="w-3 h-3" />
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
            onEditorReady={setEditor}
          />
        </div>

        {/* RIGHT PANEL: Properties & Preview */}
        <div className="w-80 border-l bg-card overflow-y-auto">
          <Tabs defaultValue="properties" className="h-full flex flex-col">
            <TabsList className="w-full rounded-none border-b grid grid-cols-2">
              <TabsTrigger value="properties" className="text-xs">
                Properties
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
                  Double-click an element in the editor to view its properties
                </div>
              )}
            </TabsContent>

            {/* Raw PDF Preview Tab */}
            <TabsContent value="raw" className="flex-1 overflow-y-auto p-3">
              <div className="space-y-3">
                <h3 className="text-sm font-semibold">Raw Content</h3>
                <pre className="text-xs bg-muted p-3 rounded overflow-auto max-h-96">
                  {JSON.stringify(templateContent, null, 2)}
                </pre>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Version History Dialog */}
      <Dialog open={isVersionDialogOpen} onOpenChange={setIsVersionDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Version History</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            {versions.length === 0 ? (
              <p className="text-sm text-muted-foreground">No version history available</p>
            ) : (
              versions.map((version) => (
                <div
                  key={version.version}
                  className="border rounded-lg p-3 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline">v{version.version}</Badge>
                        <span className="text-xs text-muted-foreground">
                          {new Date(version.timestamp).toLocaleString()}
                        </span>
                      </div>
                      {version.changedFields && version.changedFields.length > 0 && (
                        <p className="text-xs text-muted-foreground">
                          Changed: {version.changedFields.join(", ")}
                        </p>
                      )}
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
    </div>
  )
}
