"use client"

import { useRef, useState, useEffect } from "react"
import { useEditor, EditorContent } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import Underline from "@tiptap/extension-underline"
import Link from "@tiptap/extension-link"
import Image from "@tiptap/extension-image"
import TextAlign from "@tiptap/extension-text-align"
import { TextStyle } from "@tiptap/extension-text-style"
import { Color } from "@tiptap/extension-color"
import { Highlight } from "@tiptap/extension-highlight"
import { FontFamily } from "@tiptap/extension-font-family"
import { Table } from "@tiptap/extension-table"
import TableRow from "@tiptap/extension-table-row"
import TableCell from "@tiptap/extension-table-cell"
import TableHeader from "@tiptap/extension-table-header"
import { FormElementExtension } from "@/lib/tiptap-extensions"
import { Extension } from "@tiptap/core"
import { Suggestion } from "@tiptap/suggestion"
import { ReactRenderer } from "@tiptap/react"
import tippy from "tippy.js"
import { SuggestionList } from "./suggestion-list"

const FontSize = Extension.create({
  name: 'fontSize',
  addOptions() {
    return {
      types: ['textStyle'],
    }
  },
  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          fontSize: {
            default: null,
            parseHTML: element => element.style.fontSize.replace(/['"]+/g, ''),
            renderHTML: attributes => {
              if (!attributes.fontSize) return {}
              return { style: `font-size: ${attributes.fontSize}` }
            },
          },
        },
      },
    ]
  },
  addCommands() {
    return {
      setFontSize: (fontSize: string) => ({ chain }) => {
        return chain().setMark('textStyle', { fontSize }).run()
      },
      unsetFontSize: () => ({ chain }) => {
        return chain().setMark('textStyle', { fontSize: null }).removeEmptyTextStyle().run()
      },
    }
  },
})
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
  Palette,
  Highlighter,
  ALargeSmall,
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
  { id: "multiselect", label: "Multi-Select", icon: ChevronDown },
  { id: "textarea", label: "Text Area", icon: FileText },
  { id: "datetime", label: "Date/Time", icon: Calendar },
  { id: "signature", label: "Signature", icon: PenTool },
  { id: "voice_to_text", label: "Voice to Text", icon: FileText },
]

