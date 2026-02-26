"use client"

import { useRef, useState, useEffect, useCallback } from "react"
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
import TableRow from "@tiptap/extension-table-row"
import { DataBoundTable, DataBoundTableCell, DataBoundTableHeader } from "@/lib/tiptap-extensions"
import Subscript from "@tiptap/extension-subscript"
import Superscript from "@tiptap/extension-superscript"
import Typography from "@tiptap/extension-typography"
import TaskList from "@tiptap/extension-task-list"
import TaskItem from "@tiptap/extension-task-item"
import Placeholder from "@tiptap/extension-placeholder"
import CharacterCount from "@tiptap/extension-character-count"
import { FormElementExtension } from "@/lib/tiptap-extensions"
import { Extension, Editor as TiptapEditor, type CommandProps, type RawCommands } from "@tiptap/core"
import type { Node as ProseMirrorNode } from "@tiptap/pm/model"
import type { EditorView } from "@tiptap/pm/view"
import { Suggestion } from "@tiptap/suggestion"
import { ReactRenderer } from "@tiptap/react"
import tippy from "tippy.js"
import { SuggestionList } from "./suggestion-list"
import { PREDEFINED_DATA_FIELDS } from "@/lib/predefined-data-fields"
import { isEnhancedDataField } from "@/lib/data-field-types"

// Custom Extensions
const FontSize = Extension.create({
  name: 'fontSize',
  addOptions() {
    return { types: ['textStyle'] }
  },
  addGlobalAttributes() {
    return [{
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
    }]
  },
  addCommands() {
    return {
      setFontSize: (fontSize: string) => ({ chain }: CommandProps) => {
        return chain().setMark('textStyle', { fontSize }).run()
      },
      unsetFontSize: () => ({ chain }: CommandProps) => {
        return chain().setMark('textStyle', { fontSize: null }).removeEmptyTextStyle().run()
      },
    }
  },
})

const Indent = Extension.create({
  name: 'indent',
  addGlobalAttributes() {
    return [{
      types: ['paragraph', 'heading'],
      attributes: {
        indent: {
          default: 0,
          parseHTML: element => {
            const ml = element.style.marginLeft
            return ml ? parseInt(ml) / 40 : 0
          },
          renderHTML: attributes => {
            if (!attributes.indent || attributes.indent === 0) return {}
            return { style: `margin-left: ${attributes.indent * 40}px` }
          },
        },
      },
    }]
  },
  addCommands() {
    return {
      indent: () => ({ tr, state, dispatch }: CommandProps) => {
        const { selection } = state
        const { from, to } = selection
        state.doc.nodesBetween(from, to, (node: ProseMirrorNode, pos: number) => {
          if (node.type.name === 'paragraph' || node.type.name === 'heading') {
            const currentIndent = node.attrs.indent || 0
            if (currentIndent < 10) {
              tr.setNodeMarkup(pos, undefined, { ...node.attrs, indent: currentIndent + 1 })
            }
          }
        })
        if (dispatch) dispatch(tr)
        return true
      },
      outdent: () => ({ tr, state, dispatch }: CommandProps) => {
        const { selection } = state
        const { from, to } = selection
        state.doc.nodesBetween(from, to, (node: ProseMirrorNode, pos: number) => {
          if (node.type.name === 'paragraph' || node.type.name === 'heading') {
            const currentIndent = node.attrs.indent || 0
            if (currentIndent > 0) {
              tr.setNodeMarkup(pos, undefined, { ...node.attrs, indent: currentIndent - 1 })
            }
          }
        })
        if (dispatch) dispatch(tr)
        return true
      },
    } as Partial<RawCommands>
  },
})

const LineHeight = Extension.create({
  name: 'lineHeight',
  addGlobalAttributes() {
    return [{
      types: ['paragraph', 'heading'],
      attributes: {
        lineHeight: {
          default: null,
          parseHTML: element => element.style.lineHeight || null,
          renderHTML: attributes => {
            if (!attributes.lineHeight) return {}
            return { style: `line-height: ${attributes.lineHeight}` }
          },
        },
      },
    }]
  },
  addCommands() {
    return {
      setLineHeight: (lineHeight: string) => ({ tr, state, dispatch }: CommandProps) => {
        const { selection } = state
        const { from, to } = selection
        state.doc.nodesBetween(from, to, (node: ProseMirrorNode, pos: number) => {
          if (node.type.name === 'paragraph' || node.type.name === 'heading') {
            tr.setNodeMarkup(pos, undefined, { ...node.attrs, lineHeight })
          }
        })
        if (dispatch) dispatch(tr)
        return true
      },
    }
  },
})

