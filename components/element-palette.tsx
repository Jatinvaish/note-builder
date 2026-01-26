"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { GripHorizontal, Plus } from "lucide-react"
import {
  Type,
  Square,
  CheckSquare2,
  List,
  Calendar,
  PenTool,
  Mic,
  AlignLeft,
  Hash,
} from "lucide-react"

interface ElementPaletteProps {
  onElementDrag: (elementType: string) => void
  onQuickAdd?: (elementType: string) => void
}

const ELEMENT_TYPES = [
  {
    id: "input",
    label: "Text Input",
    icon: Type,
    description: "Single line text field",
  },
  {
    id: "numeric",
    label: "Numeric",
    icon: Hash,
    description: "Number input field",
  },
  {
    id: "textarea",
    label: "Text Area",
    icon: AlignLeft,
    description: "Multi-line text field",
  },
  {
    id: "checkbox",
    label: "Checkbox",
    icon: CheckSquare2,
    description: "Yes/No option",
  },
  {
    id: "select",
    label: "Dropdown",
    icon: List,
    description: "Multiple choice selector",
  },
  {
    id: "datetime",
    label: "Date & Time",
    icon: Calendar,
    description: "Date/time picker",
  },
  {
    id: "signature",
    label: "Signature",
    icon: PenTool,
    description: "Signature field",
  },
  {
    id: "voice_to_text",
    label: "Voice to Text",
    icon: Mic,
    description: "Voice-to-text field",
  },
]

export function ElementPalette({ onElementDrag, onQuickAdd }: ElementPaletteProps) {
  return (
    <div className="flex flex-col gap-3 h-full overflow-y-auto p-4 bg-muted/30">
      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-foreground">Element Palette</h3>
        <p className="text-xs text-muted-foreground">Drag elements to editor or click to add</p>
      </div>

      <div className="space-y-2">
        {ELEMENT_TYPES.map((element) => {
          const Icon = element.icon
          return (
            <Card
              key={element.id}
              draggable
              onDragStart={() => onElementDrag(element.id)}
              className="p-3 cursor-move hover:bg-primary/5 transition-colors group"
            >
              <div className="flex items-start gap-2">
                <GripHorizontal className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                <Icon className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground leading-tight">{element.label}</p>
                  <p className="text-xs text-muted-foreground truncate">{element.description}</p>
                </div>
                {onQuickAdd && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onQuickAdd(element.id)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 p-0"
                  >
                    <Plus className="w-3 h-3" />
                  </Button>
                )}
              </div>
            </Card>
          )
        })}
      </div>

      <div className="text-xs text-muted-foreground pt-4 border-t border-border">
        <p className="font-semibold mb-2">Tips:</p>
        <ul className="space-y-1 list-disc list-inside">
          <li>Drag elements into the editor</li>
          <li>Elements flow inline by default</li>
          <li>Edit properties in the right panel</li>
        </ul>
      </div>
    </div>
  )
}
