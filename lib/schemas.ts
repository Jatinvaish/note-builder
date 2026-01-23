import { z } from "zod"

// Data Binding Schema (PR-1)
export const dataBindingSchema = z.object({
  type: z.enum(["manual", "api"]),
  source: z.string().optional(),
  apiEndpoint: z.string().optional(),
  fallbackValue: z.string().optional(),
}).nullable()

// Group Schema (PR-1)
export const groupSchema = z.object({
  id: z.string().min(1, "Group ID is required"),
  group_name: z.string().min(1, "Group name is required").max(255),
  status: z.enum(["active", "inactive"]),
  order_by: z.number().int().nonnegative(),
})

// Template Schema with new properties
export const templateSchema = z.object({
  templateName: z
    .string()
    .min(1, "Template name is required")
    .max(255, "Template name must be less than 255 characters"),
  templateDescription: z.string().optional(),
  templateType: z.enum(["navigate only", "regular"]).optional(),
  templateContent: z.any(),
  status: z.enum(["active", "inactive"]).optional().default("active"),
  groups: z.array(groupSchema).optional().default([]),
})

// Consultation Schema (backward compatible)
export const consultationSchema = z.object({
  templateId: z.string().min(1, "Template is required"),
  templateVersionId: z.number().int().positive().optional(),
  notes: z.record(z.any()),
  bindings: z.record(z.any()).optional(),
})

export type TemplateInput = z.infer<typeof templateSchema>
export type ConsultationInput = z.infer<typeof consultationSchema>
export type DataBindingInput = z.infer<typeof dataBindingSchema>
export type GroupInput = z.infer<typeof groupSchema>
