"use client"

import { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import { AppHeader } from "@/components/app-header"
import { NoteEditor } from "@/components/note-editor"
import { useToast } from "@/hooks/use-toast"
import { templateApi } from "@/services/template-api"
import { consultationNoteApi } from "@/services/consultation-note-api"
import { PREDEFINED_DATA_FIELDS } from "@/lib/predefined-data-fields"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { PhysicalExaminationModal, PhysicalExamConfig } from "@/components/physical-examination-modal"



const extractFormElements = (content: any): any[] => {
  const elements: any[] = []
  const traverse = (node: any) => {
    if (node.type === "formElement" && node.attrs) {
      elements.push({
        elementKey: node.attrs.elementKey || "",
        elementType: node.attrs.elementType || "input",
        label: node.attrs.label || "Field",
        dataField: node.attrs.dataField || "",
        defaultDatetime: node.attrs.defaultDatetime || "",
        defaultValue: node.attrs.defaultValue || "",
      })
    }
    if (Array.isArray(node.content)) {
      node.content.forEach(traverse)
    }
  }
  if (content) traverse(content)
  return elements
}

export default function CreateNotePage() {
  const router = useRouter()
  const { toast } = useToast()
  const [templates, setTemplates] = useState<any[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null)
  const [noteId, setNoteId] = useState<number | null>(null)
  const [formData, setFormData] = useState<Record<string, any>>({})
  const [loading, setLoading] = useState(true)
  const [showPhysicalExamModal, setShowPhysicalExamModal] = useState(false)
  const [physicalExamConfig, setPhysicalExamConfig] = useState<PhysicalExamConfig | null>(null)
  const [currentExamField, setCurrentExamField] = useState<string | null>(null)

  // Mock patient/admission IDs and user data - replace with actual values from context/props
  const admissionId = 76
  const mockUser = { name: "Dr. John Doe", username: "johndoe" }
  const mockActivePatient = { patientId: 319, admissionId: 76 }

  useEffect(() => {
    const loadTemplates = async () => {
      try {
        const data = await templateApi.listActive()
        setTemplates(Array.isArray(data) ? data : [])
      } catch (error) {
        toast({ title: "Error", description: "Failed to load templates", variant: "destructive" })
      } finally {
        setLoading(false)
      }
    }
    loadTemplates()
  }, [])

  const handleTemplateSelect = async (templateId: string) => {
    const template = templates.find((t) => t.id.toString() === templateId)
    if (!template) return

    try {
      const fullTemplate = await templateApi.view(template.id)
      setSelectedTemplate(fullTemplate)

      // Extract form elements and auto-fill
      const elements = extractFormElements(fullTemplate.templateContent)

      // Initialize form data with smart defaults
      const initialData: Record<string, any> = {}
      elements.forEach((el) => {
        if (el.elementType === "checkbox") {
          initialData[el.elementKey] = el.defaultValue === true || el.defaultValue === "true"
        } else if (el.elementType === "datetime") {
          if (el.defaultDatetime === "now") {
            initialData[el.elementKey] = new Date().toISOString()
          } else if (el.defaultDatetime === "today") {
            const today = new Date()
            today.setHours(0, 0, 0, 0)
            initialData[el.elementKey] = today.toISOString()
          } else if (el.defaultValue) {
            initialData[el.elementKey] = el.defaultValue
          } else {
            initialData[el.elementKey] = ""
          }
        } else {
          initialData[el.elementKey] = el.defaultValue || ""
        }
      })

      // Auto-fill data from enhanced fields (static data for ShadCN)
      try {
        const autoFilledData = await autoFillFromEnhancedFields(elements)
        setFormData({ ...initialData, ...autoFilledData })
      } catch (error) {
        console.error("Auto-fill error:", error)
        setFormData(initialData)
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to load template", variant: "destructive" })
    }
  }

  const autoFillFromEnhancedFields = async (elements: any[]): Promise<Record<string, any>> => {
    const filledData: Record<string, any> = {}

    // Static mock data for ShadCN UI (no real API calls)
    const mockPatientData = {
      patientName: "John Doe",
      patientAge: "45",
      patientDob: new Date("1979-01-15").toISOString(),
      patientGender: "Male",
      patientMrn: "MRN12345",
      patientPhone: "1234567890",
      patientEmail: "john.doe@example.com",
      latestVitals: {
        temperature: "98.6",
        bloodPressure: "120/80",
        heartRate: "72",
        respiratoryRate: "16",
        pulse: "72",
        spo2: "98",
        weight: "70",
        height: "175",
        bmi: "22.9"
      }
    }

    for (const element of elements) {
      if (!element.dataField) continue

      const dataFieldConfig = PREDEFINED_DATA_FIELDS.find(f => f.id === element.dataField)
      if (!dataFieldConfig || !('actions' in dataFieldConfig)) continue

      const { actions, call_time } = dataFieldConfig as any

      // Handle API_CALL on render (using mock data)
      if (actions.type === 'API_CALL' && call_time.on_render_page) {
        if (element.dataField === 'patient_name') filledData[element.elementKey] = mockPatientData.patientName
        else if (element.dataField === 'patient_age') filledData[element.elementKey] = mockPatientData.patientAge
        else if (element.dataField === 'patient_dob') filledData[element.elementKey] = mockPatientData.patientDob.slice(0, 16)
        else if (element.dataField === 'patient_gender') filledData[element.elementKey] = mockPatientData.patientGender
        else if (element.dataField === 'patient_mrn') filledData[element.elementKey] = mockPatientData.patientMrn
        else if (element.dataField === 'patient_phone') filledData[element.elementKey] = mockPatientData.patientPhone
        else if (element.dataField === 'patient_email') filledData[element.elementKey] = mockPatientData.patientEmail
        // Vitals
        else if (element.dataField === 'vital_temperature') filledData[element.elementKey] = mockPatientData.latestVitals.temperature
        else if (element.dataField === 'vital_blood_pressure') filledData[element.elementKey] = mockPatientData.latestVitals.bloodPressure
        else if (element.dataField === 'vital_heart_rate') filledData[element.elementKey] = mockPatientData.latestVitals.heartRate
        else if (element.dataField === 'vital_respiratory_rate') filledData[element.elementKey] = mockPatientData.latestVitals.respiratoryRate
        else if (element.dataField === 'vital_pulse') filledData[element.elementKey] = mockPatientData.latestVitals.pulse
        else if (element.dataField === 'vital_oxygen_saturation') filledData[element.elementKey] = mockPatientData.latestVitals.spo2
        else if (element.dataField === 'vital_weight') filledData[element.elementKey] = mockPatientData.latestVitals.weight
        else if (element.dataField === 'vital_height') filledData[element.elementKey] = mockPatientData.latestVitals.height
        else if (element.dataField === 'vital_bmi') filledData[element.elementKey] = mockPatientData.latestVitals.bmi
      }
      // Handle CONTEXT_API on render
      else if (actions.type === 'CONTEXT_API' && call_time.on_render_page) {
        if (element.dataField === 'login_user_name') {
          filledData[element.elementKey] = mockUser.name
        }
      }
      // Handle appointment date (mock)
      else if (element.dataField === 'appointment_date' && actions.type === 'API_CALL' && call_time.on_render_page) {
        filledData[element.elementKey] = new Date().toISOString().slice(0, 16)
      }
    }

    return filledData
  }

  const handleDataChange = (key: string, value: any) => {
    setFormData((prev) => ({ ...prev, [key]: value }))
  }

  const handlePhysicalExamClick = (fieldId: string) => {
    setCurrentExamField(fieldId)
    // Mock physical exam config
    if (!physicalExamConfig) {
      setPhysicalExamConfig({
        pulmonary: { enabled: true, findings: ["Breath sounds nl", "Wheezes", "Stridor", "Crackles", "Rhonchi"] },
        cardiovascular: { enabled: true, findings: ["Normal rate", "Heart sounds nl", "Regular rhythm", "Murmur", "Gallop"] },
        neurological: { enabled: true, findings: ["Oriented x3", "No focal deficit", "Reflexes nl", "Cranial nerves intact"] },
        abdominal: { enabled: true, findings: ["Guarding", "Tenderness", "Bowel sounds nl", "Soft", "Non-distended"] },
        musculoskeletal: { enabled: true, findings: ["Normal range of motion", "No deformities", "No swelling", "No tenderness", "Strength nl"] },
        skin: { enabled: true, findings: ["No rashes", "No lesions", "No ulcers", "No cyanosis", "No pallor"] },
        lymphatic: { enabled: true, findings: ["No lymphadenopathy", "No swelling", "No tenderness"] },
        genitourinary: { enabled: true, findings: ["No abnormalities", "No tenderness", "No masses"] },
        psychiatric: { enabled: true, findings: ["No abnormalities", "No mood swings", "No hallucinations"] },
        headAndNeck: { enabled: true, findings: ["No abnormalities", "No tenderness", "No masses"] },
        eyes: { enabled: true, findings: ["No abnormalities", "No redness", "No discharge", "Pupils equal and reactive"] },
        earsNoseThroat: { enabled: true, findings: ["No abnormalities", "No tenderness", "No masses"] },
        vitalSigns: { enabled: true, findings: ["Blood pressure nl", "Heart rate nl", "Respiratory rate nl", "Temperature nl", "Oxygen saturation nl"] },
      })
    }
    setShowPhysicalExamModal(true)
  }

  const handleSavePhysicalExam = (mappedResults: Record<string, string>, unmappedResults: string[]) => {
    if (!currentExamField) return

    // Map of Section Label (from modal) to Predefined Data Field ID/Label fragment
    const sectionToDataFieldMap: Record<string, string> = {
      "Pulmonary": "physical_examination_pulmonary",
      "Cardiovascular": "physical_examination_cardiovascular",
      "Neurological": "physical_examination_neurological",
      "Abdominal": "physical_examination_abdominal",
      "Musculoskeletal": "physical_examination_musculoskeletal",
      "Skin": "physical_examination_skin",
      "Lymphatic": "physical_examination_lymphatic",
      "Genitourinary": "physical_examination_genitourinary",
      "Psychiatric": "physical_examination_psychiatric",
      "Head and Neck": "physical_examination_head_and_neck",
      "Eyes": "physical_examination_eyes",
      "Ears, Nose, and Throat": "physical_examination_ears_nose_throat",
      "Vital Signs": "physical_examination_vital_signs",
    }

    const sectionAliases: Record<string, string[]> = {
      "Pulmonary": ["pulmonary", "respiratory", "rs", "chest", "lungs", "breathing", "respiratory system"],
      "Cardiovascular": ["cardiovascular", "cardio", "cvs", "heart", "cardauc", "cardiovascular system", "circulatory"],
      "Neurological": ["neurological", "neuro", "cns", "nervous system"],
      "Abdominal": ["abdominal", "abdomen", "abd", "gi", "gastrointestinal"],
      "Musculoskeletal": ["musculoskeletal", "msk", "skeletal", "muscle", "bones", "joints", "spine", "extremities"],
      "Skin": ["skin", "integumentary", "derma"],
      "Lymphatic": ["lymphatic", "lymph", "nodes"],
      "Genitourinary": ["genitourinary", "gu", "genital", "urinary"],
      "Psychiatric": ["psychiatric", "psych", "mental"],
      "Head and Neck": ["head and neck", "head & neck", "heent", "neck", "head"],
      "Eyes": ["eyes", "vision", "ophthalmic"],
      "Ears, Nose, and Throat": ["ears, nose, and throat", "ent", "ears", "nose", "throat"],
      "Vital Signs": ["vital signs", "vitals"],
    }

    // We need current form elements to find matches. 
    // ShadCN implementation extracts elements when template is selected but doesn't seem to persist them in state clearly besides the initial extract.
    // However, looking at the code, `extractFormElements` is called inside `handleTemplateSelect`.
    // But we don't have `formElements` in state? 
    // Ah, wait. Lines 104-126 extract elements to build initial data. 
    // We need to re-extract or store them to do the matching. 
    // Let's modify the component state to store formElements.

    // Actually, simple fix: if we don't have them in state, we can re-extract from `selectedTemplate.templateContent`.
    if (!selectedTemplate) return
    const currentElements = extractFormElements(selectedTemplate.templateContent)

    // Apply mapped results to matching fields
    Object.entries(mappedResults).forEach(([sectionLabel, summary]) => {
      // 1. Try to find by DataField ID first (most accurate)
      const dataFieldId = sectionToDataFieldMap[sectionLabel];
      let matchingElement = currentElements.find((el: any) => el.dataField === dataFieldId);

      // 2. If not found, try robust label matching
      if (!matchingElement) {
        const normalizedSection = sectionLabel.toLowerCase().trim();
        const aliases = (sectionAliases[sectionLabel] || [normalizedSection]).map(a => a.toLowerCase());
        if (!aliases.includes(normalizedSection)) aliases.push(normalizedSection);

        matchingElement = currentElements.find((el: any) => {
          const elLabel = el.label.toLowerCase().replace(':', '').replace(/\./g, '').trim()
          return aliases.some(alias =>
            elLabel === alias ||
            elLabel.split(/[\s/]+/).includes(alias) ||
            (alias.length > 3 && elLabel.includes(alias))
          )
        })
      }

      if (matchingElement) {
        handleDataChange(matchingElement.elementKey, summary)
      } else {
        // If matched field not found, treat as unmapped
        unmappedResults.push(`${sectionLabel}: ${summary}`)
      }
    })

    if (unmappedResults.length > 0) {
      const existing = formData[currentExamField] ? formData[currentExamField] + "; " : ""
      handleDataChange(currentExamField, existing + unmappedResults.join('; '))
    }

    setShowPhysicalExamModal(false)
    setCurrentExamField(null)
  }

  // Helper removed as it's now internal to the Modal component, 
  // BUT we need to pass the config to the modal. 
  // And we initialize the config in `handlePhysicalExamClick`.
  // So we keep `physicalExamConfig` state.
  // The helper `getActivePhysicalExams` was used for rendering the inline modal, so it is no longer needed here.


  const handleVersionRestore = (version: any) => {
    setFormData(version.consultationData || version.data)
  }

  const handleSave = async (editorContent: any) => {
    if (!selectedTemplate) {
      toast({ title: "Error", description: "Please select a template", variant: "destructive" })
      return
    }

    try {
      const isUpdate = !!noteId
      const payload = {
        id: noteId,
        templateId: selectedTemplate.id,
        consultationType: "ipd",
        admissionId: admissionId,
        appointmentId: null,
        noteContent: editorContent, // Use actual editor content, not template
        formData: formData,
        status: "active",
      }

      const response = await consultationNoteApi.save(payload)
      if (response?.id) {
        setNoteId(response.id)
      }

      toast({
        title: "Success",
        description: isUpdate ? "Note updated successfully" : "Note saved successfully"
      })
    } catch (error) {
      console.error("Save error:", error)
      toast({ title: "Error", description: "Failed to save note", variant: "destructive" })
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Loading...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col">
      <AppHeader />
      <div className="flex-1">
        <NoteEditor
          templates={templates}
          selectedTemplate={selectedTemplate}
          formData={formData}
          onTemplateSelect={handleTemplateSelect}
          onDataChange={handleDataChange}
          onSave={handleSave}
          versionHistory={[]}
          onVersionRestore={handleVersionRestore}
          onPhysicalExamClick={handlePhysicalExamClick}
        />
      </div>

      <PhysicalExaminationModal
        isOpen={showPhysicalExamModal}
        onClose={() => {
          setShowPhysicalExamModal(false)
          setCurrentExamField(null)
        }}
        onSave={handleSavePhysicalExam}
        config={physicalExamConfig}
      />
    </div>
  )
}
