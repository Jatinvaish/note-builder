import type { DataField } from './data-field-types'

export const PREDEFINED_DATA_FIELDS: DataField[] = [
  // Patient Information
  {
    id: "patient_name",
    label: "Patient Name",
    category: "Patient Info",
    actions: {
      type: 'API_CALL',
      api_call_in_page: true,
      api: 'user/patient-info',
      oncallback_autofill_value: true
    },
    call_time: {
      on_render_page: true,
      on_click_element: false
    },
    autofill_after_value_get: true,
    depend_value_on_other: false,
    group_of: {
      group_auto_fill_input: true,
      api_group_available: true,
      model_group_available: false,
      group_autofill_ids: [
        { id: 'patient_age' },
        { id: 'patient_dob' },
        { id: 'patient_gender' },
        { id: 'patient_mrn' },
        { id: 'patient_phone' },
        { id: 'patient_email' }
      ]
    }
  },
  {
    id: "patient_age",
    label: "Patient Age",
    category: "Patient Info",
    actions: {
      type: 'API_CALL',
      api_call_in_page: true,
      api: 'user/patient-info',
      oncallback_autofill_value: true
    },
    call_time: {
      on_render_page: true,
      on_click_element: false
    },
    autofill_after_value_get: true,
    depend_value_on_other: false,
    group_of: {
      group_auto_fill_input: false,
      api_group_available: false,
      model_group_available: false,
      group_autofill_ids: []
    }
  },
  {
    id: "patient_dob",
    label: "Date of Birth",
    category: "Patient Info",
    actions: {
      type: 'API_CALL',
      api_call_in_page: true,
      api: 'user/patient-info',
      oncallback_autofill_value: true
    },
    call_time: {
      on_render_page: true,
      on_click_element: false
    },
    autofill_after_value_get: true,
    depend_value_on_other: false,
    group_of: {
      group_auto_fill_input: false,
      api_group_available: false,
      model_group_available: false,
      group_autofill_ids: []
    }
  },
  {
    id: "patient_gender",
    label: "Gender",
    category: "Patient Info",
    actions: {
      type: 'API_CALL',
      api_call_in_page: true,
      api: 'user/patient-info',
      oncallback_autofill_value: true
    },
    call_time: {
      on_render_page: true,
      on_click_element: false
    },
    autofill_after_value_get: true,
    depend_value_on_other: false,
    group_of: {
      group_auto_fill_input: false,
      api_group_available: false,
      model_group_available: false,
      group_autofill_ids: []
    }
  },
  {
    id: "patient_mrn",
    label: "Medical Record Number",
    category: "Patient Info",
    actions: {
      type: 'API_CALL',
      api_call_in_page: true,
      api: 'user/patient-info',
      oncallback_autofill_value: true
    },
    call_time: {
      on_render_page: true,
      on_click_element: false
    },
    autofill_after_value_get: true,
    depend_value_on_other: false,
    group_of: {
      group_auto_fill_input: false,
      api_group_available: false,
      model_group_available: false,
      group_autofill_ids: []
    }
  },
  {
    id: "patient_phone",
    label: "Contact Number",
    category: "Patient Info",
    actions: {
      type: 'API_CALL',
      api_call_in_page: true,
      api: 'user/patient-info',
      oncallback_autofill_value: true
    },
    call_time: {
      on_render_page: true,
      on_click_element: false
    },
    autofill_after_value_get: true,
    depend_value_on_other: false,
    group_of: {
      group_auto_fill_input: false,
      api_group_available: false,
      model_group_available: false,
      group_autofill_ids: []
    }
  },
  {
    id: "patient_email",
    label: "Email",
    category: "Patient Info",
    actions: {
      type: 'API_CALL',
      api_call_in_page: true,
      api: 'user/patient-info',
      oncallback_autofill_value: true
    },
    call_time: {
      on_render_page: true,
      on_click_element: false
    },
    autofill_after_value_get: true,
    depend_value_on_other: false,
    group_of: {
      group_auto_fill_input: false,
      api_group_available: false,
      model_group_available: false,
      group_autofill_ids: []
    }
  },

  // Vitals
  {
    id: "vital_temperature",
    label: "Temperature",
    category: "Vitals",
    actions: {
      type: 'API_CALL',
      api_call_in_page: true,
      api: 'user/patient-info',
      oncallback_autofill_value: true
    },
    call_time: {
      on_render_page: true,
      on_click_element: false
    },
    autofill_after_value_get: true,
    depend_value_on_other: false,
    group_of: {
      group_auto_fill_input: true,
      api_group_available: true,
      model_group_available: false,
      group_autofill_ids: [
        { id: 'vital_blood_pressure' },
        { id: 'vital_heart_rate' },
        { id: 'vital_respiratory_rate' },
        { id: 'vital_pulse' },
        { id: 'vital_oxygen_saturation' },
        { id: 'vital_weight' },
        { id: 'vital_height' },
        { id: 'vital_bmi' }
      ]
    }
  },
  { id: "vital_blood_pressure", label: "Blood Pressure", category: "Vitals", actions: { type: 'API_CALL', api_call_in_page: true, api: 'user/patient-info', oncallback_autofill_value: true }, call_time: { on_render_page: true, on_click_element: false }, autofill_after_value_get: true, depend_value_on_other: false, group_of: { group_auto_fill_input: false, api_group_available: false, model_group_available: false, group_autofill_ids: [] } },
  { id: "vital_heart_rate", label: "Heart Rate", category: "Vitals", actions: { type: 'API_CALL', api_call_in_page: true, api: 'user/patient-info', oncallback_autofill_value: true }, call_time: { on_render_page: true, on_click_element: false }, autofill_after_value_get: true, depend_value_on_other: false, group_of: { group_auto_fill_input: false, api_group_available: false, model_group_available: false, group_autofill_ids: [] } },
  { id: "vital_respiratory_rate", label: "Respiratory Rate", category: "Vitals", actions: { type: 'API_CALL', api_call_in_page: true, api: 'user/patient-info', oncallback_autofill_value: true }, call_time: { on_render_page: true, on_click_element: false }, autofill_after_value_get: true, depend_value_on_other: false, group_of: { group_auto_fill_input: false, api_group_available: false, model_group_available: false, group_autofill_ids: [] } },
  { id: "vital_pulse", label: "Pulse", category: "Vitals", actions: { type: 'API_CALL', api_call_in_page: true, api: 'user/patient-info', oncallback_autofill_value: true }, call_time: { on_render_page: true, on_click_element: false }, autofill_after_value_get: true, depend_value_on_other: false, group_of: { group_auto_fill_input: false, api_group_available: false, model_group_available: false, group_autofill_ids: [] } },
  { id: "vital_oxygen_saturation", label: "SP02(Oxygen Saturation)", category: "Vitals", actions: { type: 'API_CALL', api_call_in_page: true, api: 'user/patient-info', oncallback_autofill_value: true }, call_time: { on_render_page: true, on_click_element: false }, autofill_after_value_get: true, depend_value_on_other: false, group_of: { group_auto_fill_input: false, api_group_available: false, model_group_available: false, group_autofill_ids: [] } },
  { id: "vital_weight", label: "Weight", category: "Vitals", actions: { type: 'API_CALL', api_call_in_page: true, api: 'user/patient-info', oncallback_autofill_value: true }, call_time: { on_render_page: true, on_click_element: false }, autofill_after_value_get: true, depend_value_on_other: false, group_of: { group_auto_fill_input: false, api_group_available: false, model_group_available: false, group_autofill_ids: [] } },
  { id: "vital_height", label: "Height", category: "Vitals", actions: { type: 'API_CALL', api_call_in_page: true, api: 'user/patient-info', oncallback_autofill_value: true }, call_time: { on_render_page: true, on_click_element: false }, autofill_after_value_get: true, depend_value_on_other: false, group_of: { group_auto_fill_input: false, api_group_available: false, model_group_available: false, group_autofill_ids: [] } },
  { id: "vital_bmi", label: "BMI", category: "Vitals", actions: { type: 'API_CALL', api_call_in_page: true, api: 'user/patient-info', oncallback_autofill_value: true }, call_time: { on_render_page: true, on_click_element: false }, autofill_after_value_get: true, depend_value_on_other: false, group_of: { group_auto_fill_input: false, api_group_available: false, model_group_available: false, group_autofill_ids: [] } },

  // Physical Examination
  { id: "physical_examination_pulmonary", label: "Pulmonary", category: "Physical Examination", actions: { type: 'MODEL_OPEN', api_call_in_page: false, api: '', oncallback_autofill_value: true }, call_time: { on_render_page: false, on_click_element: true }, autofill_after_value_get: true, depend_value_on_other: false, group_of: { group_auto_fill_input: false, api_group_available: false, model_group_available: true, group_autofill_ids: [] } },
  { id: "physical_examination_cardiovascular", label: "Cardiovascular", category: "Physical Examination", actions: { type: 'MODEL_OPEN', api_call_in_page: false, api: '', oncallback_autofill_value: true }, call_time: { on_render_page: false, on_click_element: true }, autofill_after_value_get: true, depend_value_on_other: false, group_of: { group_auto_fill_input: false, api_group_available: false, model_group_available: true, group_autofill_ids: [] } },
  { id: "physical_examination_neurological", label: "Neurological", category: "Physical Examination", actions: { type: 'MODEL_OPEN', api_call_in_page: false, api: '', oncallback_autofill_value: true }, call_time: { on_render_page: false, on_click_element: true }, autofill_after_value_get: true, depend_value_on_other: false, group_of: { group_auto_fill_input: false, api_group_available: false, model_group_available: true, group_autofill_ids: [] } },
  { id: "physical_examination_abdominal", label: "Abdominal", category: "Physical Examination", actions: { type: 'MODEL_OPEN', api_call_in_page: false, api: '', oncallback_autofill_value: true }, call_time: { on_render_page: false, on_click_element: true }, autofill_after_value_get: true, depend_value_on_other: false, group_of: { group_auto_fill_input: false, api_group_available: false, model_group_available: true, group_autofill_ids: [] } },
  { id: "physical_examination_musculoskeletal", label: "Musculoskeletal", category: "Physical Examination", actions: { type: 'MODEL_OPEN', api_call_in_page: false, api: '', oncallback_autofill_value: true }, call_time: { on_render_page: false, on_click_element: true }, autofill_after_value_get: true, depend_value_on_other: false, group_of: { group_auto_fill_input: false, api_group_available: false, model_group_available: true, group_autofill_ids: [] } },
  { id: "physical_examination_skin", label: "Skin", category: "Physical Examination", actions: { type: 'MODEL_OPEN', api_call_in_page: false, api: '', oncallback_autofill_value: true }, call_time: { on_render_page: false, on_click_element: true }, autofill_after_value_get: true, depend_value_on_other: false, group_of: { group_auto_fill_input: false, api_group_available: false, model_group_available: true, group_autofill_ids: [] } },
  { id: "physical_examination_lymphatic", label: "Lymphatic", category: "Physical Examination", actions: { type: 'MODEL_OPEN', api_call_in_page: false, api: '', oncallback_autofill_value: true }, call_time: { on_render_page: false, on_click_element: true }, autofill_after_value_get: true, depend_value_on_other: false, group_of: { group_auto_fill_input: false, api_group_available: false, model_group_available: true, group_autofill_ids: [] } },
  { id: "physical_examination_genitourinary", label: "Genitourinary", category: "Physical Examination", actions: { type: 'MODEL_OPEN', api_call_in_page: false, api: '', oncallback_autofill_value: true }, call_time: { on_render_page: false, on_click_element: true }, autofill_after_value_get: true, depend_value_on_other: false, group_of: { group_auto_fill_input: false, api_group_available: false, model_group_available: true, group_autofill_ids: [] } },
  { id: "physical_examination_psychiatric", label: "Psychiatric", category: "Physical Examination", actions: { type: 'MODEL_OPEN', api_call_in_page: false, api: '', oncallback_autofill_value: true }, call_time: { on_render_page: false, on_click_element: true }, autofill_after_value_get: true, depend_value_on_other: false, group_of: { group_auto_fill_input: false, api_group_available: false, model_group_available: true, group_autofill_ids: [] } },
  { id: "physical_examination_head_and_neck", label: "Head and Neck", category: "Physical Examination", actions: { type: 'MODEL_OPEN', api_call_in_page: false, api: '', oncallback_autofill_value: true }, call_time: { on_render_page: false, on_click_element: true }, autofill_after_value_get: true, depend_value_on_other: false, group_of: { group_auto_fill_input: false, api_group_available: false, model_group_available: true, group_autofill_ids: [] } },
  { id: "physical_examination_eyes", label: "Eyes", category: "Physical Examination", actions: { type: 'MODEL_OPEN', api_call_in_page: false, api: '', oncallback_autofill_value: true }, call_time: { on_render_page: false, on_click_element: true }, autofill_after_value_get: true, depend_value_on_other: false, group_of: { group_auto_fill_input: false, api_group_available: false, model_group_available: true, group_autofill_ids: [] } },
  { id: "physical_examination_ears_nose_throat", label: "Ears, Nose, and Throat", category: "Physical Examination", actions: { type: 'MODEL_OPEN', api_call_in_page: false, api: '', oncallback_autofill_value: true }, call_time: { on_render_page: false, on_click_element: true }, autofill_after_value_get: true, depend_value_on_other: false, group_of: { group_auto_fill_input: false, api_group_available: false, model_group_available: true, group_autofill_ids: [] } },
  { id: "physical_examination_vital_signs", label: "Vital Signs", category: "Physical Examination", actions: { type: 'MODEL_OPEN', api_call_in_page: false, api: '', oncallback_autofill_value: true }, call_time: { on_render_page: false, on_click_element: true }, autofill_after_value_get: true, depend_value_on_other: false, group_of: { group_auto_fill_input: false, api_group_available: false, model_group_available: true, group_autofill_ids: [] } },

  // H AND P
  { id: "handp_drug_therapy", label: "Drug Therapy", category: "H AND P", actions: { type: 'API_CALL', api_call_in_page: true, api: 'user/get-history-physical', oncallback_autofill_value: true }, call_time: { on_render_page: true, on_click_element: false }, autofill_after_value_get: true, depend_value_on_other: false, group_of: { group_auto_fill_input: true, api_group_available: true, model_group_available: false, group_autofill_ids: [{ id: 'handp_drug_allergies' }] } },
  { id: "handp_drug_allergies", label: "Allergies", category: "H AND P", actions: { type: 'API_CALL', api_call_in_page: true, api: 'user/get-history-physical', oncallback_autofill_value: true }, call_time: { on_render_page: true, on_click_element: false }, autofill_after_value_get: true, depend_value_on_other: false, group_of: { group_auto_fill_input: false, api_group_available: false, model_group_available: false, group_autofill_ids: [] } },
  { id: "doctorList", label: "Doctor List", category: "Consultation", actions: { type: 'API_CALL', api_call_in_page: true, api: 'user/doctors', oncallback_autofill_value: true }, call_time: { on_render_page: true, on_click_element: false }, autofill_after_value_get: true, depend_value_on_other: false, group_of: { group_auto_fill_input: false, api_group_available: false, model_group_available: false, group_autofill_ids: [] } },

  // Login User Context
  { id: "login_user_name", label: "Doctor (Login User)", category: "Login User Context", actions: { type: 'CONTEXT_API', api_call_in_page: false, api: 'CALL_CONTEXT_GET_USER', oncallback_autofill_value: true }, call_time: { on_render_page: true, on_click_element: false }, autofill_after_value_get: true, depend_value_on_other: false, group_of: { group_auto_fill_input: false, api_group_available: false, model_group_available: false, group_autofill_ids: [] } },

  // Appointment
  { id: "addmission_date", label: "Addmission Date", category: "Addmission", actions: { type: 'API_CALL', api_call_in_page: true, api: 'user/get-addmission-date', oncallback_autofill_value: true }, call_time: { on_render_page: true, on_click_element: false }, autofill_after_value_get: true, depend_value_on_other: false, group_of: { group_auto_fill_input: false, api_group_available: false, model_group_available: false, group_autofill_ids: [] } },
  // Diagnosis & Assessment
  { id: "diagnosis_primary", label: "Primary Diagnosis", category: "Diagnosis", actions: { type: 'API_CALL', api_call_in_page: false, api: '', oncallback_autofill_value: false }, call_time: { on_render_page: false, on_click_element: false }, autofill_after_value_get: false, depend_value_on_other: false, group_of: { group_auto_fill_input: false, api_group_available: false, model_group_available: false, group_autofill_ids: [] } },
  { id: "diagnosis_differential", label: "Differential Diagnosis", category: "Diagnosis", actions: { type: 'API_CALL', api_call_in_page: false, api: '', oncallback_autofill_value: false }, call_time: { on_render_page: false, on_click_element: false }, autofill_after_value_get: false, depend_value_on_other: false, group_of: { group_auto_fill_input: false, api_group_available: false, model_group_available: false, group_autofill_ids: [] } },
  { id: "assessment_summary", label: "Assessment Summary", category: "Diagnosis", actions: { type: 'API_CALL', api_call_in_page: false, api: '', oncallback_autofill_value: false }, call_time: { on_render_page: false, on_click_element: false }, autofill_after_value_get: false, depend_value_on_other: false, group_of: { group_auto_fill_input: false, api_group_available: false, model_group_available: false, group_autofill_ids: [] } },

  // Plan & Treatment
  { id: "plan_medications", label: "Medications", category: "Plan", actions: { type: 'API_CALL', api_call_in_page: false, api: '', oncallback_autofill_value: false }, call_time: { on_render_page: false, on_click_element: false }, autofill_after_value_get: false, depend_value_on_other: false, group_of: { group_auto_fill_input: false, api_group_available: false, model_group_available: false, group_autofill_ids: [] } },
  { id: "plan_procedures", label: "Procedures", category: "Plan", actions: { type: 'API_CALL', api_call_in_page: false, api: '', oncallback_autofill_value: false }, call_time: { on_render_page: false, on_click_element: false }, autofill_after_value_get: false, depend_value_on_other: false, group_of: { group_auto_fill_input: false, api_group_available: false, model_group_available: false, group_autofill_ids: [] } },
  { id: "plan_followup", label: "Follow-up", category: "Plan", actions: { type: 'API_CALL', api_call_in_page: false, api: '', oncallback_autofill_value: false }, call_time: { on_render_page: false, on_click_element: false }, autofill_after_value_get: false, depend_value_on_other: false, group_of: { group_auto_fill_input: false, api_group_available: false, model_group_available: false, group_autofill_ids: [] } },
  { id: "plan_investigations", label: "Investigations", category: "Plan", actions: { type: 'API_CALL', api_call_in_page: false, api: '', oncallback_autofill_value: false }, call_time: { on_render_page: false, on_click_element: false }, autofill_after_value_get: false, depend_value_on_other: false, group_of: { group_auto_fill_input: false, api_group_available: false, model_group_available: false, group_autofill_ids: [] } },
  { id: "plan_referral", label: "Referral", category: "Plan", actions: { type: 'API_CALL', api_call_in_page: false, api: '', oncallback_autofill_value: false }, call_time: { on_render_page: false, on_click_element: false }, autofill_after_value_get: false, depend_value_on_other: false, group_of: { group_auto_fill_input: false, api_group_available: false, model_group_available: false, group_autofill_ids: [] } },

  // Consultation Details
  { id: "consult_date", label: "Consultation Date", category: "Consultation", actions: { type: 'API_CALL', api_call_in_page: false, api: '', oncallback_autofill_value: false }, call_time: { on_render_page: false, on_click_element: false }, autofill_after_value_get: false, depend_value_on_other: false, group_of: { group_auto_fill_input: false, api_group_available: false, model_group_available: false, group_autofill_ids: [] } },
  { id: "consult_time", label: "Consultation Time", category: "Consultation", actions: { type: 'API_CALL', api_call_in_page: false, api: '', oncallback_autofill_value: false }, call_time: { on_render_page: false, on_click_element: false }, autofill_after_value_get: false, depend_value_on_other: false, group_of: { group_auto_fill_input: false, api_group_available: false, model_group_available: false, group_autofill_ids: [] } },
  { id: "consult_provider", label: "Provider Name", category: "Consultation", actions: { type: 'API_CALL', api_call_in_page: false, api: '', oncallback_autofill_value: false }, call_time: { on_render_page: false, on_click_element: false }, autofill_after_value_get: false, depend_value_on_other: false, group_of: { group_auto_fill_input: false, api_group_available: false, model_group_available: false, group_autofill_ids: [] } },
  { id: "consult_location", label: "Location", category: "Consultation", actions: { type: 'API_CALL', api_call_in_page: false, api: '', oncallback_autofill_value: false }, call_time: { on_render_page: false, on_click_element: false }, autofill_after_value_get: false, depend_value_on_other: false, group_of: { group_auto_fill_input: false, api_group_available: false, model_group_available: false, group_autofill_ids: [] } },
  { id: "consult_type", label: "Consultation Type", category: "Consultation", actions: { type: 'API_CALL', api_call_in_page: false, api: '', oncallback_autofill_value: false }, call_time: { on_render_page: false, on_click_element: false }, autofill_after_value_get: false, depend_value_on_other: false, group_of: { group_auto_fill_input: false, api_group_available: false, model_group_available: false, group_autofill_ids: [] } },

  // History
  { id: "history_chief_complaint", label: "Chief Complaint", category: "History", actions: { type: 'API_CALL', api_call_in_page: false, api: '', oncallback_autofill_value: false }, call_time: { on_render_page: false, on_click_element: false }, autofill_after_value_get: false, depend_value_on_other: false, group_of: { group_auto_fill_input: false, api_group_available: false, model_group_available: false, group_autofill_ids: [] } },
  { id: "history_present_illness", label: "History of Present Illness", category: "History", actions: { type: 'API_CALL', api_call_in_page: false, api: '', oncallback_autofill_value: false }, call_time: { on_render_page: false, on_click_element: false }, autofill_after_value_get: false, depend_value_on_other: false, group_of: { group_auto_fill_input: false, api_group_available: false, model_group_available: false, group_autofill_ids: [] } },
  { id: "history_past_medical", label: "Past Medical History", category: "History", actions: { type: 'API_CALL', api_call_in_page: false, api: '', oncallback_autofill_value: false }, call_time: { on_render_page: false, on_click_element: false }, autofill_after_value_get: false, depend_value_on_other: false, group_of: { group_auto_fill_input: false, api_group_available: false, model_group_available: false, group_autofill_ids: [] } },
  { id: "history_medications", label: "Current Medications", category: "History", actions: { type: 'API_CALL', api_call_in_page: false, api: '', oncallback_autofill_value: false }, call_time: { on_render_page: false, on_click_element: false }, autofill_after_value_get: false, depend_value_on_other: false, group_of: { group_auto_fill_input: false, api_group_available: false, model_group_available: false, group_autofill_ids: [] } },
  { id: "history_allergies", label: "Allergies", category: "History", actions: { type: 'API_CALL', api_call_in_page: false, api: '', oncallback_autofill_value: false }, call_time: { on_render_page: false, on_click_element: false }, autofill_after_value_get: false, depend_value_on_other: false, group_of: { group_auto_fill_input: false, api_group_available: false, model_group_available: false, group_autofill_ids: [] } },
  { id: "history_social", label: "Social History", category: "History", actions: { type: 'API_CALL', api_call_in_page: false, api: '', oncallback_autofill_value: false }, call_time: { on_render_page: false, on_click_element: false }, autofill_after_value_get: false, depend_value_on_other: false, group_of: { group_auto_fill_input: false, api_group_available: false, model_group_available: false, group_autofill_ids: [] } },
  { id: "history_family", label: "Family History", category: "History", actions: { type: 'API_CALL', api_call_in_page: false, api: '', oncallback_autofill_value: false }, call_time: { on_render_page: false, on_click_element: false }, autofill_after_value_get: false, depend_value_on_other: false, group_of: { group_auto_fill_input: false, api_group_available: false, model_group_available: false, group_autofill_ids: [] } },
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
