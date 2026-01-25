# Quick Reference - Authentication & Auto-Fill

## Environment Variables (.env.local)
```
NEXT_PUBLIC_API_BASE_URL=http://localhost:8080/api
NEXT_PUBLIC_ENCRYPTION_KEY=your-secret-encryption-key-32-chars
```

## Key Functions

### Authentication (lib/fetcher.ts)
```typescript
setAuthToken(token)      // Save encrypted token to localStorage
getAuthToken()           // Get decrypted token
clearAuthToken()         // Remove token
setUserData(data)        // Save encrypted user data
getUserData()            // Get decrypted user data
clearUserData()          // Remove user data
```

### Auto-Fill (lib/auto-fill-service.ts)
```typescript
const service = new AutoFillService()
const filledData = await service.autoFillFormElements(elements, patientId, admissionId)
```

### Auth Context (lib/auth-context.tsx)
```typescript
const { isAuthenticated, user, logout } = useAuth()
```

## Data Field Mapping

| Field Label | Data Field Key | API Source |
|------------|----------------|------------|
| name | patientName | patient.patientName |
| age | patientAge | patient.age |
| gender/sex | patientGender | patient.patientGender |
| ipd | ipdNo | patient.ipdNo |
| temperature | temperature | vitals.temperature |
| pulse | pulse | vitals.pulse |
| bp | bloodPressure | vitals.bp |
| spo2 | spo2 | vitals.spo2 |
| weight | weight | vitals.weight |

## Template Markers

- `★placeholder★` or `___` - Text input field
- `***` - Voice recording field
- `☐` - Checkbox

## API Endpoints

### Login
```
POST /auth/login
Body: { email, password }
Response: { success: true, token: "...", user: {...} }
```

### Patient Info
```
POST /user/patient-info
Body: { id: patientId }
Response: { success: true, data: { patientName, patientDob, patientGender, latestVitals } }
```

### Templates
```
POST /user/get-ipd-templates
Body: {}
Response: { success: true, data: [{ id, templateName, templateContent }] }
```

### Save Note
```
POST /user/add-ipd-note
Body: { patientId, admissionId, templateId, templateName, templateContent, formData }
Response: { success: true }
```

### Speech-to-Text
```
POST /user/speech-to-text
Body: { audioBase64: "..." }
Response: { success: true, text: "..." }
```

## Component Usage

### AddNoteForm
```tsx
<AddNoteForm
  patientId={1}
  admissionId={1}
  onSave={() => router.push("/notes")}
  onCancel={() => router.push("/notes")}
/>
```

### AppHeader
```tsx
<AppHeader />  // Automatically shows if authenticated
```

## Storage Keys (localStorage)

- `authToken` - Encrypted JWT token
- `userData` - Encrypted user object

## Common Tasks

### Add New Data Field
1. Add to `DATA_FIELD_REGISTRY` in `lib/data-field-registry.ts`
2. Update normalization in `lib/data-field-api.ts` if needed

### Protect New Route
- Wrap in AuthProvider (already done in layout.tsx)
- Add AppHeader component to page

### Debug Auto-Fill
1. Check browser console for errors
2. Verify API response format
3. Check DATA_FIELD_REGISTRY configuration
4. Test with console.log in AutoFillService

### Debug Authentication
1. Check localStorage for authToken and userData
2. Verify API returns correct format
3. Check network tab for 401 responses
4. Clear localStorage and retry

## File Structure
```
template_builder_nextjs_shadcnui/
├── .env.local                          # Environment config
├── lib/
│   ├── fetcher.ts                      # Auth & API calls
│   ├── auth-context.tsx                # Auth provider
│   ├── data-field-registry.ts          # Field definitions
│   ├── data-field-api.ts               # Patient data API
│   └── auto-fill-service.ts            # Auto-fill logic
├── components/
│   ├── add-note-form.tsx               # Main form component
│   └── app-header.tsx                  # Navigation header
└── app/
    ├── layout.tsx                      # Root with AuthProvider
    ├── sign-in/page.tsx                # Login page
    └── notes/
        ├── page.tsx                    # Notes list
        └── create/page.tsx             # Create note
```

## Development Workflow

1. **Start Server**: `npm run dev`
2. **Sign In**: Navigate to `/sign-in`
3. **Create Note**: Click "New Note"
4. **Select Template**: Choose from dropdown
5. **Auto-Fill**: Patient data populates automatically
6. **Fill Fields**: Complete remaining fields
7. **Voice Input**: Click *** fields to record
8. **Save**: Click "Save Note"

## Production Checklist

- [ ] Update NEXT_PUBLIC_API_BASE_URL
- [ ] Generate secure NEXT_PUBLIC_ENCRYPTION_KEY (32+ chars)
- [ ] Test all API endpoints
- [ ] Verify SSL/HTTPS
- [ ] Test authentication flow
- [ ] Test auto-fill with real data
- [ ] Test voice input
- [ ] Test on multiple browsers
- [ ] Test on mobile devices
- [ ] Set up error monitoring
