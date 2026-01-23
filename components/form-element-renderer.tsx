"use client"
import type { FormElement } from "@/lib/types"

interface FormElementRendererProps {
  element: FormElement
  isPreview?: boolean
}

export function FormElementRenderer({ element, isPreview = false }: FormElementRendererProps) {
  const { elementType, label, elementKey, defaultValue, options, required } = element
  const commonClasses = "px-2 py-1 text-sm rounded border border-border focus:outline-none focus:ring-2 focus:ring-ring"

  if (isPreview) {
    switch (elementType) {
      case "input":
        return (
          <span className="inline-flex items-baseline gap-1">
            <input
              type="text"
              placeholder={label}
              required={required}
              className={`inline-block ${commonClasses} min-w-32`}
              readOnly
            />
          </span>
        )

      case "textarea":
        return (
          <span className="inline-flex items-baseline gap-1">
            <textarea
              placeholder={label}
              required={required}
              className={`inline-block ${commonClasses} min-w-full`}
              rows={3}
              readOnly
            />
          </span>
        )

      case "checkbox":
        return (
          <span className="inline-flex items-center gap-2">
            <input type="checkbox" defaultChecked={defaultValue === "true"} disabled className="h-4 w-4" />
            <label className="text-sm">{label}</label>
          </span>
        )

      case "select":
        return (
          <span className="inline-flex items-baseline gap-1">
            <select className={`inline-block ${commonClasses}`} disabled>
              <option value="">{label}</option>
              {options?.source === "static" &&
                options.values?.map((val, i) => (
                  <option key={i} value={val}>
                    {val}
                  </option>
                ))}
            </select>
          </span>
        )

      case "datetime":
        return (
          <span className="inline-flex items-baseline gap-1">
            <input type="datetime-local" className={`inline-block ${commonClasses}`} disabled />
          </span>
        )

      case "signature":
        return (
          <span className="inline-block px-3 py-1 border-b-2 border-dashed border-border text-xs text-muted-foreground">
            [Signature: {label}]
          </span>
        )

      default:
        return <span className="text-xs text-muted-foreground">[Unknown Field]</span>
    }
  }

  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded border border-primary bg-primary/10 text-xs font-medium cursor-pointer hover:bg-primary/20 transition-colors">
      <span>{label}</span>
      {required && <span className="text-destructive">*</span>}
    </span>
  )
}
