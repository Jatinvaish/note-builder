import { fetcher } from "./fetcher"

export interface NormalizedPatientData {
  patient: {
    patientName: string
    age: string
    patientGender: string
    ipdNo: string
  }
  vitals: {
    temperature: string
    pulse: string
    bp: string
    spo2: string
    weight: string
  }
}

export class DataFieldAPI {
  private cache: Map<string, NormalizedPatientData> = new Map()

  async fetchPatientData(patientId: number, admissionId: number): Promise<NormalizedPatientData | null> {
    const cacheKey = `patient_${patientId}_${admissionId}`
    
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!
    }

    try {
      const response = await fetcher(
        { path: "/user/patient-info" },
        { json: { id: patientId } }
      )

      if (response?.success && response?.data) {
        const normalized = this.normalizePatientData(response.data, admissionId)
        this.cache.set(cacheKey, normalized)
        return normalized
      }
    } catch (error) {
      console.error("Error fetching patient data:", error)
    }

    return null
  }

  private normalizePatientData(raw: any, admissionId: number): NormalizedPatientData {
    let age = ""
    if (raw.patientDob) {
      const dob = new Date(raw.patientDob)
      const today = new Date()
      const calculatedAge = today.getFullYear() - dob.getFullYear()
      const monthDiff = today.getMonth() - dob.getMonth()
      
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
        age = (calculatedAge - 1).toString()
      } else {
        age = calculatedAge.toString()
      }
    }

    let vitalsData = raw.latestVitals
    if (typeof vitalsData === 'string') {
      try {
        vitalsData = JSON.parse(vitalsData)
      } catch (e) {
        console.error('Error parsing latestVitals:', e)
        vitalsData = null
      }
    }

    return {
      patient: {
        patientName: raw.patientName || "",
        age,
        patientGender: raw.patientGender || "",
        ipdNo: admissionId.toString(),
      },
      vitals: {
        temperature: vitalsData?.temperature || "",
        pulse: vitalsData?.pulseRate || vitalsData?.pulse || "",
        bp: vitalsData?.bloodPressure || vitalsData?.bp || "",
        spo2: vitalsData?.spo2 || "",
        weight: vitalsData?.weight || "",
      },
    }
  }

  getValueByPath(data: NormalizedPatientData, path: string): string {
    const parts = path.split('.')
    let value: any = data
    
    for (const part of parts) {
      value = value?.[part]
      if (value === undefined || value === null) return ""
    }
    
    return String(value)
  }

  clearCache() {
    this.cache.clear()
  }
}
