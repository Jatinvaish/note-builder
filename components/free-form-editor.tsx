"use client"

import { useRef, useState, useEffect } from "react"
import { useEditor, EditorContent } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import Underline from "@tiptap/extension-underline"
import Link from "@tiptap/extension-link"
import Image from "@tiptap/extension-image"
import TextAlign from "@tiptap/extension-text-align"
import { FormElementExtension } from "@/lib/tiptap-extensions"
import { setAvailableGroups } from "@/lib/editor-context"
import type { Template, Group } from "@/lib/types"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import {
  Plus,
  Type,
  CheckSquare,
  ChevronDown,
  Calendar,
  FileText,
  PenTool,
} from "lucide-react"

interface FreeFormEditorProps {
  template?: Template
  onSave: (template: Template) => Promise<void>
  onCancel: () => void
  selectedElementId?: string | null
  groups?: Group[]
  onElementSelected?: (elementId: string | null) => void
  onTemplateContentChange?: (content: any) => void
}

const ELEMENT_TYPES = [
  { id: "input", label: "Text Input", icon: Type },
  { id: "checkbox", label: "Checkbox", icon: CheckSquare },
  { id: "select", label: "Dropdown", icon: ChevronDown },
  { id: "textarea", label: "Text Area", icon: FileText },
  { id: "datetime", label: "Date/Time", icon: Calendar },
  { id: "signature", label: "Signature", icon: PenTool },
]

export function FreeFormEditor({
  template,
  onSave,
  onCancel,
  selectedElementId,
  groups = [],
  onElementSelected,
  onTemplateContentChange,
}: FreeFormEditorProps) {
  const [isGroupDialogOpen, setIsGroupDialogOpen] = useState(false)
  const [selectedGroupForNewElement, setSelectedGroupForNewElement] = useState<string | null>(null)
  const [pendingElementType, setPendingElementType] = useState<string | null>(null)
  const editorRef = useRef<HTMLDivElement>(null)

  // Set available groups for form element nodes
  useEffect(() => {
    setAvailableGroups(groups)
  }, [groups])

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
      Underline,
      Link.configure({
        openOnClick: false,
        autolink: true,
      }),
      Image.configure({
        HTMLAttributes: {
          class: "rounded-lg max-w-full",
        },
      }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      FormElementExtension,
    ],
    content: template?.templateContent || "<p>Start writing your template...</p>",
    editorProps: {
      attributes: {
        class: "prose prose-sm max-w-none focus:outline-none min-h-96 text-sm leading-relaxed p-6",
      },
    },
    onUpdate: ({ editor: e }) => {
      onTemplateContentChange?.(e.getJSON())
    },
  })

  useEffect(() => {
    return () => {
      editor?.destroy()
    }
  }, [editor])

  const insertElement = (elementType: string) => {
    setPendingElementType(elementType)
    if (groups.length > 0) {
      setIsGroupDialogOpen(true)
    } else {
      insertElementWithGroup(elementType, null)
    }
  }

  const insertElementWithGroup = (elementType: string, groupId: string | null) => {
    if (!editor) return

    const elementKey = `${elementType}_${Date.now()}`
    editor
      .chain()
      .focus()
      .insertContent({
        type: "formElement",
        attrs: {
          elementType,
          label: `${elementType.charAt(0).toUpperCase() + elementType.slice(1)}`,
          elementKey,
          defaultValue: "",
          required: false,
          group_id: groupId,
          options: elementType === "select" ? { values: [] } : null,
        },
      })
      .insertContent(" ")
      .run()

    setIsGroupDialogOpen(false)
    setPendingElementType(null)
    setSelectedGroupForNewElement(null)
  }

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Toolbar */}
      <div className="border-b bg-card p-3 space-y-2">
        <div className="flex gap-2 flex-wrap items-center">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                size="sm"
                variant="outline"
                className="gap-2 h-7 text-xs bg-transparent"
              >
                <Plus className="w-4 h-4" />
                Add Element
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-40">
              {ELEMENT_TYPES.map(({ id, label, icon: Icon }) => (
                <DropdownMenuItem
                  key={id}
                  onClick={() => insertElement(id)}
                  className="gap-2 text-xs cursor-pointer"
                >
                  <Icon className="w-4 h-4" />
                  <span>{label}</span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Text Formatting */}
          <div className="border-l pl-2 ml-2 flex gap-1">
            <Button
              onClick={() => editor?.chain().focus().toggleBold().run()}
              variant={editor?.isActive("bold") ? "default" : "outline"}
              size="sm"
              className="h-7 px-2 text-xs font-bold"
              title="Bold (Ctrl+B)"
            >
              B
            </Button>
            <Button
              onClick={() => editor?.chain().focus().toggleItalic().run()}
              variant={editor?.isActive("italic") ? "default" : "outline"}
              size="sm"
              className="h-7 px-2 text-xs italic"
              title="Italic (Ctrl+I)"
            >
              I
            </Button>
            <Button
              onClick={() => editor?.chain().focus().toggleUnderline().run()}
              variant={editor?.isActive("underline") ? "default" : "outline"}
              size="sm"
              className="h-7 px-2 text-xs underline"
              title="Underline (Ctrl+U)"
            >
              U
            </Button>
          </div>

          {/* Heading */}
          <div className="border-l pl-2 ml-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-7 text-xs gap-1 bg-transparent">
                  <Type className="w-4 h-4" />
                  Heading
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem
                  onClick={() => editor?.chain().focus().toggleHeading({ level: 1 }).run()}
                  className="text-xs"
                >
                  Heading 1
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
                  className="text-xs"
                >
                  Heading 2
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => editor?.chain().focus().toggleHeading({ level: 3 }).run()}
                  className="text-xs"
                >
                  Heading 3
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>


        </div>
      </div>

      {/* Editor */}
      <div className="flex-1 overflow-y-auto border-b">
        <div ref={editorRef} className="h-full">
          <EditorContent editor={editor} />
        </div>
      </div>

      {/* Group Selection Dialog */}
      <Dialog open={isGroupDialogOpen} onOpenChange={setIsGroupDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Select Group for Element</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label htmlFor="group-select" className="text-sm font-medium mb-2 block">
                Assign to Group
              </Label>
              <Select value={selectedGroupForNewElement || "noGroup"} onValueChange={setSelectedGroupForNewElement}>
                <SelectTrigger id="group-select">
                  <SelectValue placeholder="Select a group (optional)" />
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
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsGroupDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (pendingElementType) {
                  insertElementWithGroup(pendingElementType, selectedGroupForNewElement || null)
                }
              }}
            >
              Add Element
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
