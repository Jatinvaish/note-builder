"use client"
import { NodeViewWrapper } from "@tiptap/react"
import { Trash2, Settings } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { getAvailableGroups } from "@/lib/editor-context"

interface FormElementNodeProps {
  node: any
  updateAttributes: (attrs: Record<string, any>) => void
  deleteNode: () => void
  availableGroups?: any[]
}

const ELEMENT_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  input: { bg: "bg-blue-50", border: "border-blue-200", text: "text-blue-700" },
  checkbox: { bg: "bg-green-50", border: "border-green-200", text: "text-green-700" },
  select: { bg: "bg-purple-50", border: "border-purple-200", text: "text-purple-700" },
  textarea: { bg: "bg-amber-50", border: "border-amber-200", text: "text-amber-700" },
  datetime: { bg: "bg-orange-50", border: "border-orange-200", text: "text-orange-700" },
  signature: { bg: "bg-pink-50", border: "border-pink-200", text: "text-pink-700" },
}

export function FormElementNode({ node, updateAttributes, deleteNode, availableGroups }: FormElementNodeProps) {
  const { elementType, label, elementKey, defaultValue, required, options, group_id, dataField } = node.attrs
  const colors = ELEMENT_COLORS[elementType] || ELEMENT_COLORS.input
  const groups = availableGroups || getAvailableGroups()

  return (
    <NodeViewWrapper className="inline-flex items-center gap-1">
      <Popover>
        <PopoverTrigger asChild>
          <button
            className={`inline-flex items-center gap-2 px-2.5 py-1 rounded border text-xs font-medium cursor-pointer hover:shadow-sm transition-all ${colors.bg} ${colors.border} ${colors.text}`}
          >
            <Settings className="w-3 h-3" />
            {label}
            {required && <span className="text-red-500">*</span>}
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-72" align="start">
          <div className="space-y-3">
            <div>
              <Label className="text-xs font-medium">Label</Label>
              <Input
                value={label}
                onChange={(e) => updateAttributes({ label: e.target.value })}
                className="mt-1 h-8 text-xs"
                placeholder="Field label"
              />
            </div>

            <div>
              <Label className="text-xs font-medium">Element Key</Label>
              <Input
                value={elementKey}
                onChange={(e) => updateAttributes({ elementKey: e.target.value })}
                className="mt-1 h-8 text-xs"
                placeholder="field_key"
                disabled
              />
            </div>

            {groups && groups.length > 0 && (
              <div>
                <Label className="text-xs font-medium">Assign to Group</Label>
                <Select
                  value={group_id || ""}
                  onValueChange={(value) => updateAttributes({ group_id: value || null })}
                >
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue placeholder="No group" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No group</SelectItem>
                    {groups.map((group: any) => (
                      <SelectItem key={group.id} value={group.id}>
                        {group.group_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="flex items-center gap-2">
              <Checkbox
                id="required"
                checked={required}
                onCheckedChange={(checked) => updateAttributes({ required: checked })}
              />
              <Label htmlFor="required" className="text-xs font-medium cursor-pointer">
                Required Field
              </Label>
            </div>

            {elementType === "select" && (
              <div className="space-y-2">
                <Label className="text-xs font-medium">Options</Label>
                <Input
                  value={options?.values?.join(", ") || ""}
                  onChange={(e) =>
                    updateAttributes({
                      options: {
                        ...options,
                        values: e.target.value
                          .split(",")
                          .map((v) => v.trim())
                          .filter(Boolean),
                      },
                    })
                  }
                  className="h-8 text-xs"
                  placeholder="Option 1, Option 2, Option 3"
                />
              </div>
            )}

            <Button onClick={deleteNode} variant="destructive" size="sm" className="w-full h-7 text-xs gap-2">
              <Trash2 className="w-3 h-3" />
              Delete Field
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    </NodeViewWrapper>
  )
}
