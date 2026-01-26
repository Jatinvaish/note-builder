"use client"

import { useRef, useState, useEffect } from "react"
import { useEditor, EditorContent } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import Underline from "@tiptap/extension-underline"
import Link from "@tiptap/extension-link"
import Image from "@tiptap/extension-image"
import TextAlign from "@tiptap/extension-text-align"
import {Table} from "@tiptap/extension-table"
import TableRow from "@tiptap/extension-table-row"
import TableCell from "@tiptap/extension-table-cell"
import TableHeader from "@tiptap/extension-table-header"
import { FormElementExtension } from "@/lib/tiptap-extensions"
import { setAvailableGroups } from "@/lib/editor-context"
import type { Template, Group } from "@/lib/types"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
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
import { Input } from "@/components/ui/input"
import {
  Plus,
  Type,
  CheckSquare,
  ChevronDown,
  Calendar,
  FileText,
  PenTool,
  AlignLeft,
  AlignCenter,
  AlignRight,
  List,
  ListOrdered,
  Table as TableIcon,
  Link as LinkIcon,
  Image as ImageIcon,
  Undo,
  Redo,
  Columns,
  Rows,
  Trash2,
} from "lucide-react"

interface FreeFormEditorProps {
  template?: Template
  onSave: (template: Template) => Promise<void>
  onCancel: () => void
  selectedElementId?: string | null
  groups?: Group[]
  onElementSelected?: (elementId: string | null) => void
  onTemplateContentChange?: (content: any) => void
  onEditorReady?: (editor: any) => void
}

const ELEMENT_TYPES = [
  { id: "input", label: "Text Input", icon: Type },
  { id: "checkbox", label: "Checkbox", icon: CheckSquare },
  { id: "select", label: "Dropdown", icon: ChevronDown },
  { id: "textarea", label: "Text Area", icon: FileText },
  { id: "datetime", label: "Date/Time", icon: Calendar },
  { id: "signature", label: "Signature", icon: PenTool },
  { id: "voice_to_text", label: "Voice to Text", icon: FileText },
]

