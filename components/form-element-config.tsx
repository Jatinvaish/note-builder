"use client"

import { useState } from "react"
import type { FormElement, SelectOptions } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Trash2 } from "lucide-react"

interface FormElementConfigProps {
  element: FormElement
  onUpdate: (attrs: Partial<FormElement>) => void
  onDelete: () => void
}

export function FormElementConfig({ element, onUpdate, onDelete }: FormElementConfigProps) {
  const [options, setOptions] = useState<SelectOptions>(element.options || { source: "static", values: [] })

  const handleOptionsChange = (newOptions: SelectOptions) => {
    setOptions(newOptions)
    onUpdate({ options: newOptions })
  }

  return (
    <div className="space-y-3 text-sm">
      <div>
        <Label htmlFor="label" className="text-xs">
          Label
        </Label>
        <Input
          id="label"
          value={element.label}
          onChange={(e) => onUpdate({ label: e.target.value })}
          placeholder="Field label"
          className="mt-1 h-8"
        />
      </div>

      <div>
        <Label htmlFor="key" className="text-xs">
          Key (for data storage)
        </Label>
        <Input
          id="key"
          value={element.elementKey}
          onChange={(e) => onUpdate({ elementKey: e.target.value })}
          placeholder="field_key"
          className="mt-1 h-8"
          disabled
        />
      </div>

      <div className="flex items-center gap-2">
        <Checkbox
          id="required"
          checked={element.required}
          onCheckedChange={(checked) => onUpdate({ required: Boolean(checked) })}
        />
        <Label htmlFor="required" className="text-xs">
          Required field
        </Label>
      </div>

      {element.elementType === "checkbox" && (
        <div className="flex items-center gap-2">
          <Checkbox
            id="default-checked"
            checked={element.defaultValue === "true"}
            onCheckedChange={(checked) => onUpdate({ defaultValue: checked ? "true" : "false" })}
          />
          <Label htmlFor="default-checked" className="text-xs">
            Default checked
          </Label>
        </div>
      )}

      {element.elementType === "select" && (
        <div className="space-y-2">
          <Label className="text-xs">Data Source</Label>
          <select
            value={options.source}
            onChange={(e) => handleOptionsChange({ ...options, source: e.target.value as "static" | "api" })}
            className="w-full text-xs px-2 py-1 rounded border border-border"
          >
            <option value="static">Static Options</option>
            <option value="api">API Endpoint</option>
          </select>

          {options.source === "static" ? (
            <div>
              <Label htmlFor="options" className="text-xs">
                Options (comma-separated)
              </Label>
              <Input
                id="options"
                value={options.values?.join(", ") || ""}
                onChange={(e) =>
                  handleOptionsChange({
                    ...options,
                    values: e.target.value
                      .split(",")
                      .map((v) => v.trim())
                      .filter(Boolean),
                  })
                }
                placeholder="Option 1, Option 2, Option 3"
                className="mt-1 h-8"
              />
            </div>
          ) : (
            <div>
              <Label htmlFor="endpoint" className="text-xs">
                API Endpoint
              </Label>
              <Input
                id="endpoint"
                value={options.endpoint || ""}
                onChange={(e) => handleOptionsChange({ ...options, endpoint: e.target.value })}
                placeholder="/api/options"
                className="mt-1 h-8"
              />
            </div>
          )}
        </div>
      )}

      <Button onClick={onDelete} variant="destructive" size="sm" className="w-full gap-2 h-8">
        <Trash2 className="w-4 h-4" />
        Delete Field
      </Button>
    </div>
  )
}
