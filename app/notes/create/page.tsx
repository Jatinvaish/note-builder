"use client"

import { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import { AppHeader } from "@/components/app-header"
import { NoteEditor } from "@/components/note-editor"
import { useToast } from "@/hooks/use-toast"
import { templateApi } from "@/services/template-api"
import { PREDEFINED_DATA_FIELDS } from "@/lib/predefined-data-fields"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

interface PhysicalExamSection {
  enabled: boolean
  findings: string[]
}

interface PhysicalExamConfig {
  pulmonary: PhysicalExamSection
  cardiovascular: PhysicalExamSection
  neurological: PhysicalExamSection
  abdominal: PhysicalExamSection
  musculoskeletal: PhysicalExamSection
  skin: PhysicalExamSection
  lymphatic: PhysicalExamSection
  genitourinary: PhysicalExamSection
  psychiatric: PhysicalExamSection
  headAndNeck: PhysicalExamSection
  eyes: PhysicalExamSection
  earsNoseThroat: PhysicalExamSection
  vitalSigns: PhysicalExamSection
}

interface PhysicalExamData {
  [key: string]: {
    [finding: string]: "normal" | "abnormal"
  }
}

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
  const [physicalExamData, setPhysicalExamData] = useState<PhysicalExamData>({})
  const [currentExamField, setCurrentExamField] = useState<string | null>(null)
  
  // Mock patient/admission IDs and user data - replace with actual values from context/props
  const patientId = 315
  const admissionId = 80
  const mockUser = { name: "Dr. John Doe", username: "johndoe" }
  const mockActivePatient = { patientId: 315, admissionId: 80 }

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
      if (!dataFieldConfig) continue

      const { actions, call_time } = dataFieldConfig

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

  const handleSavePhysicalExam = () => {
    if (!currentExamField) return
    const findings: string[] = []
    Object.entries(physicalExamData).forEach(([section, data]) => {
      Object.entries(data).forEach(([finding, status]) => {
        findings.push(`${finding} (${status})`)
      })
    })
    const summary = findings.join(', ')
    handleDataChange(currentExamField, summary)
    setShowPhysicalExamModal(false)
    setPhysicalExamData({})
    setCurrentExamField(null)
  }

  const getActivePhysicalExams = () => {
    if (!physicalExamConfig) return []
    const examLabels: Record<string, string> = {
      pulmonary: "Pulmonary",
      cardiovascular: "Cardiovascular",
      neurological: "Neurological",
      abdominal: "Abdominal",
      musculoskeletal: "Musculoskeletal",
      skin: "Skin",
      lymphatic: "Lymphatic",
      genitourinary: "Genitourinary",
      psychiatric: "Psychiatric",
      headAndNeck: "Head and Neck",
      eyes: "Eyes",
      earsNoseThroat: "Ears, Nose, and Throat",
      vitalSigns: "Vital Signs",
    }
    return Object.entries(physicalExamConfig)
      .filter(([_, data]) => data.enabled)
      .map(([key, data]) => ({
        id: key,
        label: examLabels[key] || key,
        findings: data.findings,
      }))
  }

  const handleVersionRestore = (version: any) => {
    setFormData(version.data)
  }

  const handleSave = async () => {
    if (!selectedTemplate) {
      toast({ title: "Error", description: "Please select a template", variant: "destructive" })
      return
    }

    try {
      const payload = {
        id: noteId,
        templateId: selectedTemplate.id,
        consultationType: "ipd",
        admissionId: admissionId,
        appointmentId: null,
        noteContent: selectedTemplate.templateContent,
        formData: formData,
        status: "active",
      }
      
      // Mock API call for ShadCN - replace with actual fetcher when backend is connected
      // const response = await fetcher({ path: "/api/custom-notes/save" }, { json: payload })
      // if (response?.note?.id) {
      //   setNoteId(response.note.id)
      // }
      
      // For now, save to localStorage with versioning
      const notes = JSON.parse(localStorage.getItem("notes") || "[]")
      let note = notes.find((n: any) => n.id === noteId)
      
      if (note) {
        // Update existing note with versioning
        const versionHistory = note.versionHistory || []
        versionHistory.push({
          version: versionHistory.length + 1,
          timestamp: new Date().toISOString(),
          data: note.consultationData,
          noteContent: note.noteContent,
          savedBy: mockUser.name,
        })
        
        note.consultationData = formData
        note.noteContent = selectedTemplate.templateContent
        note.versionHistory = versionHistory
        note.updatedAt = new Date().toISOString()
      } else {
        // Create new note
        const newNoteId = Date.now()
        note = {
          id: newNoteId,
          templateId: selectedTemplate.id,
          templateName: selectedTemplate.templateName,
          consultationType: "ipd",
          admissionId: admissionId,
          appointmentId: null,
          consultationData: formData,
          noteContent: selectedTemplate.templateContent,
          versionHistory: [],
          isActive: true,
          status: "active",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
        notes.push(note)
        setNoteId(newNoteId)
      }
      
      localStorage.setItem("notes", JSON.stringify(notes))
      toast({ title: "Success", description: "Note saved successfully" })
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

      <Dialog open={showPhysicalExamModal} onOpenChange={setShowPhysicalExamModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-teal-700">Physical Examination</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {physicalExamConfig && getActivePhysicalExams().length > 0 && (
              <Card>
                <CardContent className="pt-6">
                  <p className="text-sm font-bold text-gray-700 mb-3">Select Findings</p>
                  <div className="grid grid-cols-2 gap-3">
                    {getActivePhysicalExams().map((section) => (
                      <div
                        key={section.id}
                        className="bg-white p-3 rounded-md border border-gray-200"
                      >
                        <p className="font-semibold text-xs text-teal-600 mb-2">
                          {section.label}
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {section.findings.map((finding: string) => {
                            const status = physicalExamData[section.id]?.[finding]
                            let bgColor = "bg-white"
                            if (status === "normal") bgColor = "bg-green-50"
                            else if (status === "abnormal") bgColor = "bg-red-50"
                            return (
                              <Button
                                key={finding}
                                size="sm"
                                variant="outline"
                                className={`text-xs px-2 min-w-[50px] ${bgColor} ${
                                  status === "normal" ? "border-green-500 text-green-700" :
                                  status === "abnormal" ? "border-red-500 text-red-700" :
                                  "border-gray-300"
                                }`}
                                onClick={() => {
                                  let newStatus: "normal" | "abnormal" | undefined
                                  if (!status) newStatus = "normal"
                                  else if (status === "normal") newStatus = "abnormal"
                                  else newStatus = undefined
                                  setPhysicalExamData(prev => ({
                                    ...prev,
                                    [section.id]: {
                                      ...prev[section.id],
                                      ...(newStatus ? { [finding]: newStatus } :
                                        (() => {
                                          const { [finding]: removed, ...rest } = prev[section.id] || {}
                                          return rest
                                        })()
                                      ),
                                    },
                                  }))
                                }}
                              >
                                {finding}
                              </Button>
                            )
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => {
                setShowPhysicalExamModal(false)
                setPhysicalExamData({})
                setCurrentExamField(null)
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleSavePhysicalExam}>
              Apply Findings
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
