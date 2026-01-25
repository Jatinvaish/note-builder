# System Architecture Diagram

## Authentication Flow
```
┌─────────────────────────────────────────────────────────────────┐
│                        User Sign In                              │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│  app/sign-in/page.tsx                                            │
│  - Email/Password Input                                          │
│  - Form Submission                                               │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│  lib/fetcher.ts                                                  │
│  - getFingerprint() → FingerprintJS                              │
│  - POST /auth/login                                              │
│  - Headers: X-Fingerprint                                        │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│  Backend API                                                     │
│  - Validate credentials                                          │
│  - Return { success, token, user }                               │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│  lib/fetcher.ts                                                  │
│  - encrypt(token) → AES encryption                               │
│  - localStorage.setItem("authToken", encrypted)                  │
│  - encrypt(JSON.stringify(user))                                 │
│  - localStorage.setItem("userData", encrypted)                   │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│  lib/auth-context.tsx                                            │
│  - AuthProvider detects token                                    │
│  - Sets isAuthenticated = true                                   │
│  - Allows access to protected routes                             │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│  app/notes/page.tsx                                              │
│  - User sees notes list                                          │
│  - AppHeader shows with logout button                            │
└─────────────────────────────────────────────────────────────────┘
```

## Auto-Fill Flow
```
┌─────────────────────────────────────────────────────────────────┐
│  User Clicks "New Note"                                          │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│  app/notes/create/page.tsx                                       │
│  - Renders AddNoteForm                                           │
│  - Passes patientId, admissionId                                 │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│  components/add-note-form.tsx                                    │
│  - Fetches templates from API                                    │
│  - Shows template dropdown                                       │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│  User Selects Template                                           │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│  components/add-note-form.tsx                                    │
│  - extractFormElements(templateContent)                          │
│  - Parses template for placeholders                              │
│  - Detects field labels (name, age, pulse, etc.)                 │
│  - Maps to dataFieldKey                                          │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│  lib/auto-fill-service.ts                                        │
│  - new AutoFillService()                                         │
│  - autoFillFormElements(elements, patientId, admissionId)        │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│  lib/data-field-api.ts                                           │
│  - fetchPatientData(patientId, admissionId)                      │
│  - POST /user/patient-info                                       │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│  Backend API                                                     │
│  - Returns patient data                                          │
│  - { patientName, patientDob, patientGender, latestVitals }     │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│  lib/data-field-api.ts                                           │
│  - normalizePatientData(raw, admissionId)                        │
│  - Calculate age from DOB                                        │
│  - Parse vitals JSON                                             │
│  - Return { patient: {...}, vitals: {...} }                      │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│  lib/auto-fill-service.ts                                        │
│  - Loop through elements                                         │
│  - Find fieldConfig from DATA_FIELD_REGISTRY                     │
│  - If autoFill enabled, get value from apiSource path            │
│  - Build filledData object                                       │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│  components/add-note-form.tsx                                    │
│  - setFormData(autoFilledData)                                   │
│  - Form fields populate with patient data                        │
│  - User sees pre-filled form                                     │
└─────────────────────────────────────────────────────────────────┘
```

## Voice Input Flow
```
┌─────────────────────────────────────────────────────────────────┐
│  User Clicks *** Field                                           │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│  components/add-note-form.tsx                                    │
│  - startRecording(fieldId)                                       │
│  - navigator.mediaDevices.getUserMedia({ audio: true })          │
│  - new MediaRecorder(stream)                                     │
│  - recorder.start()                                              │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│  User Speaks → Microphone Records                                │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│  User Clicks "Stop Recording"                                    │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│  components/add-note-form.tsx                                    │
│  - stopRecording()                                               │
│  - recorder.stop()                                               │
│  - Create Blob from audio chunks                                 │
│  - Convert to base64                                             │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│  lib/fetcher.ts                                                  │
│  - POST /user/speech-to-text                                     │
│  - Body: { audioBase64: "..." }                                  │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│  Backend API                                                     │
│  - Process audio with speech recognition                         │
│  - Return { success: true, text: "transcribed text" }            │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│  components/add-note-form.tsx                                    │
│  - handleInputChange(fieldId, transcribedText)                   │
│  - Field updates with transcribed text                           │
└─────────────────────────────────────────────────────────────────┘
```

