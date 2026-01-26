export const PREDEFINED_DATA_FIELDS = [
  // Patient Information
  { id: "patient_name", label: "Patient Name", category: "Patient Info" },
  { id: "patient_age", label: "Patient Age", category: "Patient Info" },
  { id: "patient_dob", label: "Date of Birth", category: "Patient Info" },
  { id: "patient_gender", label: "Gender", category: "Patient Info" },
  { id: "patient_mrn", label: "Medical Record Number", category: "Patient Info" },
  { id: "patient_phone", label: "Contact Number", category: "Patient Info" },
  { id: "patient_email", label: "Email", category: "Patient Info" },

  // Vitals
  { id: "vital_temperature", label: "Temperature", category: "Vitals" },
  { id: "vital_blood_pressure", label: "Blood Pressure", category: "Vitals" },
  { id: "vital_heart_rate", label: "Heart Rate", category: "Vitals" },
  { id: "vital_respiratory_rate", label: "Respiratory Rate", category: "Vitals" },
  { id: "vital_oxygen_saturation", label: "SP02(Oxygen Saturation)", category: "Vitals" },
  { id: "vital_weight", label: "Weight", category: "Vitals" },
  { id: "vital_height", label: "Height", category: "Vitals" },
  { id: "vital_bmi", label: "BMI", category: "Vitals" },

  //Physcial Examination
  
  // Cardiovascular
  { id: "cv_heart_sounds", label: "Heart Sounds", category: "Cardiovascular" },
  { id: "cv_murmurs", label: "Murmurs", category: "Cardiovascular" },
  { id: "cv_pulse", label: "Pulse", category: "Cardiovascular" },
  { id: "cv_jvp", label: "JVP", category: "Cardiovascular" },
  { id: "cv_edema", label: "Edema", category: "Cardiovascular" },

  // Respiratory
  { id: "resp_breath_sounds", label: "Breath Sounds", category: "Respiratory" },
  { id: "resp_wheezing", label: "Wheezing", category: "Respiratory" },
  { id: "resp_crackles", label: "Crackles", category: "Respiratory" },
  { id: "resp_chest_expansion", label: "Chest Expansion", category: "Respiratory" },

  // Gastrointestinal
  { id: "gi_bowel_sounds", label: "Bowel Sounds", category: "Gastrointestinal" },
  { id: "gi_tenderness", label: "Tenderness", category: "Gastrointestinal" },
  { id: "gi_distension", label: "Distension", category: "Gastrointestinal" },
  { id: "gi_liver_size", label: "Liver Size", category: "Gastrointestinal" },
  { id: "gi_spleen", label: "Spleen", category: "Gastrointestinal" },

  // Neurological
  { id: "neuro_consciousness", label: "Consciousness Level", category: "Neurological" },
  { id: "neuro_gcs", label: "Glasgow Coma Scale", category: "Neurological" },
  { id: "neuro_motor", label: "Motor", category: "Neurological" },
  { id: "neuro_sensory", label: "Sensory", category: "Neurological" },
  { id: "neuro_reflexes", label: "Reflexes", category: "Neurological" },
  { id: "neuro_cranial_nerves", label: "Cranial Nerves", category: "Neurological" },

  // Diagnosis & Assessment
  { id: "diagnosis_primary", label: "Primary Diagnosis", category: "Diagnosis" },
  { id: "diagnosis_differential", label: "Differential Diagnosis", category: "Diagnosis" },
  { id: "assessment_summary", label: "Assessment Summary", category: "Diagnosis" },

  // Plan & Treatment
  { id: "plan_medications", label: "Medications", category: "Plan" },
  { id: "plan_procedures", label: "Procedures", category: "Plan" },
  { id: "plan_followup", label: "Follow-up", category: "Plan" },
  { id: "plan_investigations", label: "Investigations", category: "Plan" },
  { id: "plan_referral", label: "Referral", category: "Plan" },

  // Consultation Details
  { id: "consult_date", label: "Consultation Date", category: "Consultation" },
  { id: "consult_time", label: "Consultation Time", category: "Consultation" },
  { id: "consult_provider", label: "Provider Name", category: "Consultation" },
  { id: "consult_location", label: "Location", category: "Consultation" },
  { id: "consult_type", label: "Consultation Type", category: "Consultation" },

  // History
  { id: "history_chief_complaint", label: "Chief Complaint", category: "History" },
  { id: "history_present_illness", label: "History of Present Illness", category: "History" },
  { id: "history_past_medical", label: "Past Medical History", category: "History" },
  { id: "history_medications", label: "Current Medications", category: "History" },
  { id: "history_allergies", label: "Allergies", category: "History" },
  { id: "history_social", label: "Social History", category: "History" },
  { id: "history_family", label: "Family History", category: "History" },
]

export function getDataFieldLabel(fieldId: string): string {
  const field = PREDEFINED_DATA_FIELDS.find((f) => f.id === fieldId)
  return field?.label || fieldId
}

export function getDataFieldsByCategory(category: string) {
  return PREDEFINED_DATA_FIELDS.filter((f) => f.category === category)
}

export function getAllCategories() {
  return Array.from(new Set(PREDEFINED_DATA_FIELDS.map((f) => f.category)))
}
