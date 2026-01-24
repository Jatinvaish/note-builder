import { Node, mergeAttributes } from "@tiptap/core"
import { ReactNodeViewRenderer } from "@tiptap/react"
import { FormElementNode } from "@/components/form-element-node"

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
