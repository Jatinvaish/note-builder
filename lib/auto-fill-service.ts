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
    
    for (const [endpoint, configs] of apiMap.entries()) {
      if (!endpoint) continue
      
      const cacheKey = `${endpoint}_${patientId}`
      let apiData = this.cache.get(cacheKey)
      
      if (!apiData) {
        try {
          const payload = configs[0].apiPayloadKey === "id" ? { id: patientId } : { patientId }
          const response = await fetcher({ path: endpoint }, { json: payload })
          apiData = response?.data || response
          this.cache.set(cacheKey, apiData)
        } catch (error) {
          console.error(`Failed to fetch ${endpoint}:`, error)
          continue
        }
      }
      
      for (const element of elements) {
        if (!element.dataField) continue
        
        const config = getDataFieldByKey(element.dataField)
        if (!config || !config.autoFill) continue
        
        if (config.apiEndpoint === endpoint) {
          const value = this.getNestedValue(apiData, config.dataPath)
          if (value !== undefined && value !== null) {
            filledData[element.elementKey] = value
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
    return path.split('.').reduce((acc, part) => acc?.[part], obj)
  }

  clearCache() {
    this.cache.clear()
  }
}
