"use client"

import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import type { Group } from "@/lib/types"

interface GroupWisePreviewProps {
  groups: Group[]
  templateContent: any
}

export function GroupWisePreview({ groups, templateContent }: GroupWisePreviewProps) {
  // Extract all form elements from template content
  const extractFormElements = (content: any[]) => {
    const elements: any[] = []

    const traverse = (nodes: any[]) => {
      if (!Array.isArray(nodes)) return

      nodes.forEach((node) => {
        if (node.type === "formElement") {
          elements.push({
            ...node.attrs,
            position: elements.length,
          })
        }
        if (Array.isArray(node.content)) {
          traverse(node.content)
        }
      })
    }

    traverse(content)
    return elements
  }

  const formElements = extractFormElements(templateContent?.content || [])

  // Group elements by group_id
  const groupedElements = new Map<string | null, any[]>()
  formElements.forEach((element) => {
    const groupId = element.group_id || null
    if (!groupedElements.has(groupId)) {
      groupedElements.set(groupId, [])
    }
    groupedElements.get(groupId)!.push(element)
  })

  // Get groups sorted by order_by
  const sortedGroups = [...groups].sort((a, b) => a.order_by - b.order_by)

  // Get ungrouped elements (group_id is null)
  const ungroupedElements = groupedElements.get(null) || []

  return (
    <div className="flex flex-col gap-3 h-full">
      <div className="space-y-2 p-3 border-b">
        <h3 className="text-sm font-semibold">Field Preview</h3>
        <p className="text-xs text-muted-foreground">Elements by group</p>
      </div>

      <ScrollArea className="flex-1">
        <div className="space-y-3 px-3 py-2">
          {/* Show grouped elements first (sorted by group order_by) */}
          {sortedGroups.map((group) => {
            const groupElements = groupedElements.get(group.id) || []
            if (groupElements.length === 0) return null

            return (
              <div key={group.id} className="space-y-1">
                <div className="flex items-center gap-2">
                  <Badge 
                    variant={group.status === "active" ? "default" : "secondary"}
                    className="text-xs"
                  >
                    {group.group_name}
                  </Badge>
                  <span className="text-xs text-muted-foreground">({groupElements.length})</span>
                </div>
                <div className="pl-3 space-y-1 border-l-2 border-muted">
                  {groupElements.map((element, idx) => (
                    <div key={`${group.id}-${idx}`} className="text-xs">
                      <p className="font-medium">{element.label}</p>
                      <p className="text-muted-foreground text-xs">
                        {element.elementType} {element.required && <span className="text-red-500">*</span>}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}

          {/* Show ungrouped elements if any */}
          {ungroupedElements.length > 0 && (
            <div className="space-y-1 border-t pt-2">
              <Badge variant="outline" className="text-xs">
                Ungrouped ({ungroupedElements.length})
              </Badge>
              <div className="pl-3 space-y-1 border-l-2 border-muted">
                {ungroupedElements.map((element, idx) => (
                  <div key={`ungrouped-${idx}`} className="text-xs">
                    <p className="font-medium">{element.label}</p>
                    <p className="text-muted-foreground text-xs">
                      {element.elementType} {element.required && <span className="text-red-500">*</span>}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {formElements.length === 0 && (
            <div className="text-xs text-muted-foreground p-2 text-center">
              No elements added yet
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  )
}
