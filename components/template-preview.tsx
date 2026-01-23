"use client"

import React from "react"
import type { Template } from "@/lib/types"
import { FormElementRenderer } from "./form-element-renderer"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"

interface TemplatePreviewProps {
  template: Template
  onBack: () => void
}

export function TemplatePreview({ template, onBack }: TemplatePreviewProps) {
  const renderNode = (node: any, index: number): React.ReactNode => {
    switch (node.type) {
      case "heading":
        const HeadingTag = `h${node.attrs?.level || 1}` as const
        return React.createElement(
          HeadingTag,
          {
            key: index,
            className: `font-bold my-4 ${
              node.attrs?.level === 1 ? "text-2xl" : node.attrs?.level === 2 ? "text-xl" : "text-lg"
            }`,
          },
          node.content?.map((child: any, i: number) => renderInlineNode(child, i)) || "",
        )

      case "paragraph":
        return (
          <p key={index} className="mb-3 leading-relaxed">
            {node.content?.map((child: any, i: number) => renderInlineNode(child, i)) || ""}
          </p>
        )

      case "bulletList":
        return (
          <ul key={index} className="list-disc ml-6 mb-3 space-y-1">
            {node.content?.map((item: any, i: number) => (
              <li key={i}>{item.content?.map((child: any, j: number) => renderInlineNode(child, j))}</li>
            ))}
          </ul>
        )

      case "orderedList":
        return (
          <ol key={index} className="list-decimal ml-6 mb-3 space-y-1">
            {node.content?.map((item: any, i: number) => (
              <li key={i}>{item.content?.map((child: any, j: number) => renderInlineNode(child, j))}</li>
            ))}
          </ol>
        )

      default:
        return null
    }
  }

  const renderInlineNode = (node: any, index: number): React.ReactNode => {
    if (node.type === "text") {
      let content: React.ReactNode = node.text
      if (node.marks) {
        node.marks.forEach((mark: any) => {
          if (mark.type === "bold") content = <strong key={`${index}-b`}>{content}</strong>
          if (mark.type === "italic") content = <em key={`${index}-i`}>{content}</em>
        })
      }
      return <span key={index}>{content}</span>
    }

    if (node.type === "formElement" && node.attrs) {
      return <FormElementRenderer key={index} element={node.attrs} isPreview />
    }

    return null
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{template.templateName}</h1>
          {template.templateDescription && <p className="text-muted-foreground mt-1">{template.templateDescription}</p>}
        </div>
        <Button onClick={onBack} variant="outline" className="gap-2 bg-transparent">
          <ArrowLeft className="w-4 h-4" />
          Back
        </Button>
      </div>

      <div className="bg-card rounded-lg border border-border p-8 prose prose-sm max-w-none dark:prose-invert">
        {template.templateContent.content.map((node, index) => renderNode(node, index))}
      </div>
    </div>
  )
}
