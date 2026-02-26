import { fetcher } from "./services/fetcher"
import { DATA_FIELD_REGISTRY, getDataFieldByKey, getUniqueApiEndpoints } from "./data-field-registry"
import type { FormElement } from "./types"

export class AutoFillService {
  private cache: Map<string, any> = new Map()

  async autoFillElements(
    elements: FormElement[],
    patientId: number,
    admissionId: number
  ): Promise<Record<string, any>> {
    const filledData: Record<string, any> = {}
    const dataFieldKeys = elements
      .filter(el => el.dataField)
      .map(el => el.dataField!)
    
    if (dataFieldKeys.length === 0) return filledData

    const apiMap = getUniqueApiEndpoints(dataFieldKeys)

    // Fetch all unique endpoints in PARALLEL instead of sequentially
    const uncachedEntries: [string, typeof configs][] = []
    type configs = ReturnType<typeof getUniqueApiEndpoints> extends Map<string, infer V> ? V : never

    for (const [endpoint, configs] of apiMap.entries()) {
      if (!endpoint) continue
      const cacheKey = `${endpoint}_${patientId}`
      if (!this.cache.has(cacheKey)) {
        uncachedEntries.push([endpoint, configs as any])
      }
    }

    // Fire all uncached API requests simultaneously
    if (uncachedEntries.length > 0) {
      const results = await Promise.allSettled(
        uncachedEntries.map(async ([endpoint, configs]) => {
          const payload = (configs as any)[0]?.apiPayloadKey === "id" ? { id: patientId } : { patientId }
          const response = await fetcher({ path: endpoint }, { json: payload })
          return { endpoint, data: response?.data || response }
        })
      )

      for (const result of results) {
        if (result.status === 'fulfilled') {
          const cacheKey = `${result.value.endpoint}_${patientId}`
          this.cache.set(cacheKey, result.value.data)
        }
      }
    }

    // Now map cached data to elements
    for (const [endpoint] of apiMap.entries()) {
      if (!endpoint) continue
      const cacheKey = `${endpoint}_${patientId}`
      const apiData = this.cache.get(cacheKey)
      if (!apiData) continue

      for (const element of elements) {
        if (!element.dataField) continue

        const config = getDataFieldByKey(element.dataField)
        if (!config || !config.autoFill) continue

        if (config.apiEndpoint === endpoint) {
          const value = this.getNestedValue(apiData, config.dataPath)
          if (value !== undefined && value !== null) {
            if (typeof value === 'number' && value > 1000000000000) {
              filledData[element.elementKey] = this.timestampToISO(value)
            } else {
              filledData[element.elementKey] = value
            }
          }
        }
      }
    }
    
    elements.forEach(element => {
      if (element.dataField === "current_date" && !filledData[element.elementKey]) {
        filledData[element.elementKey] = new Date().toLocaleDateString('en-IN')
      }
    })

    return filledData
  }

  private getNestedValue(obj: any, path: string): any {
    if (!path) return obj
    const value = path.split('.').reduce((acc, part) => acc?.[part], obj)
    return value
  }

  private formatTimestamp(timestamp: number): string {
    const date = new Date(timestamp)
    const day = String(date.getDate()).padStart(2, '0')
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const year = date.getFullYear()
    let hours = date.getHours()
    const minutes = String(date.getMinutes()).padStart(2, '0')
    const ampm = hours >= 12 ? 'PM' : 'AM'
    hours = hours % 12 || 12
    return `${day}-${month}-${year} ${hours}:${minutes} ${ampm}`
  }

  private timestampToISO(timestamp: number): string {
    const date = new Date(timestamp)
    return date.toISOString().slice(0, 16)
  }

  clearCache() {
    this.cache.clear()
  }
}