const SHORTCUT_MAP: Record<string, string> = {
  "dat": "datetime",
  "data": "datetime",
  "da": "datetime",
  "inp": "input",
  "input": "input",
  "chk": "checkbox",
  "check": "checkbox",
  "sel": "select",
  "drop": "select",
  "txt": "textarea",
  "area": "textarea",
  "sig": "signature",
  "voice": "voice_to_text",
  "num": "numeric",
  "number": "numeric",
}

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
  const [isLinkDialogOpen, setIsLinkDialogOpen] = useState(false)
  const [linkUrl, setLinkUrl] = useState("")
  const [isImageDialogOpen, setIsImageDialogOpen] = useState(false)
  const [imageUrl, setImageUrl] = useState("")
  const [textColor, setTextColor] = useState("#000000")
  const [bgColor, setBgColor] = useState("#ffff00")
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
      TextStyle,
      Color,
      Highlight.configure({ multicolor: true }),
      FontFamily,
      FontSize,
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
        allowTableNodeSelection: true,
        cellMinWidth: 50,
      }),
      TableRow.extend({
        addAttributes() {
          return {
            ...this.parent?.(),
            style: {
              default: null,
              parseHTML: element => element.getAttribute('style'),
              renderHTML: attributes => {
                if (!attributes.style) return {}
                return { style: attributes.style }
              },
            },
          }
        },
      }),
      TableHeader.extend({
        addAttributes() {
          return {
            ...this.parent?.(),
            style: {
              default: null,
              parseHTML: element => element.getAttribute('style'),
              renderHTML: attributes => {
                if (!attributes.style) return {}
                return { style: attributes.style }
              },
            },
            colspan: {
              default: 1,
            },
            rowspan: {
              default: 1,
            },
          }
        },
      }),
      TableCell.extend({
        addAttributes() {
          return {
            ...this.parent?.(),
            style: {
              default: null,
              parseHTML: element => element.getAttribute('style'),
              renderHTML: attributes => {
                if (!attributes.style) return {}
                return { style: attributes.style }
              },
            },
            colspan: {
              default: 1,
            },
            rowspan: {
              default: 1,
            },
          }
        },
      }),
      FormElementExtension,
      Extension.create({
        name: 'suggestionEx',
        addProseMirrorPlugins() {
          return [
            Suggestion({
              editor: this.editor,
              char: '/',
              allowSpaces: false,
              items: ({ query }: { query: string }) => {
                // Return all items if query is empty (triggered by Ctrl+Space)
                const items = Object.entries(SHORTCUT_MAP)
                  .filter(([key]) => query.length === 0 || key.startsWith(query.toLowerCase()))
                  .map(([key, typeId]) => typeId)

                return Array.from(new Set(items)).slice(0, 8)
              },
              render: () => {
                let component: ReactRenderer<any>
                let popup: any

                return {
                  onStart: (props: any) => {
                    component = new ReactRenderer(SuggestionList, {
                      props,
                      editor: props.editor,
                    })

                    popup = tippy('body', {
                      getReferenceClientRect: props.clientRect,
                      appendTo: () => document.body,
                      content: component.element,
                      showOnCreate: true,
                      interactive: true,
                      trigger: 'manual',
                      placement: 'bottom-start',
                    })
                  },
                  onUpdate(props: any) {
                    component.updateProps(props)

                    if (!props.clientRect) {
                      return
                    }

                    popup[0].setProps({
                      getReferenceClientRect: props.clientRect,
                    })
                  },
                  onKeyDown(props: any) {
                    if (props.event.key === 'Escape') {
                      popup[0].hide()
                      return true
                    }
                    return component.ref?.onKeyDown(props)
                  },
                  onExit() {
                    popup[0].destroy()
                    component.destroy()
                  },
                }
              },
              command: ({ editor, range, props }: any) => {
                const typeId = props.id
                const elementType = ELEMENT_TYPES.find(e => e.id === typeId) || { label: "Element" }
                const elementKey = `${typeId}_${Date.now()}`

                editor
                  .chain()
                  .focus()
                  .deleteRange(range)
                  .insertContent({
                    type: "formElement",
                    attrs: {
                      elementType: typeId,
                      label: elementType.label,
                      elementKey: elementKey,
                      defaultValue: "",
                      required: false,
                      options: typeId === 'select' || typeId === 'multiselect' ? { values: [] } : null,
                    },
                  })
                  // Select inserted node
                  .command(({ dispatch }: any) => {
                    if (dispatch) {
                      const pos = range.from
                      try {
                        (editor as any).commands.setNodeSelection(pos);
                        return true;
                      } catch (e) {
                        console.error("Failed to set node selection", e);
                        return false;
                      }
                    }
                    return false
                  })
                  .run()
              },
            }),
          ]
        },
      }),
      Extension.create({
        name: 'keyboardShortcuts',
        addKeyboardShortcuts() {
          return {
            Tab: () => {
              const { state, dispatch } = this.editor.view
              const { selection } = state
              const { from } = selection

              // Check for smart shortcuts
              // Look back up to 10 chars to cover longest keys
              const textBefore = state.doc.textBetween(Math.max(0, from - 10), from).toLowerCase()

              // Find matching suffix
              const match = Object.entries(SHORTCUT_MAP).find(([key]) => {
                if (!textBefore.endsWith(key)) return false;
                // Check boundary: previous char must be space, newline, or start of doc
                const charBeforeKey = state.doc.textBetween(Math.max(0, from - key.length - 1), from - key.length)
                return !charBeforeKey || charBeforeKey === ' ' || charBeforeKey === '\n' || charBeforeKey === '\u00A0';
              });

              if (match) {
                const [key, typeId] = match
                const elementType = ELEMENT_TYPES.find(e => e.id === typeId) || { label: "Element" }

                const elementKey = `${typeId}_${Date.now()}`

                // We need to execute the chain
                this.editor.chain()
                  .deleteRange({ from: from - key.length, to: from })
                  .insertContent({
                    type: "formElement",
                    attrs: {
                      elementType: typeId,
                      label: elementType.label,
                      elementKey: elementKey,
                      defaultValue: "",
                      required: false,
                      // specific defaults
                      options: typeId === 'select' || typeId === 'multiselect' ? { values: [] } : null,
                    },
                  })
                  // Select the inserted node
                  // The inserted node starts at (from - key.length)
                  .command(({ dispatch }) => {
                    if (dispatch) {
                      const pos = from - key.length;
                      try {
                        (this.editor as any).commands.setNodeSelection(pos);
                        return true;
                      } catch (e) {
                        console.error("Failed to set node selection", e);
                        return false;
                      }
                    }
                    return false
                  })
                  .run()
                return true
              }

              // Default Tab behavior (Indentation)
              if (this.editor.isActive('listItem')) {
                return false // Let list sink
              }
              if (this.editor.isActive('table')) {
                return false // Let table cell navigation work
              }

              this.editor.commands.insertContent('\u00A0\u00A0\u00A0\u00A0') // 4 non-breaking spaces
              return true
            },
            'Mod-Space': () => {
              // Triggering suggestion list manually
              this.editor.commands.insertContent('/')
              return true
            },
          }
        },
      }),
    ] as any[],
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
  } as any)

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

  useEffect(() => {
    if (!editor) return

    const handleSelectionUpdate = () => {
      const { selection } = editor.state
      const node = (selection as any).node
      if (node && node.type.name === 'formElement') {
        const elementKey = node.attrs.elementKey
        if (elementKey && onElementSelected) {
          onElementSelected(elementKey)
        }
      } else {
        if (onElementSelected) {
          onElementSelected(null)
        }
      }
    }

    editor.on('selectionUpdate', handleSelectionUpdate)
    return () => {
      editor.off('selectionUpdate', handleSelectionUpdate)
    }
  }, [editor, onElementSelected])

  const insertElement = (elementType: string) => {
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
          group_id: null,
          options: elementType === "select" ? { values: [] } : null,
        },
      })
      .insertContent(" ")
      .run()
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
              onClick={() => (editor as any)?.chain().focus().undo().run()}
              disabled={!(editor as any)?.can().undo()}
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              title="Undo (Ctrl+Z)"
            >
              <Undo className="w-4 h-4" />
            </Button>
            <Button
              onClick={() => (editor as any)?.chain().focus().redo().run()}
              disabled={!(editor as any)?.can().redo()}
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
              onClick={() => (editor as any)?.chain().focus().toggleBold().run()}
              variant={(editor as any)?.isActive("bold") ? "default" : "ghost"}
              size="sm"
              className="h-8 w-8 p-0 font-bold"
              title="Bold (Ctrl+B)"
            >
              B
            </Button>
            <Button
              onClick={() => (editor as any)?.chain().focus().toggleItalic().run()}
              variant={(editor as any)?.isActive("italic") ? "default" : "ghost"}
              size="sm"
              className="h-8 w-8 p-0 italic"
              title="Italic (Ctrl+I)"
            >
              I
            </Button>
            <Button
              onClick={() => (editor as any)?.chain().focus().toggleUnderline().run()}
              variant={(editor as any)?.isActive("underline") ? "default" : "ghost"}
              size="sm"
              className="h-8 w-8 p-0 underline"
              title="Underline (Ctrl+U)"
            >
              U
            </Button>
          </div>

          {/* Font Size */}
          <div className="border-l pl-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 text-xs gap-1">
                  <ALargeSmall className="w-4 h-4" />
                  Size
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                {['12px', '14px', '16px', '18px', '20px', '24px', '28px', '32px', '36px'].map(size => (
                  <DropdownMenuItem
                    key={size}
                    onClick={() => editor?.chain().focus().setFontSize(size).run()}
                    className="text-xs"
                  >
                    {size}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Colors */}
          <div className="flex gap-1 border-l pl-2">
            <div className="flex items-center gap-1">
              <input
                type="color"
                value={textColor}
                onChange={(e) => {
                  setTextColor(e.target.value)
                  editor?.chain().focus().setColor(e.target.value).run()
                }}
                className="w-8 h-8 rounded cursor-pointer border"
                title="Text Color"
              />
              <Palette className="w-3 h-3 text-muted-foreground absolute pointer-events-none" style={{ marginLeft: '-20px' }} />
            </div>
            <div className="flex items-center gap-1">
              <input
                type="color"
                value={bgColor}
                onChange={(e) => {
                  setBgColor(e.target.value)
                  editor?.chain().focus().toggleHighlight({ color: e.target.value }).run()
                }}
                className="w-8 h-8 rounded cursor-pointer border"
                title="Background Color"
              />
              <Highlighter className="w-3 h-3 text-muted-foreground absolute pointer-events-none" style={{ marginLeft: '-20px' }} />
            </div>
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
                  onClick={() => (editor as any)?.chain().focus().toggleHeading({ level: 1 }).run()}
                  className="text-xs"
                >
                  Heading 1
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => (editor as any)?.chain().focus().toggleHeading({ level: 2 }).run()}
                  className="text-xs"
                >
                  Heading 2
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => (editor as any)?.chain().focus().toggleHeading({ level: 3 }).run()}
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
              onClick={() => (editor as any)?.chain().focus().toggleBulletList().run()}
              variant={(editor as any)?.isActive("bulletList") ? "default" : "ghost"}
              size="sm"
              className="h-8 w-8 p-0"
              title="Bullet List"
            >
              <List className="w-4 h-4" />
            </Button>
            <Button
              onClick={() => (editor as any)?.chain().focus().toggleOrderedList().run()}
              variant={(editor as any)?.isActive("orderedList") ? "default" : "ghost"}
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
