import type { ClinicalContext } from "./types"
import { fetcher } from "./services/fetcher"

class BindingResolver {
  async resolveBinding(binding: string, context?: ClinicalContext): Promise<any> {
    if (!binding || !context) return null

    const [source, field] = binding.split(".")

    if (source === "patient" && context.patientId) {
      const response = await fetcher({ path: "/user/patient-info" }, { json: { id: context.patientId } })
      return response?.data?.[field] || null
    }

    if (source === "vitals" && context.patientId) {
      const response = await fetcher({ path: "/physical-examination/get" }, { json: { patientId: context.patientId } })
      return response?.data?.[field] || null
    }

    return null
  }
}

let resolver: BindingResolver | null = null

export function getBindingResolver(): BindingResolver {
  if (!resolver) resolver = new BindingResolver()
  return resolver
}
