"use client"

import { useState } from "react"
import type { Template } from "@/lib/types"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { ChevronDown } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface TemplateMetadataHeaderProps {
  template: Template
  onNameChange: (name: string) => void
  onTypeChange: (type: "navigate only" | "regular") => void
  onStatusChange: (status: "active" | "inactive") => void
  onVersionSelect?: (versionId: number) => void
  showVersionSelector?: boolean
}

export function TemplateMetadataHeader({
  template,
  onNameChange,
  onTypeChange,
  onStatusChange,
  onVersionSelect,
  showVersionSelector = false,
}: TemplateMetadataHeaderProps) {
  const [isEditing, setIsEditing] = useState(false)

  return (
    <div className="bg-background border-b border-border p-4 space-y-3">
      {/* Main metadata row */}
      <div className="flex items-center gap-4">
        {/* Template Name */}
        <div className="flex-1">
          <label className="text-xs font-medium text-muted-foreground mb-1 block">Template Name</label>
          <Input
            value={template.templateName}
            onChange={(e) => onNameChange(e.target.value)}
            placeholder="Enter template name"
            className="h-9"
          />
        </div>

        {/* Template Type */}
        <div className="w-48">
          <label className="text-xs font-medium text-muted-foreground mb-1 block">Type</label>
          <Select value={template.templateType} onValueChange={onTypeChange}>
            <SelectTrigger className="h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="regular">Regular</SelectItem>
              <SelectItem value="navigate only">Navigate Only</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Status */}
        <div className="w-40">
          <label className="text-xs font-medium text-muted-foreground mb-1 block">Status</label>
          <Select value={template.status || "active"} onValueChange={onStatusChange}>
            <SelectTrigger className="h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Version Selector (edit page only) */}
        {showVersionSelector && template.versionHistory.length > 0 && (
          <div className="w-56">
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Version</label>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="w-full justify-between h-9 bg-transparent">
                  <span className="text-sm">v{template.versionHistory.length}</span>
                  <ChevronDown className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                {template.versionHistory
                  .slice()
                  .reverse()
                  .map((version) => (
                    <DropdownMenuItem
                      key={version.version}
                      onClick={() => onVersionSelect?.(version.version)}
                      className="cursor-pointer"
                    >
                      <div className="flex flex-col gap-1">
                        <span className="text-sm font-medium">v{version.version}</span>
                        <span className="text-xs text-muted-foreground">
                          {new Date(version.timestamp).toLocaleDateString()} {new Date(version.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                    </DropdownMenuItem>
                  ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </div>

      {/* Template Description (optional) */}
      <div>
        <label className="text-xs font-medium text-muted-foreground mb-1 block">Description (optional)</label>
        <Input
          value={template.templateDescription}
          onChange={(e) => {
            // This would need an onDescriptionChange prop to be functional
            // For now, it's display-only
          }}
          placeholder="Add a description for this template..."
          className="h-8 text-sm"
        />
      </div>
    </div>
  )
}
