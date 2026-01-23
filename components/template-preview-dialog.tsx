"use client"

import { useState } from "react"
import type { Template, ClinicalContext } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TemplateRenderer } from "@/components/template-renderer"
import { Printer, X } from "lucide-react"

interface TemplatePreviewDialogProps {
  template: Template
  isOpen: boolean
  onClose: () => void
  clinicalContext?: ClinicalContext
}

export function TemplatePreviewDialog({
  template,
  isOpen,
  onClose,
  clinicalContext,
}: TemplatePreviewDialogProps) {
  const [previewData, setPreviewData] = useState<Record<string, any>>({})
  const [activeTab, setActiveTab] = useState<"preview" | "print">("preview")

  const handlePrint = () => {
    // Import print styles
    const link = document.createElement("link")
    link.rel = "stylesheet"
    link.href = "/styles/print.css"
    document.head.appendChild(link)

    // Trigger browser print dialog
    window.print()

    // Clean up
    setTimeout(() => {
      document.head.removeChild(link)
    }, 100)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex items-center justify-between">
          <DialogTitle>Template Preview</DialogTitle>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={handlePrint}
              className="gap-2 bg-transparent"
            >
              <Printer className="w-4 h-4" />
              Print
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={onClose}
              className="h-6 w-6 p-0"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(tab: any) => setActiveTab(tab)} className="flex-1 flex flex-col">
          <TabsList className="w-full justify-start">
            <TabsTrigger value="preview">Preview</TabsTrigger>
            <TabsTrigger value="print">Print Layout</TabsTrigger>
          </TabsList>

          <TabsContent value="preview" className="flex-1 overflow-y-auto bg-background p-6">
            <div className="max-w-3xl mx-auto space-y-4">
              {/* Template Info */}
              <div className="bg-muted p-4 rounded-lg space-y-2">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="font-medium text-muted-foreground">Template Name</p>
                    <p className="font-semibold">{template.templateName}</p>
                  </div>
                  <div>
                    <p className="font-medium text-muted-foreground">Type</p>
                    <p className="font-semibold">{template.templateType}</p>
                  </div>
                  <div>
                    <p className="font-medium text-muted-foreground">Status</p>
                    <p className="font-semibold">{template.status || "active"}</p>
                  </div>
                  <div>
                    <p className="font-medium text-muted-foreground">Version</p>
                    <p className="font-semibold">v{template.versionHistory.length}</p>
                  </div>
                </div>
              </div>

              {/* Template Description */}
              {template.templateDescription && (
                <div className="bg-card border border-border rounded-lg p-4">
                  <p className="text-sm text-muted-foreground">{template.templateDescription}</p>
                </div>
              )}

              {/* Template Content */}
              <div className="bg-white border border-border rounded-lg p-6">
                <TemplateRenderer
                  template={template}
                  data={previewData}
                  onDataChange={(key, value) => setPreviewData({ ...previewData, [key]: value })}
                  isEditable={true}
                  clinicalContext={clinicalContext}
                  readOnly={false}
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="print" className="flex-1 overflow-y-auto bg-white p-8">
            <div className="max-w-3xl mx-auto space-y-4 print-content">
              {/* Print Header */}
              <div className="template-info space-y-2">
                <h1 className="text-2xl font-bold">{template.templateName}</h1>
                <div className="template-info-item">
                  <span className="template-info-label">Type:</span> {template.templateType}
                </div>
                <div className="template-info-item">
                  <span className="template-info-label">Version:</span> v{template.versionHistory.length}
                </div>
                <div className="template-info-item">
                  <span className="template-info-label">Printed:</span> {new Date().toLocaleString()}
                </div>
              </div>

              {/* Template Description */}
              {template.templateDescription && (
                <div className="page-break-inside">
                  <p className="text-sm text-foreground">{template.templateDescription}</p>
                </div>
              )}

              {/* Template Content for Printing */}
              <div className="page-break-inside">
                <TemplateRenderer
                  template={template}
                  data={previewData}
                  onDataChange={() => {}}
                  isEditable={false}
                  clinicalContext={clinicalContext}
                  readOnly={true}
                />
              </div>

              {/* Print Footer */}
              <div className="print-footer">
                <p>Page <span className="page-number">1</span> of <span className="page-count">1</span></p>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
