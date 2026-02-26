import { Node, mergeAttributes } from "@tiptap/core"
import { ReactNodeViewRenderer } from "@tiptap/react"
import { FormElementNode } from "@/components/form-element-node"

import { Table as TiptapTable } from "@tiptap/extension-table"
import TableCell from "@tiptap/extension-table-cell"
import TableHeader from "@tiptap/extension-table-header"

export const FormElementExtension = Node.create({
  name: "formElement",
  group: "inline",
  inline: true,
  atom: true,
  draggable: false,

  addAttributes() {
    return {
      elementType: { default: "input" },
      label: { default: "Field" },
      elementKey: { default: "" },
      defaultValue: { default: "" },
      required: { default: false },
      placeholder: { default: "" },
      helpText: { default: "" },
      metadata: { default: null },
      options: { default: null },
      group_id: { default: null },
      data_binding: { default: null },
      dataField: { default: "" },
      showTimeOnly: { default: false },
      useCurrentDateTime: { default: false },
      minLength: { default: undefined },
      maxLength: { default: undefined },
      pattern: { default: "" },
      min: { default: undefined },
      max: { default: undefined },
      step: { default: 1 },
      validationMessage: { default: "" },
    }
  },

  addStorage() {
    return {
      onElementClick: null,
      onElementDoubleClick: null,
    }
  },

  parseHTML() {
    return [{ tag: "form-element" }]
  },

  renderHTML({ HTMLAttributes }) {
    return ["form-element", mergeAttributes(HTMLAttributes)]
  },

  addNodeView() {
    return ReactNodeViewRenderer(FormElementNode)
  },
})

// Enhanced Table Extension with Data Binding Support
export const DataBoundTable = TiptapTable.extend({
  name: 'table',
  addAttributes() {
    return {
      ...this.parent?.(),
      dataset: {
        default: null,
        parseHTML: element => element.getAttribute('data-dataset'),
        renderHTML: attributes => {
          if (!attributes.dataset) return {}
          return { 'data-dataset': attributes.dataset }
        },
      },
      dataColumns: {
        default: null,
        parseHTML: element => element.getAttribute('data-columns'),
        renderHTML: attributes => {
          if (!attributes.dataColumns) return {}
          return { 'data-columns': attributes.dataColumns }
        },
      },
      borderStyle: {
        default: null,
        parseHTML: element => element.getAttribute('data-border-style'),
        renderHTML: attributes => {
          if (!attributes.borderStyle) return {}
          return { 'data-border-style': attributes.borderStyle }
        },
      },
      showBorders: {
        default: true,
        parseHTML: element => element.getAttribute('data-show-borders') === 'true',
        renderHTML: attributes => {
          return { 'data-show-borders': String(attributes.showBorders) }
        },
      },
      cellPadding: {
        default: null,
        parseHTML: element => element.getAttribute('data-cell-padding'),
        renderHTML: attributes => {
          if (!attributes.cellPadding) return {}
          return { 'data-cell-padding': attributes.cellPadding }
        },
      },
      minimalMode: {
        default: false,
        parseHTML: element => element.getAttribute('data-minimal-mode') === 'true',
        renderHTML: attributes => {
          return { 'data-minimal-mode': String(attributes.minimalMode) }
        },
      },
    }
  },
})

// Enhanced TableCell with dataField support
export const DataBoundTableCell = TableCell.extend({
  name: 'tableCell',

  addAttributes() {
    return {
      ...this.parent?.(),
      dataField: {
        default: null,
        parseHTML: element => element.getAttribute('data-field'),
        renderHTML: attributes => {
          if (!attributes.dataField) return {}
          return { 'data-field': attributes.dataField }
        },
      },
    }
  },
})

// Enhanced TableHeader with dataField support
export const DataBoundTableHeader = TableHeader.extend({
  name: 'tableHeader',

  addAttributes() {
    return {
      ...this.parent?.(),
      dataField: {
        default: null,
        parseHTML: element => element.getAttribute('data-field'),
        renderHTML: attributes => {
          if (!attributes.dataField) return {}
          return { 'data-field': attributes.dataField }
        },
      },
    }
  },
})
