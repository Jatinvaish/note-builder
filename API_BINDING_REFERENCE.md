# Data Binding & API Reference

## Data Binding Configuration

### Element-Level Binding

Each form element can have optional data binding:

\`\`\`typescript
interface DataBinding {
  type: "manual" | "api"
  source?: string        // e.g., "appointment.appointmentDate"
  apiEndpoint?: string   // e.g., "/api/appointments/{appointmentId}"
  fallbackValue?: string // fallback if API fails
}
\`\`\`

### Configuration Examples

#### 1. Auto-fill from Appointment Date
\`\`\`json
{
  "type": "api",
  "source": "appointment.appointmentDate",
  "apiEndpoint": "/api/appointments/{appointmentId}",
  "fallbackValue": ""
}
\`\`\`

#### 2. Patient Name with Fallback
\`\`\`json
{
  "type": "api",
  "source": "patient.fullName",
  "apiEndpoint": "/api/patients/{patientId}",
  "fallbackValue": "Patient Name"
}
\`\`\`

#### 3. Manual Entry (No Auto-fill)
\`\`\`json
{
  "type": "manual",
  "fallbackValue": ""
}
\`\`\`

---

## Binding Service API

### Usage in Components

\`\`\`typescript
import { getBindingResolver } from "@/lib/binding-service"
import type { ClinicalContext } from "@/lib/types"

const resolver = getBindingResolver()

// Resolve a binding for an element
const value = await resolver.resolveBinding(dataBinding, clinicalContext)

// Get all fields for an element
const fields = resolver.getAvailableFields("appointment")
\`\`\`

### Clinical Context Structure

\`\`\`typescript
interface ClinicalContext {
  appointmentDate?: string
  admissionDate?: string
  patientId?: string
  clinicianId?: string
  [key: string]: any // Custom fields
}
\`\`\`

### Mock Implementations

The binding service provides mock implementations for development:

\`\`\`typescript
// Mock appointment data
{
  appointmentId: "apt-001",
  appointmentDate: "2025-01-20",
  time: "10:00 AM",
  clinician: "Dr. Smith"
}

// Mock patient data
{
  patientId: "pat-001",
  fullName: "John Doe",
  dateOfBirth: "1990-01-01",
  contact: "+1-555-0123"
}

// Mock admission data
{
  admissionId: "adm-001",
  admissionDate: "2025-01-15",
  ward: "ICU-2",
  reason: "Emergency"
}
\`\`\`

---

## Element Properties Panel

### Configuring Binding for an Element

In the Element Properties Panel (right side, Properties tab):

1. **Data Properties Section**
   - Type: select "api" or "manual"
   - Source: e.g., "appointment.appointmentDate"
   - API Endpoint: e.g., "/api/appointments/{appointmentId}"
   - Fallback Value: default text if API fails

2. **Testing Binding**
   - Save element properties
   - Go to Preview tab to see resolved value
   - Check group-wise preview for auto-filled data

---

## API Endpoint Integration

### Expected Endpoint Responses

#### Appointment API
\`\`\`bash
GET /api/appointments/{appointmentId}
\`\`\`
Response:
\`\`\`json
{
  "id": "apt-001",
  "appointmentDate": "2025-01-20",
  "time": "10:00 AM",
  "clinician": "Dr. Smith"
}
\`\`\`

#### Patient API
\`\`\`bash
GET /api/patients/{patientId}
\`\`\`
Response:
\`\`\`json
{
  "id": "pat-001",
  "fullName": "John Doe",
  "dateOfBirth": "1990-01-01",
  "contact": "+1-555-0123"
}
\`\`\`

#### Admission API
\`\`\`bash
GET /api/admissions/{admissionId}
\`\`\`
Response:
\`\`\`json
{
  "id": "adm-001",
  "admissionDate": "2025-01-15",
  "ward": "ICU-2",
  "reason": "Emergency"
}
\`\`\`

---

## Notes Page Integration

### Resolving Bindings on Notes Page

When a user opens a note with a specific template version:

\`\`\`typescript
// Get template version snapshot
const template = getTemplateVersion(templateId, versionId)

// Create clinical context from note metadata
const context: ClinicalContext = {
  appointmentDate: note.appointmentDate,
  patientId: note.patientId,
  // ... other fields
}

// Resolve all element bindings
const bindingResolver = getBindingResolver()
for (const element of template.elements) {
  if (element.data_binding) {
    const value = await bindingResolver.resolveBinding(
      element.data_binding,
      context
    )
    noteData[element.elementKey] = value
  }
}
\`\`\`

---

## Error Handling

### Binding Resolution Errors

The service handles:
- ✅ Missing API endpoint → use fallbackValue
- ✅ API timeout (>5s) → use fallbackValue
- ✅ Network offline → use fallbackValue
- ✅ Invalid JSON response → use fallbackValue
- ✅ Missing clinicalContext field → use fallbackValue

### Safe Defaults

All errors are handled gracefully:
\`\`\`typescript
try {
  const value = await resolveBinding(binding, context)
} catch (error) {
  // Never throws - always returns fallback
  // Error logged to console for debugging
  return binding.fallbackValue || ""
}
\`\`\`

---

## Mode Options

### readOnlyAutoFill (Recommended)
- Element value auto-filled from API
- User **cannot edit** the field
- Ensures data consistency
- Best for: appointment dates, patient names

### initialDefaultEditable
- Element value **initially** from API
- User **can edit** the value
- Allows overrides when needed
- Best for: pre-filled suggestions

---

## Testing Binding Configuration

### In Template Editor Preview

1. Create an element with binding
2. Go to **Right Panel → Preview Tab**
3. See group-wise preview with resolved value
4. Try different clinical context values

### In Notes Page

1. Open existing note (with template version pinned)
2. Bindings auto-resolve on page load
3. User can edit auto-filled values (initialDefaultEditable mode)
4. Changes reflected in real-time

---

## Debugging

### Enable Binding Debug Logs

\`\`\`typescript
// In template-renderer.tsx or notes page
const bindingResolver = getBindingResolver()
// Logs appear in browser console
\`\`\`

### Common Issues

| Issue | Solution |
|-------|----------|
| Binding not resolving | Check clinical context has required field |
| Fallback always showing | Check API endpoint URL format |
| Stale data | Clear browser cache, reload |
| Field not appearing | Ensure label is set (required) |

---

## Best Practices

1. **Always set a fallbackValue** - graceful degradation
2. **Test with mock data first** - before connecting real APIs
3. **Use initialDefaultEditable for suggestions** - let users override
4. **Group related fields together** - improves UX
5. **Document binding sources** - helps team understand template
