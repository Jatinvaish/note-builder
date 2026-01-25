export interface DataFieldConfig {
  key: string
  label: string
  category: "patient" | "vitals" | "appointment" | "admission" | "examination"
  apiEndpoint: string
  apiPayloadKey?: string
  action: "api_call" | "modal" | "none"
  timing: "onload" | "onclick" | "onchange"
  autoFill: boolean
  relatedFields?: string[]
  dataPath: string
}

export const DATA_FIELD_REGISTRY: DataFieldConfig[] = [
  // Patient Info Fields - Single API Call
  {
    key: "patient_name",
    label: "Patient Name",
    category: "patient",
    apiEndpoint: "/user/patient-info",
    apiPayloadKey: "id",
    action: "api_call",
    timing: "onload",
    autoFill: true,
    relatedFields: ["patient_age", "patient_gender", "patient_dob", "patient_ipd_no"],
    dataPath: "patientName"
  },
  {
    key: "patient_age",
    label: "Patient Age",
    category: "patient",
    apiEndpoint: "/user/patient-info",
    apiPayloadKey: "id",
    action: "api_call",
    timing: "onload",
    autoFill: true,
    relatedFields: ["patient_name", "patient_gender", "patient_dob", "patient_ipd_no"],
    dataPath: "patientAge"
  },
  {
    key: "patient_gender",
    label: "Patient Gender",
    category: "patient",
    apiEndpoint: "/user/patient-info",
    apiPayloadKey: "id",
    action: "api_call",
    timing: "onload",
    autoFill: true,
    relatedFields: ["patient_name", "patient_age", "patient_dob", "patient_ipd_no"],
    dataPath: "patientGender"
  },
  {
    key: "patient_dob",
    label: "Patient Date of Birth",
    category: "patient",
    apiEndpoint: "/user/patient-info",
    apiPayloadKey: "id",
    action: "api_call",
    timing: "onload",
    autoFill: true,
    relatedFields: ["patient_name", "patient_age", "patient_gender", "patient_ipd_no"],
    dataPath: "patientDob"
  },
  {
    key: "patient_ipd_no",
    label: "IPD Number",
    category: "patient",
    apiEndpoint: "/user/patient-info",
    apiPayloadKey: "id",
    action: "api_call",
    timing: "onload",
    autoFill: true,
    relatedFields: ["patient_name", "patient_age", "patient_gender", "patient_dob"],
    dataPath: "ipdNo"
  },
  // Vitals Fields - Single API Call
  {
    key: "vitals_temperature",
    label: "Temperature",
    category: "vitals",
    apiEndpoint: "/user/patient-info",
    apiPayloadKey: "id",
    action: "api_call",
    timing: "onload",
    autoFill: true,
    relatedFields: ["vitals_pulse", "vitals_bp", "vitals_spo2", "vitals_weight"],
    dataPath: "latestVitals.temperature"
  },
  {
    key: "vitals_pulse",
    label: "Pulse Rate",
    category: "vitals",
    apiEndpoint: "/user/patient-info",
    apiPayloadKey: "id",
    action: "api_call",
    timing: "onload",
    autoFill: true,
    relatedFields: ["vitals_temperature", "vitals_bp", "vitals_spo2", "vitals_weight"],
    dataPath: "latestVitals.pulse"
  },
  {
    key: "vitals_bp",
    label: "Blood Pressure",
    category: "vitals",
    apiEndpoint: "/user/patient-info",
    apiPayloadKey: "id",
    action: "api_call",
    timing: "onload",
    autoFill: true,
    relatedFields: ["vitals_temperature", "vitals_pulse", "vitals_spo2", "vitals_weight"],
    dataPath: "latestVitals.bp"
  },
  {
    key: "vitals_spo2",
    label: "SpO2",
    category: "vitals",
    apiEndpoint: "/user/patient-info",
    apiPayloadKey: "id",
    action: "api_call",
    timing: "onload",
    autoFill: true,
    relatedFields: ["vitals_temperature", "vitals_pulse", "vitals_bp", "vitals_weight"],
    dataPath: "latestVitals.spo2"
  },
  {
    key: "vitals_weight",
    label: "Weight",
    category: "vitals",
    apiEndpoint: "/user/patient-info",
    apiPayloadKey: "id",
    action: "api_call",
    timing: "onload",
    autoFill: true,
    relatedFields: ["vitals_temperature", "vitals_pulse", "vitals_bp", "vitals_spo2"],
    dataPath: "latestVitals.weight"
  },
  // Physical Examination - Modal Action
  {
    key: "physical_examination",
    label: "Physical Examination",
    category: "examination",
    apiEndpoint: "/physical-examination/get",
    apiPayloadKey: "userId",
    action: "modal",
    timing: "onclick",
    autoFill: false,
    dataPath: "access"
  },
  // Appointment Date
  {
    key: "appointment_date",
    label: "Appointment Date",
    category: "appointment",
    apiEndpoint: "/user/patient-info",
    apiPayloadKey: "id",
    action: "api_call",
    timing: "onload",
    autoFill: true,
    dataPath: "appointmentDate"
  },
  // Current Date
  {
    key: "current_date",
    label: "Current Date",
    category: "appointment",
    apiEndpoint: "",
    action: "none",
    timing: "onload",
    autoFill: true,
    dataPath: ""
  }
]

export function getDataFieldsByCategory(category: string): DataFieldConfig[] {
  return DATA_FIELD_REGISTRY.filter(f => f.category === category)
}

export function getDataFieldByKey(key: string): DataFieldConfig | undefined {
  return DATA_FIELD_REGISTRY.find(f => f.key === key)
}

export function getUniqueApiEndpoints(dataFieldKeys: string[]): Map<string, DataFieldConfig[]> {
  const endpointMap = new Map<string, DataFieldConfig[]>()
  
  dataFieldKeys.forEach(key => {
    const config = getDataFieldByKey(key)
    if (config && config.apiEndpoint) {
      const existing = endpointMap.get(config.apiEndpoint) || []
      if (!existing.find(c => c.key === config.key)) {
        existing.push(config)
        endpointMap.set(config.apiEndpoint, existing)
      }
    }
  })
  
  return endpointMap
}
