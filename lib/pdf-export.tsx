export async function exportNoteAsPDF(
  templateName: string,
  formData: Record<string, any>,
  templateContent: any,
  fileName?: string
) {
  try {
    if (typeof window === "undefined") {
      console.error("PDF export only works in browser")
      return false
    }

    const html2pdf = (await import("html2pdf.js")).default

    // Create HTML content for PDF
    const pdfContent = renderContentForPDF(templateContent, formData)
    
    const element = document.createElement("div")
    element.innerHTML = pdfContent
    element.style.padding = "20px"
    element.style.fontFamily = "Arial, sans-serif"
    element.style.fontSize = "12px"
    element.style.lineHeight = "1.6"

    const opt = {
      margin: 10,
      filename: fileName || `${templateName}_${new Date().toISOString().split("T")[0]}.pdf`,
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { orientation: "portrait", unit: "mm", format: "a4" },
    }

    await html2pdf().set(opt).from(element).save()
    return true
  } catch (error) {
    console.error("PDF export failed:", error)
    return false
  }
}

function renderContentForPDF(content: any, formData: Record<string, any>): string {
  if (!content || !content.content) return ""

  let html = ""

  const renderNode = (node: any): string => {
    if (!node) return ""

    switch (node.type) {
      case "heading":
        const level = node.attrs?.level || 1
        const sizes: Record<number, string> = {
          1: "24px",
          2: "20px",
          3: "18px",
        }
        const size = sizes[level] || "16px"
        return `<h${level} style="font-size: ${size}; font-weight: bold; margin: 10px 0;">${renderContent(node.content)}</h${level}>`

      case "paragraph":
        return `<p style="margin: 8px 0;">${renderContent(node.content)}</p>`

      case "bulletList":
        return `<ul style="margin: 8px 0; padding-left: 20px;">${node.content?.map((item: any) => `<li>${renderContent(item.content)}</li>`).join("")}</ul>`

      case "orderedList":
        return `<ol style="margin: 8px 0; padding-left: 20px;">${node.content?.map((item: any) => `<li>${renderContent(item.content)}</li>`).join("")}</ol>`

      case "table":
        const rows = node.content
          ?.map((row: any) => {
            const cells = row.content
              ?.map((cell: any) => {
                const isHeader = cell.type === "tableHeader"
                const tag = isHeader ? "th" : "td"
                return `<${tag} style="border: 1px solid #000; padding: 8px; ${isHeader ? "font-weight: bold; background-color: #f0f0f0;" : ""}">${renderContent(cell.content)}</${tag}>`
              })
              .join("")
            return `<tr>${cells}</tr>`
          })
          .join("")
        return `<table style="border-collapse: collapse; width: 100%; margin: 10px 0;">${rows}</table>`

      case "formElement":
        const fieldValue = formData[node.attrs?.elementKey] || ""
        return `<div style="margin: 10px 0;">
          <strong>${node.attrs?.label}${node.attrs?.required ? " *" : ""}:</strong>
          <div style="border-bottom: 1px solid #000; padding: 5px 0; min-height: 20px;">${fieldValue}</div>
        </div>`

      default:
        return ""
    }
  }

  function renderContent(nodes: any[]): string {
    if (!Array.isArray(nodes)) return ""
    return nodes.map((n) => {
      if (n.type === "text") return n.text || ""
      return renderNode(n)
    }).join("")
  }

  html = content.content.map((node: any) => renderNode(node)).join("")

  return html
}