## Save Note Flow
```
┌─────────────────────────────────────────────────────────────────┐
│  User Fills Form & Clicks "Save Note"                            │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│  components/add-note-form.tsx                                    │
│  - handleSave()                                                  │
│  - Validate template selected                                    │
│  - Prepare payload                                               │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│  lib/fetcher.ts                                                  │
│  - POST /user/add-ipd-note                                       │
│  - Headers: Authorization: Bearer <token>                        │
│  - Body: {                                                       │
│      patientId,                                                  │
│      admissionId,                                                │
│      templateId,                                                 │
│      templateName,                                               │
│      templateContent,                                            │
│      formData                                                    │
│    }                                                             │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│  Backend API                                                     │
│  - Validate token                                                │
│  - Save note to database                                         │
│  - Return { success: true }                                      │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│  components/add-note-form.tsx                                    │
│  - Show success toast                                            │
│  - Clear form                                                    │
│  - Call onSave() callback                                        │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│  app/notes/create/page.tsx                                       │
│  - router.push("/notes")                                         │
│  - Redirect to notes list                                        │
└─────────────────────────────────────────────────────────────────┘
```

## Component Hierarchy
```
app/layout.tsx
├── AuthProvider (lib/auth-context.tsx)
│   ├── Checks localStorage for authToken
│   ├── Validates authentication
│   └── Protects routes
│
├── app/sign-in/page.tsx
│   └── Login form (public route)
│
├── app/notes/page.tsx
│   ├── AppHeader (components/app-header.tsx)
│   │   ├── Navigation links
│   │   ├── User info
│   │   └── Logout button
│   └── Notes list
│
└── app/notes/create/page.tsx
    ├── AppHeader (components/app-header.tsx)
    └── AddNoteForm (components/add-note-form.tsx)
        ├── Template dropdown
        ├── Auto-fill logic
        │   ├── AutoFillService (lib/auto-fill-service.ts)
        │   │   └── DataFieldAPI (lib/data-field-api.ts)
        │   │       └── DATA_FIELD_REGISTRY (lib/data-field-registry.ts)
        │   └── Form field rendering
        ├── Voice input
        └── Save/Cancel buttons
```

## Data Structure
```
localStorage (encrypted)
├── authToken: "encrypted_jwt_token"
└── userData: "encrypted_user_object"

FormData Structure
{
  "field_0_0": "John Doe",        // Patient name
  "field_0_1": "45",              // Age
  "field_1_0": "Male",            // Gender
  "field_2_0": "IPD12345",        // IPD number
  "field_3_0": "98.6",            // Temperature
  "field_3_1": "72",              // Pulse
  "recording_5_0": "Patient complains of chest pain..."
}

DATA_FIELD_REGISTRY
[
  {
    key: "patientName",
    label: "Patient Name",
    category: "Patient Info",
    apiSource: "patient.patientName",
    autoFill: true
  },
  ...
]

Normalized Patient Data
{
  patient: {
    patientName: "John Doe",
    age: "45",
    patientGender: "Male",
    ipdNo: "IPD12345"
  },
  vitals: {
    temperature: "98.6",
    pulse: "72",
    bp: "120/80",
    spo2: "98",
    weight: "70"
  }
}
```

## Security Layers
```
┌─────────────────────────────────────────────────────────────────┐
│  Layer 1: Browser Fingerprinting                                │
│  - FingerprintJS generates unique browser ID                     │
│  - Sent with every API request                                   │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│  Layer 2: AES Encryption                                         │
│  - Token encrypted before localStorage                           │
│  - User data encrypted before localStorage                       │
│  - ENCRYPTION_KEY from environment                               │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│  Layer 3: JWT Token                                              │
│  - Bearer token in Authorization header                          │
│  - Server validates token                                        │
│  - Expires after configured time                                 │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│  Layer 4: Route Protection                                       │
│  - AuthProvider checks authentication                            │
│  - Redirects to /sign-in if not authenticated                    │
│  - 401 responses trigger automatic logout                        │
└─────────────────────────────────────────────────────────────────┘
```