export function FreeFormEditor({
  template,
  onSave,
  onCancel,
  selectedElementId,
  groups = [],
  onElementSelected,
  onTemplateContentChange,
  onEditorReady,
}: FreeFormEditorProps) {
  const [isGroupDialogOpen, setIsGroupDialogOpen] = useState(false)
  const [selectedGroupForNewElement, setSelectedGroupForNewElement] = useState<string | null>(null)
  const [pendingElementType, setPendingElementType] = useState<string | null>(null)
  const [isLinkDialogOpen, setIsLinkDialogOpen] = useState(false)
  const [linkUrl, setLinkUrl] = useState("")
  const [isImageDialogOpen, setIsImageDialogOpen] = useState(false)
  const [imageUrl, setImageUrl] = useState("")
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
      Table.configure({
        resizable: true,
      }),
      TableRow,
      TableHeader,
      TableCell,
      FormElementExtension,
    ],
    content: template?.templateContent || "<p>Start writing your template...</p>",
    editorProps: {
      attributes: {
        class: "prose prose-sm max-w-none focus:outline-none min-h-96 text-sm leading-relaxed p-6",
      },
      handleDOMEvents: {
        dblclick: (view, event) => {
          const target = event.target as HTMLElement
          const formElement = target.closest('[data-form-element]')
          if (formElement) {
            const elementKey = formElement.getAttribute('data-element-key')
            if (elementKey && onElementSelected) {
              onElementSelected(elementKey)
            }
            return true
          }
          return false
        },
      },
    },
    onUpdate: ({ editor: e }) => {
      if (onTemplateContentChange) {
        requestAnimationFrame(() => {
          onTemplateContentChange(e.getJSON())
        })
      }
    },
  })

  useEffect(() => {
    return () => {
      editor?.destroy()
    }
  }, [editor])

  useEffect(() => {
    if (editor && onEditorReady) {
      onEditorReady(editor)
    }
  }, [editor, onEditorReady])

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

  const insertLink = () => {
    if (!linkUrl) return
    editor?.chain().focus().setLink({ href: linkUrl }).run()
    setIsLinkDialogOpen(false)
    setLinkUrl("")
  }

  const insertImage = () => {
    if (!imageUrl) return
    editor?.chain().focus().setImage({ src: imageUrl }).run()
    setIsImageDialogOpen(false)
    setImageUrl("")
  }

  const insertTable = () => {
    editor?.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()
  }

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Toolbar */}
      <div className="border-b bg-card p-2 space-y-2">
        <div className="flex gap-1 flex-wrap items-center">
          {/* Undo/Redo */}
          <div className="flex gap-1 border-r pr-2">
            <Button
              onClick={() => editor?.chain().focus().undo().run()}
              disabled={!editor?.can().undo()}
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              title="Undo (Ctrl+Z)"
            >
              <Undo className="w-4 h-4" />
            </Button>
            <Button
              onClick={() => editor?.chain().focus().redo().run()}
              disabled={!editor?.can().redo()}
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              title="Redo (Ctrl+Y)"
            >
              <Redo className="w-4 h-4" />
            </Button>
          </div>

          {/* Add Element */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                size="sm"
                variant="outline"
                className="gap-1 h-8 text-xs"
              >
                <Plus className="w-4 h-4" />
                Element
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
          <div className="flex gap-1 border-l pl-2">
            <Button
              onClick={() => editor?.chain().focus().toggleBold().run()}
              variant={editor?.isActive("bold") ? "default" : "ghost"}
              size="sm"
              className="h-8 w-8 p-0 font-bold"
              title="Bold (Ctrl+B)"
            >
              B
            </Button>
            <Button
              onClick={() => editor?.chain().focus().toggleItalic().run()}
              variant={editor?.isActive("italic") ? "default" : "ghost"}
              size="sm"
              className="h-8 w-8 p-0 italic"
              title="Italic (Ctrl+I)"
            >
              I
            </Button>
            <Button
              onClick={() => editor?.chain().focus().toggleUnderline().run()}
              variant={editor?.isActive("underline") ? "default" : "ghost"}
              size="sm"
              className="h-8 w-8 p-0 underline"
              title="Underline (Ctrl+U)"
            >
              U
            </Button>
          </div>

          {/* Heading */}
          <div className="border-l pl-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 text-xs gap-1">
                  <Type className="w-4 h-4" />
                  Style
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem
                  onClick={() => editor?.chain().focus().setParagraph().run()}
                  className="text-xs"
                >
                  Normal
                </DropdownMenuItem>
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

          {/* Alignment */}
          <div className="flex gap-1 border-l pl-2">
            <Button
              onClick={() => editor?.chain().focus().setTextAlign("left").run()}
              variant={editor?.isActive({ textAlign: "left" }) ? "default" : "ghost"}
              size="sm"
              className="h-8 w-8 p-0"
              title="Align Left"
            >
              <AlignLeft className="w-4 h-4" />
            </Button>
            <Button
              onClick={() => editor?.chain().focus().setTextAlign("center").run()}
              variant={editor?.isActive({ textAlign: "center" }) ? "default" : "ghost"}
              size="sm"
              className="h-8 w-8 p-0"
              title="Align Center"
            >
              <AlignCenter className="w-4 h-4" />
            </Button>
            <Button
              onClick={() => editor?.chain().focus().setTextAlign("right").run()}
              variant={editor?.isActive({ textAlign: "right" }) ? "default" : "ghost"}
              size="sm"
              className="h-8 w-8 p-0"
              title="Align Right"
            >
              <AlignRight className="w-4 h-4" />
            </Button>
          </div>

          {/* Lists */}
          <div className="flex gap-1 border-l pl-2">
            <Button
              onClick={() => editor?.chain().focus().toggleBulletList().run()}
              variant={editor?.isActive("bulletList") ? "default" : "ghost"}
              size="sm"
              className="h-8 w-8 p-0"
              title="Bullet List"
            >
              <List className="w-4 h-4" />
            </Button>
            <Button
              onClick={() => editor?.chain().focus().toggleOrderedList().run()}
              variant={editor?.isActive("orderedList") ? "default" : "ghost"}
              size="sm"
              className="h-8 w-8 p-0"
              title="Numbered List"
            >
              <ListOrdered className="w-4 h-4" />
            </Button>
          </div>

          {/* Insert */}
          <div className="flex gap-1 border-l pl-2">
            <Button
              onClick={insertTable}
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              title="Insert Table"
            >
              <TableIcon className="w-4 h-4" />
            </Button>
            <Button
              onClick={() => setIsLinkDialogOpen(true)}
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              title="Insert Link"
            >
              <LinkIcon className="w-4 h-4" />
            </Button>
            <Button
              onClick={() => setIsImageDialogOpen(true)}
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              title="Insert Image"
            >
              <ImageIcon className="w-4 h-4" />
            </Button>
          </div>

          {/* Table Operations */}
          {editor?.isActive("table") && (
            <div className="flex gap-1 border-l pl-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 text-xs gap-1">
                    <Columns className="w-4 h-4" />
                    Column
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem
                    onClick={() => editor?.chain().focus().addColumnBefore().run()}
                    className="text-xs"
                  >
                    Add Column Before
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => editor?.chain().focus().addColumnAfter().run()}
                    className="text-xs"
                  >
                    Add Column After
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => editor?.chain().focus().deleteColumn().run()}
                    className="text-xs text-red-600"
                  >
                    Delete Column
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 text-xs gap-1">
                    <Rows className="w-4 h-4" />
                    Row
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem
                    onClick={() => editor?.chain().focus().addRowBefore().run()}
                    className="text-xs"
                  >
                    Add Row Before
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => editor?.chain().focus().addRowAfter().run()}
                    className="text-xs"
                  >
                    Add Row After
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => editor?.chain().focus().deleteRow().run()}
                    className="text-xs text-red-600"
                  >
                    Delete Row
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Button
                onClick={() => editor?.chain().focus().deleteTable().run()}
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                title="Delete Table"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          )}
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

      {/* Link Dialog */}
      <Dialog open={isLinkDialogOpen} onOpenChange={setIsLinkDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Insert Link</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label htmlFor="link-url" className="text-sm font-medium mb-2 block">
                URL
              </Label>
              <Input
                id="link-url"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                placeholder="https://example.com"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsLinkDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={insertLink}>
              Insert Link
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Image Dialog */}
      <Dialog open={isImageDialogOpen} onOpenChange={setIsImageDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Insert Image</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label htmlFor="image-url" className="text-sm font-medium mb-2 block">
                Image URL
              </Label>
              <Input
                id="image-url"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://example.com/image.jpg"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsImageDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={insertImage}>
              Insert Image
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