const CharacterSpacing = Extension.create({
  name: 'characterSpacing',
  addOptions() {
    return { types: ['textStyle'] }
  },
  addGlobalAttributes() {
    return [{
      types: this.options.types,
      attributes: {
        letterSpacing: {
          default: null,
          parseHTML: element => element.style.letterSpacing || null,
          renderHTML: attributes => {
            if (!attributes.letterSpacing) return {}
            return { style: `letter-spacing: ${attributes.letterSpacing}` }
          },
        },
      },
    }]
  },
  addCommands() {
    return {
      setLetterSpacing: (letterSpacing: string) => ({ chain }: CommandProps) => {
        return chain().setMark('textStyle', { letterSpacing }).run()
      },
    } as Partial<RawCommands>
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
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
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
  AlignJustify,
  List,
  ListOrdered,
  ListTodo,
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
  Strikethrough,
  Subscript as SubIcon,
  Superscript as SupIcon,
  IndentIncrease,
  IndentDecrease,
  Merge,
  Split,
  User,
  Heart,
  Stethoscope,
  LetterText,
  Mic,
  Hash,
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
  { id: "voice_to_text", label: "Voice to Text", icon: Mic },
  { id: "numeric", label: "Numeric Input", icon: Hash },
]

const SHORTCUT_MAP: Record<string, string> = {
  "dat": "datetime",
  "data": "datetime",
  "date": "datetime",
  "da": "datetime",
  "time": "datetime",
  "inp": "input",
  "input": "input",
  "chk": "checkbox",
  "check": "checkbox",
  "sel": "select",
  "drop": "select",
  "opt": "select",
  "txt": "textarea",
  "area": "textarea",
  "sig": "signature",
  "voice": "voice_to_text",
  "num": "numeric",
  "number": "numeric",
}

const FONT_FAMILIES = [
  "Inter", "Arial", "Times New Roman", "Courier New", "Georgia",
  "Verdana", "Impact", "Noto Sans", "Noto Sans Devanagari", "Noto Sans Gujarati",
]

const FONT_SIZES = ['8px', '9px', '10px', '11px', '12px', '14px', '16px', '18px', '20px', '24px', '28px', '32px', '36px', '48px', '64px']

const LINE_HEIGHTS = [
  { label: "1.0", value: "1" },
  { label: "1.15", value: "1.15" },
  { label: "1.5", value: "1.5" },
  { label: "2.0", value: "2" },
  { label: "2.5", value: "2.5" },
  { label: "3.0", value: "3" },
]

const LETTER_SPACINGS = [
  { label: "Tight (-0.05em)", value: "-0.05em" },
  { label: "Normal (0)", value: "0" },
  { label: "Wide (0.05em)", value: "0.05em" },
  { label: "Wider (0.1em)", value: "0.1em" },
  { label: "Widest (0.2em)", value: "0.2em" },
]

const TEXT_COLORS = [
  "#000000", "#434343", "#666666", "#999999",
  "#E03131", "#E8590C", "#F08C00", "#2B8A3E",
  "#1971C2", "#6741D9", "#C2255C", "#862E9C",
  "#FFFFFF", "#1B6A52",
]

const HIGHLIGHT_COLORS = [
  "#FFF3BF", "#FFE0B2", "#FFCDD2", "#F3E5F5",
  "#E8EAF6", "#E0F2F1", "#E8F5E9", "#FFF9C4",
  "#DCEDC8", "#B3E5FC", "#F0F4C3", "#CFD8DC",
  "#FCE4EC", "transparent",
]

// Categorize predefined data fields
const PATIENT_DATA_FIELDS = PREDEFINED_DATA_FIELDS.filter(f => f.category === "Patient Info")
const VITALS_DATA_FIELDS = PREDEFINED_DATA_FIELDS.filter(f => f.category === "Vitals")
const HANDP_DATA_FIELDS = PREDEFINED_DATA_FIELDS.filter(f =>
  f.category === "H AND P" || f.category === "History" || f.category === "Diagnosis" || f.category === "Plan"
)
const CONSULTATION_DATA_FIELDS = PREDEFINED_DATA_FIELDS.filter(f => f.category === "Consultation" || f.category === "Login User Context" || f.category === "Admission")

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
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null)
  const editorRef = useRef<HTMLDivElement>(null)

  // Set available groups for form element nodes
  useEffect(() => {
    setAvailableGroups(groups)
  }, [groups])

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        strike: {},
      }),
      Underline,
      Subscript,
      Superscript,
      Typography,
      TextStyle,
      Color,
      Highlight.configure({ multicolor: true }),
      FontFamily,
      FontSize,
      Indent,
      LineHeight,
      CharacterSpacing,
      TaskList,
      TaskItem.configure({ nested: true }),
      Placeholder.configure({
        placeholder: "Type / to insert patient information or form elements...",
      }),
      CharacterCount,
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
      DataBoundTable.configure({
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
      DataBoundTableHeader.extend({
        addAttributes() {
          return {
            ...this.parent?.(),
            colspan: { default: 1 },
            rowspan: { default: 1 },
            width: {
              default: null,
              parseHTML: element => element.getAttribute('data-width') || element.style.width || null,
              renderHTML: attributes => {
                const styles: string[] = []
                if (attributes.width) styles.push(`width: ${attributes.width}`)
                if (attributes.height) styles.push(`height: ${attributes.height}`)
                if (attributes.backgroundColor) styles.push(`background-color: ${attributes.backgroundColor}`)
                if (styles.length === 0) return {}
                return { style: styles.join('; ') }
              },
            },
            height: { default: null },
            backgroundColor: {
              default: null,
              parseHTML: element => element.style.backgroundColor || null,
            },
          }
        },
      }),
      DataBoundTableCell.extend({
        addAttributes() {
          return {
            ...this.parent?.(),
            colspan: { default: 1 },
            rowspan: { default: 1 },
            width: {
              default: null,
              parseHTML: element => element.getAttribute('data-width') || element.style.width || null,
              renderHTML: attributes => {
                const styles: string[] = []
                if (attributes.width) styles.push(`width: ${attributes.width}`)
                if (attributes.height) styles.push(`height: ${attributes.height}`)
                if (attributes.backgroundColor) styles.push(`background-color: ${attributes.backgroundColor}`)
                if (styles.length === 0) return {}
                return { style: styles.join('; ') }
              },
            },
            height: { default: null },
            backgroundColor: {
              default: null,
              parseHTML: element => element.style.backgroundColor || null,
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
                const items = Object.entries(SHORTCUT_MAP)
                  .filter(([key]) => query.length === 0 || key.startsWith(query.toLowerCase()))
                  .map(([key, typeId]) => typeId)
                return Array.from(new Set(items)).slice(0, 10)
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
                    if (!props.clientRect) return
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
                  .command(({ dispatch }: any) => {
                    if (dispatch) {
                      const pos = range.from
                      try {
                        (editor as any).commands.setNodeSelection(pos)
                        return true
                      } catch (e) {
                        console.error("Failed to set node selection", e)
                        return false
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
              const { state } = this.editor.view
              const { selection } = state
              const { from } = selection

              const textBefore = state.doc.textBetween(Math.max(0, from - 10), from).toLowerCase()

              const match = Object.entries(SHORTCUT_MAP).find(([key]) => {
                if (!textBefore.endsWith(key)) return false
                const charBeforeKey = state.doc.textBetween(Math.max(0, from - key.length - 1), from - key.length)
                return !charBeforeKey || charBeforeKey === ' ' || charBeforeKey === '\n' || charBeforeKey === '\u00A0'
              })

              if (match) {
                const [key, typeId] = match
                const elementType = ELEMENT_TYPES.find(e => e.id === typeId) || { label: "Element" }
                const elementKey = `${typeId}_${Date.now()}`

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
                      options: typeId === 'select' || typeId === 'multiselect' ? { values: [] } : null,
                    },
                  })
                  .command(({ dispatch }) => {
                    if (dispatch) {
                      const pos = from - key.length
                      try {
                        (this.editor as any).commands.setNodeSelection(pos)
                        return true
                      } catch (e) {
                        return false
                      }
                    }
                    return false
                  })
                  .run()
                return true
              }

              if (this.editor.isActive('listItem') || this.editor.isActive('taskItem')) return false
              if (this.editor.isActive('table')) return false

              this.editor.commands.insertContent('\u00A0\u00A0\u00A0\u00A0')
              return true
            },
            'Mod-Space': () => {
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
        dblclick: (view: EditorView, event: MouseEvent) => {
          const target = event.target as HTMLElement
          const formElement = target.closest('[data-form-element]')
          if (formElement) {
            const elementKey = formElement.getAttribute('data-element-key')
            if (elementKey && onElementSelected) {
              onElementSelected(elementKey)
              // Scroll properties panel into view
              setTimeout(() => {
                const panel = document.querySelector('[data-properties-panel]')
                if (panel) panel.scrollIntoView({ behavior: 'smooth', block: 'start' })
              }, 100)
            }
            return true
          }
          return false
        },
        contextmenu: (view: EditorView, event: MouseEvent) => {
          if (editor?.isActive('table')) {
            event.preventDefault()
            setContextMenu({ x: event.clientX, y: event.clientY })
            return true
          }
          return false
        },
      },
    },
    onUpdate: ({ editor: e }: { editor: TiptapEditor }) => {
      if (onTemplateContentChange) {
        requestAnimationFrame(() => {
          onTemplateContentChange(e.getJSON())
        })
      }
    },
  } as any)

  useEffect(() => {
    return () => { editor?.destroy() }
  }, [editor])

  useEffect(() => {
    if (editor && onEditorReady) onEditorReady(editor)
  }, [editor, onEditorReady])

  useEffect(() => {
    if (!editor) return
    const handleSelectionUpdate = () => {
      const { selection } = editor.state
      const node = (selection as any).node
      if (node && node.type.name === 'formElement') {
        const elementKey = node.attrs.elementKey
        if (elementKey && onElementSelected) onElementSelected(elementKey)
      } else {
        if (onElementSelected) onElementSelected(null)
      }
    }
    editor.on('selectionUpdate', handleSelectionUpdate)
    return () => { editor.off('selectionUpdate', handleSelectionUpdate) }
  }, [editor, onElementSelected])

  // Close context menu on click outside
  useEffect(() => {
    if (!contextMenu) return
    const handler = () => setContextMenu(null)
    document.addEventListener('click', handler)
    return () => document.removeEventListener('click', handler)
  }, [contextMenu])

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

  const insertDataField = useCallback((field: any) => {
    if (!editor) return
    const elementKey = `${field.id}_${Date.now()}`

    // Determine element type based on field
    let elementType = "input"
    if (field.id.includes("date") || field.id.includes("time")) elementType = "datetime"
    if (field.id.includes("gender")) elementType = "select"

    // Special handling for physical exam fields (MODEL_OPEN)
    if (isEnhancedDataField(field) && field.actions?.type === 'MODEL_OPEN') {
      elementType = "input"
    }

    editor
      .chain()
      .focus()
      .insertContent({
        type: "formElement",
        attrs: {
          elementType,
          label: field.label,
          elementKey,
          defaultValue: "",
          required: false,
          dataField: field.id,
          group_id: null,
          options: elementType === "select" ? { values: [] } : null,
        },
      })
      .insertContent(" ")
      .run()
  }, [editor])

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

  // Character/word/page count
  const charCount = editor?.storage.characterCount?.characters() || 0
  const wordCount = editor?.storage.characterCount?.words() || 0
  const pageCount = Math.max(1, Math.ceil(wordCount / 250))

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Toolbar */}
      <div className="border-b bg-card p-1.5 space-y-0">
        <div className="flex gap-0.5 flex-wrap items-center">
          {/* Undo/Redo */}
          <div className="flex gap-0.5 border-r pr-1.5 mr-0.5">
            <Button
              onClick={() => (editor as any)?.chain().focus().undo().run()}
              disabled={!(editor as any)?.can().undo()}
              variant="ghost" size="sm" className="h-7 w-7 p-0" title="Undo (Ctrl+Z)"
            >
              <Undo className="w-3.5 h-3.5" />
            </Button>
            <Button
              onClick={() => (editor as any)?.chain().focus().redo().run()}
              disabled={!(editor as any)?.can().redo()}
              variant="ghost" size="sm" className="h-7 w-7 p-0" title="Redo (Ctrl+Y)"
            >
              <Redo className="w-3.5 h-3.5" />
            </Button>
          </div>

          {/* Add Element */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" variant="outline" className="gap-1 h-7 text-xs">
                <Plus className="w-3.5 h-3.5" />
                Element
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-40">
              {ELEMENT_TYPES.map(({ id, label, icon: Icon }) => (
                <DropdownMenuItem key={id} onClick={() => insertElement(id)} className="gap-2 text-xs cursor-pointer">
                  <Icon className="w-3.5 h-3.5" />
                  <span>{label}</span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Data Field Menus */}
          <div className="flex gap-0.5 border-l pl-1.5 ml-0.5">
            {/* Patient Info */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-7 text-xs gap-1" title="Patient Info Fields">
                  <User className="w-3.5 h-3.5" />
                  Patient
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="max-h-64 overflow-y-auto">
                {PATIENT_DATA_FIELDS.map(field => (
                  <DropdownMenuItem key={field.id} onClick={() => insertDataField(field)} className="text-xs cursor-pointer">
                    {field.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Vitals */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-7 text-xs gap-1" title="Vitals Fields">
                  <Heart className="w-3.5 h-3.5" />
                  Vitals
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="max-h-64 overflow-y-auto">
                {VITALS_DATA_FIELDS.map(field => (
                  <DropdownMenuItem key={field.id} onClick={() => insertDataField(field)} className="text-xs cursor-pointer">
                    {field.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* H&P */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-7 text-xs gap-1" title="History & Physical Fields">
                  <Stethoscope className="w-3.5 h-3.5" />
                  H&P
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="max-h-64 overflow-y-auto">
                {HANDP_DATA_FIELDS.length > 0 ? HANDP_DATA_FIELDS.map(field => (
                  <DropdownMenuItem key={field.id} onClick={() => insertDataField(field)} className="text-xs cursor-pointer">
                    {field.label}
                  </DropdownMenuItem>
                )) : (
                  <DropdownMenuItem disabled className="text-xs">No H&P fields defined</DropdownMenuItem>
                )}
                {CONSULTATION_DATA_FIELDS.length > 0 && (
                  <>
                    <DropdownMenuSeparator />
                    {CONSULTATION_DATA_FIELDS.map(field => (
                      <DropdownMenuItem key={field.id} onClick={() => insertDataField(field)} className="text-xs cursor-pointer">
                        {field.label}
                      </DropdownMenuItem>
                    ))}
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Text Formatting */}
          <div className="flex gap-0.5 border-l pl-1.5 ml-0.5">
            <Button
              onClick={() => (editor as any)?.chain().focus().toggleBold().run()}
              variant={(editor as any)?.isActive("bold") ? "default" : "ghost"}
              size="sm" className="h-7 w-7 p-0 font-bold" title="Bold (Ctrl+B)"
            >
              B
            </Button>
            <Button
              onClick={() => (editor as any)?.chain().focus().toggleItalic().run()}
              variant={(editor as any)?.isActive("italic") ? "default" : "ghost"}
              size="sm" className="h-7 w-7 p-0 italic" title="Italic (Ctrl+I)"
            >
              I
            </Button>
            <Button
              onClick={() => (editor as any)?.chain().focus().toggleUnderline().run()}
              variant={(editor as any)?.isActive("underline") ? "default" : "ghost"}
              size="sm" className="h-7 w-7 p-0 underline" title="Underline (Ctrl+U)"
            >
              U
            </Button>
            <Button
              onClick={() => (editor as any)?.chain().focus().toggleStrike().run()}
              variant={(editor as any)?.isActive("strike") ? "default" : "ghost"}
              size="sm" className="h-7 w-7 p-0" title="Strikethrough"
            >
              <Strikethrough className="w-3.5 h-3.5" />
            </Button>
            <Button
              onClick={() => (editor as any)?.chain().focus().toggleSubscript().run()}
              variant={(editor as any)?.isActive("subscript") ? "default" : "ghost"}
              size="sm" className="h-7 w-7 p-0" title="Subscript"
            >
              <SubIcon className="w-3.5 h-3.5" />
            </Button>
            <Button
              onClick={() => (editor as any)?.chain().focus().toggleSuperscript().run()}
              variant={(editor as any)?.isActive("superscript") ? "default" : "ghost"}
              size="sm" className="h-7 w-7 p-0" title="Superscript"
            >
              <SupIcon className="w-3.5 h-3.5" />
            </Button>
          </div>

          {/* Font Family */}
          <div className="border-l pl-1.5 ml-0.5">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-7 text-xs gap-1">
                  <LetterText className="w-3.5 h-3.5" />
                  Font
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="max-h-64 overflow-y-auto">
                {FONT_FAMILIES.map(font => (
                  <DropdownMenuItem
                    key={font}
                    onClick={() => editor?.chain().focus().setFontFamily(font).run()}
                    className="text-xs cursor-pointer"
                    style={{ fontFamily: font }}
                  >
                    {font}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Font Size */}
          <div className="border-l pl-1.5 ml-0.5">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-7 text-xs gap-1">
                  <ALargeSmall className="w-3.5 h-3.5" />
                  Size
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="max-h-64 overflow-y-auto">
                {FONT_SIZES.map(size => (
                  <DropdownMenuItem key={size} onClick={() => editor?.chain().focus().setFontSize(size).run()} className="text-xs cursor-pointer">
                    {size}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Colors */}
          <div className="flex gap-0.5 border-l pl-1.5 ml-0.5">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-7 w-7 p-0" title="Text Color">
                  <Palette className="w-3.5 h-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <div className="grid grid-cols-7 gap-1 p-2">
                  {TEXT_COLORS.map(color => (
                    <button
                      key={color}
                      onClick={() => editor?.chain().focus().setColor(color).run()}
                      className="w-6 h-6 rounded border border-gray-300 hover:scale-110 transition-transform"
                      style={{ backgroundColor: color }}
                      title={color}
                    />
                  ))}
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-7 w-7 p-0" title="Highlight Color">
                  <Highlighter className="w-3.5 h-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <div className="grid grid-cols-7 gap-1 p-2">
                  {HIGHLIGHT_COLORS.map(color => (
                    <button
                      key={color}
                      onClick={() => {
                        if (color === 'transparent') {
                          editor?.chain().focus().unsetHighlight().run()
                        } else {
                          editor?.chain().focus().toggleHighlight({ color }).run()
                        }
                      }}
                      className="w-6 h-6 rounded border border-gray-300 hover:scale-110 transition-transform"
                      style={{ backgroundColor: color === 'transparent' ? '#fff' : color }}
                      title={color === 'transparent' ? 'Remove' : color}
                    >
                      {color === 'transparent' && <span className="text-[8px] text-red-500">✕</span>}
                    </button>
                  ))}
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Line Spacing */}
          <div className="border-l pl-1.5 ml-0.5">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-7 text-[10px] gap-0.5" title="Line Spacing">
                  ↕
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                {LINE_HEIGHTS.map(lh => (
                  <DropdownMenuItem key={lh.value} onClick={() => (editor as any)?.chain().focus().setLineHeight(lh.value).run()} className="text-xs cursor-pointer">
                    {lh.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Letter Spacing */}
          <div className="border-l pl-1.5 ml-0.5">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-7 text-[10px] gap-0.5" title="Letter Spacing">
                  ↔
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                {LETTER_SPACINGS.map(ls => (
                  <DropdownMenuItem key={ls.value} onClick={() => (editor as any)?.chain().focus().setLetterSpacing(ls.value).run()} className="text-xs cursor-pointer">
                    {ls.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Heading */}
          <div className="border-l pl-1.5 ml-0.5">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-7 text-xs gap-1">
                  <Type className="w-3.5 h-3.5" />
                  Style
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => editor?.chain().focus().setParagraph().run()} className="text-xs">Normal</DropdownMenuItem>
                <DropdownMenuItem onClick={() => (editor as any)?.chain().focus().toggleHeading({ level: 1 }).run()} className="text-xs">Heading 1</DropdownMenuItem>
                <DropdownMenuItem onClick={() => (editor as any)?.chain().focus().toggleHeading({ level: 2 }).run()} className="text-xs">Heading 2</DropdownMenuItem>
                <DropdownMenuItem onClick={() => (editor as any)?.chain().focus().toggleHeading({ level: 3 }).run()} className="text-xs">Heading 3</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Alignment */}
          <div className="flex gap-0.5 border-l pl-1.5 ml-0.5">
            <Button onClick={() => editor?.chain().focus().setTextAlign("left").run()} variant={editor?.isActive({ textAlign: "left" }) ? "default" : "ghost"} size="sm" className="h-7 w-7 p-0" title="Align Left">
              <AlignLeft className="w-3.5 h-3.5" />
            </Button>
            <Button onClick={() => editor?.chain().focus().setTextAlign("center").run()} variant={editor?.isActive({ textAlign: "center" }) ? "default" : "ghost"} size="sm" className="h-7 w-7 p-0" title="Align Center">
              <AlignCenter className="w-3.5 h-3.5" />
            </Button>
            <Button onClick={() => editor?.chain().focus().setTextAlign("right").run()} variant={editor?.isActive({ textAlign: "right" }) ? "default" : "ghost"} size="sm" className="h-7 w-7 p-0" title="Align Right">
              <AlignRight className="w-3.5 h-3.5" />
            </Button>
            <Button onClick={() => editor?.chain().focus().setTextAlign("justify").run()} variant={editor?.isActive({ textAlign: "justify" }) ? "default" : "ghost"} size="sm" className="h-7 w-7 p-0" title="Justify">
              <AlignJustify className="w-3.5 h-3.5" />
            </Button>
          </div>

          {/* Indent/Outdent */}
          <div className="flex gap-0.5 border-l pl-1.5 ml-0.5">
            <Button onClick={() => (editor as any)?.chain().focus().indent().run()} variant="ghost" size="sm" className="h-7 w-7 p-0" title="Indent">
              <IndentIncrease className="w-3.5 h-3.5" />
            </Button>
            <Button onClick={() => (editor as any)?.chain().focus().outdent().run()} variant="ghost" size="sm" className="h-7 w-7 p-0" title="Outdent">
              <IndentDecrease className="w-3.5 h-3.5" />
            </Button>
          </div>

          {/* Lists */}
          <div className="flex gap-0.5 border-l pl-1.5 ml-0.5">
            <Button onClick={() => (editor as any)?.chain().focus().toggleBulletList().run()} variant={(editor as any)?.isActive("bulletList") ? "default" : "ghost"} size="sm" className="h-7 w-7 p-0" title="Bullet List">
              <List className="w-3.5 h-3.5" />
            </Button>
            <Button onClick={() => (editor as any)?.chain().focus().toggleOrderedList().run()} variant={(editor as any)?.isActive("orderedList") ? "default" : "ghost"} size="sm" className="h-7 w-7 p-0" title="Numbered List">
              <ListOrdered className="w-3.5 h-3.5" />
            </Button>
            <Button onClick={() => (editor as any)?.chain().focus().toggleTaskList().run()} variant={(editor as any)?.isActive("taskList") ? "default" : "ghost"} size="sm" className="h-7 w-7 p-0" title="Task List">
              <ListTodo className="w-3.5 h-3.5" />
            </Button>
          </div>

          {/* Insert */}
          <div className="flex gap-0.5 border-l pl-1.5 ml-0.5">
            <Button onClick={insertTable} variant="ghost" size="sm" className="h-7 w-7 p-0" title="Insert Table">
              <TableIcon className="w-3.5 h-3.5" />
            </Button>
            <Button onClick={() => setIsLinkDialogOpen(true)} variant="ghost" size="sm" className="h-7 w-7 p-0" title="Insert Link">
              <LinkIcon className="w-3.5 h-3.5" />
            </Button>
            <Button onClick={() => setIsImageDialogOpen(true)} variant="ghost" size="sm" className="h-7 w-7 p-0" title="Insert Image">
              <ImageIcon className="w-3.5 h-3.5" />
            </Button>
          </div>

          {/* Table Operations */}
          {editor?.isActive("table") && (
            <div className="flex gap-0.5 border-l pl-1.5 ml-0.5">
              {/* Cell operations */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-7 text-xs gap-1">
                    <Merge className="w-3.5 h-3.5" />
                    Cell
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => editor?.chain().focus().mergeCells().run()} className="text-xs cursor-pointer">Merge Cells</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => editor?.chain().focus().splitCell().run()} className="text-xs cursor-pointer">Split Cell</DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => editor?.chain().focus().toggleHeaderCell().run()} className="text-xs cursor-pointer">Toggle Header Cell</DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuSub>
                    <DropdownMenuSubTrigger className="text-xs">Cell Background</DropdownMenuSubTrigger>
                    <DropdownMenuSubContent>
                      <div className="grid grid-cols-5 gap-1 p-2">
                        {['#ffffff', '#f0f0f0', '#FFF3BF', '#FFE0B2', '#FFCDD2', '#E8EAF6', '#E0F2F1', '#E8F5E9', '#B3E5FC', '#FCE4EC'].map(color => (
                          <button
                            key={color}
                            onClick={() => editor?.chain().focus().setCellAttribute('backgroundColor', color).run()}
                            className="w-6 h-6 rounded border border-gray-300 hover:scale-110 transition-transform"
                            style={{ backgroundColor: color }}
                          />
                        ))}
                      </div>
                    </DropdownMenuSubContent>
                  </DropdownMenuSub>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Column operations */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-7 text-xs gap-1">
                    <Columns className="w-3.5 h-3.5" />
                    Col
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => editor?.chain().focus().addColumnBefore().run()} className="text-xs cursor-pointer">Add Column Before</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => editor?.chain().focus().addColumnAfter().run()} className="text-xs cursor-pointer">Add Column After</DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => editor?.chain().focus().toggleHeaderColumn().run()} className="text-xs cursor-pointer">Toggle Header Column</DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => editor?.chain().focus().deleteColumn().run()} className="text-xs text-red-600 cursor-pointer">Delete Column</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Row operations */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-7 text-xs gap-1">
                    <Rows className="w-3.5 h-3.5" />
                    Row
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => editor?.chain().focus().addRowBefore().run()} className="text-xs cursor-pointer">Add Row Before</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => editor?.chain().focus().addRowAfter().run()} className="text-xs cursor-pointer">Add Row After</DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => editor?.chain().focus().toggleHeaderRow().run()} className="text-xs cursor-pointer">Toggle Header Row</DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => editor?.chain().focus().deleteRow().run()} className="text-xs text-red-600 cursor-pointer">Delete Row</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Table operations */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-7 text-xs gap-1">
                    <TableIcon className="w-3.5 h-3.5" />
                    Table
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => editor?.chain().focus().fixTables().run()} className="text-xs cursor-pointer">Fix Table Structure</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => editor?.chain().focus().goToNextCell().run()} className="text-xs cursor-pointer">Go to Next Cell</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => editor?.chain().focus().goToPreviousCell().run()} className="text-xs cursor-pointer">Go to Previous Cell</DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => editor?.chain().focus().deleteTable().run()} className="text-xs text-red-600 cursor-pointer">Delete Entire Table</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
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

      {/* Status Bar */}
      <div className="flex items-center justify-between px-3 py-1 bg-card border-t text-[10px] text-muted-foreground">
        <div className="flex gap-3">
          <span>Characters: {charCount}</span>
          <span>Words: {wordCount}</span>
          <span>Pages: ~{pageCount}</span>
        </div>
        <span>Type / or press Ctrl+Space for element shortcuts</span>
      </div>

      {/* Right-click Context Menu for Tables */}
      {contextMenu && editor?.isActive('table') && (
        <div
          className="fixed z-50 bg-white rounded-md shadow-lg border py-1 min-w-[180px]"
          style={{ left: contextMenu.x, top: contextMenu.y }}
        >
          <button onClick={() => { editor?.chain().focus().mergeCells().run(); setContextMenu(null) }} className="w-full text-left px-3 py-1.5 text-xs hover:bg-gray-100">Merge Cells</button>
          <button onClick={() => { editor?.chain().focus().splitCell().run(); setContextMenu(null) }} className="w-full text-left px-3 py-1.5 text-xs hover:bg-gray-100">Split Cell</button>
          <div className="border-t my-1" />
          <button onClick={() => { editor?.chain().focus().addRowBefore().run(); setContextMenu(null) }} className="w-full text-left px-3 py-1.5 text-xs hover:bg-gray-100">Add Row Above</button>
          <button onClick={() => { editor?.chain().focus().addRowAfter().run(); setContextMenu(null) }} className="w-full text-left px-3 py-1.5 text-xs hover:bg-gray-100">Add Row Below</button>
          <button onClick={() => { editor?.chain().focus().addColumnBefore().run(); setContextMenu(null) }} className="w-full text-left px-3 py-1.5 text-xs hover:bg-gray-100">Add Column Left</button>
          <button onClick={() => { editor?.chain().focus().addColumnAfter().run(); setContextMenu(null) }} className="w-full text-left px-3 py-1.5 text-xs hover:bg-gray-100">Add Column Right</button>
          <div className="border-t my-1" />
          <button onClick={() => { editor?.chain().focus().deleteRow().run(); setContextMenu(null) }} className="w-full text-left px-3 py-1.5 text-xs hover:bg-gray-100 text-red-600">Delete Row</button>
          <button onClick={() => { editor?.chain().focus().deleteColumn().run(); setContextMenu(null) }} className="w-full text-left px-3 py-1.5 text-xs hover:bg-gray-100 text-red-600">Delete Column</button>
          <button onClick={() => { editor?.chain().focus().deleteTable().run(); setContextMenu(null) }} className="w-full text-left px-3 py-1.5 text-xs hover:bg-gray-100 text-red-600">Delete Table</button>
        </div>
      )}

      {/* Link Dialog */}
      <Dialog open={isLinkDialogOpen} onOpenChange={setIsLinkDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Insert Link</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <Label htmlFor="link-url" className="text-sm font-medium mb-2 block">URL</Label>
              <Input id="link-url" value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} placeholder="https://example.com" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsLinkDialogOpen(false)}>Cancel</Button>
            <Button onClick={insertLink}>Insert Link</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Image Dialog */}
      <Dialog open={isImageDialogOpen} onOpenChange={setIsImageDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Insert Image</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <Label htmlFor="image-url" className="text-sm font-medium mb-2 block">Image URL</Label>
              <Input id="image-url" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="https://example.com/image.jpg" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsImageDialogOpen(false)}>Cancel</Button>
            <Button onClick={insertImage}>Insert Image</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
