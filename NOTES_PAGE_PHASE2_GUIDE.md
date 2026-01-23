# Notes Page - Phase 2 Implementation Guide

## Current State

The template builder is now feature-complete with:
- ✅ Group management
- ✅ Element properties (including data binding)
- ✅ Version pinning for notes
- ✅ Print/preview pipeline
- ✅ Backward compatibility

**Next phase**: Update Notes page to use new template structure with group-wise field entry.

---

## Notes Page Layout Changes

### Current Layout (Old)
\`\`\`
┌─────────────────────────────────────────┐
│  Template Dropdown                       │
├────────────────┬─────────────────────────┤
│  Note Content  │     Editor              │
│  (Read-only)   │  (Free-form text)       │
│                │                         │
└────────────────┴─────────────────────────┘
\`\`\`

### New Layout (Phase 2)
\`\`\`
┌──────────────────────────────────────────────────────────┐
│  Template Dropdown | Version Info                        │
├──────────────────────┬──────────────────────────────────┤
│  Group-wise Fields   │      Main Note                    │
│  (Data Entry)        │  (Rendered Template)              │
│                      │                                  │
│  Personal Info ▼     │                                  │
│  └ Date       [......│                                  │
│  └ Name       [......│                                  │
│  └ Contact    [......│                                  │
│                      │                                  │
│  Vitals ▼            │                                  │
│  └ BP        [......│                                  │
│  └ HR        [......│                                  │
│  └ Temp      [......│                                  │
│                      │                                  │
│  [Preview] [Print]   │  [Save] [Cancel]                 │
└──────────────────────┴──────────────────────────────────┘
\`\`\`

---

## Implementation Steps

### Step 1: Update ConsultationNote Storage

**File**: `/lib/note-storage.ts`

Add function to load template version snapshot:

\`\`\`typescript
export function getNoteWithTemplateVersion(noteId: string): {
  note: ConsultationNote
  template: Template
} | null {
  const note = getConsultationNote(noteId)
  if (!note) return null

  // Load template version snapshot
  const template = getTemplateVersion(
    note.templateId,
    note.templateVersionId || 1
  )
  
  return { note, template }
}
\`\`\`

### Step 2: Create GroupWiseFieldPanel Component

**File**: `/components/notes-group-field-panel.tsx` (NEW)

This component shows all template fields organized by group for data entry:

\`\`\`typescript
interface NotesGroupFieldPanelProps {
  template: Template
  data: Record<string, any>
  groups: Group[]
  onFieldChange: (fieldKey: string, value: any) => void
}

export function NotesGroupFieldPanel({
  template,
  data,
  groups,
  onFieldChange,
}: NotesGroupFieldPanelProps) {
  // 1. Sort groups by order_by
  // 2. For each group, list elements assigned to that group
  // 3. Show input fields for each element
  // 4. Call onFieldChange when user edits
}
\`\`\`

**Key Features**:
- ✅ Collapsible groups (show/hide by group)
- ✅ Real-time onChange callbacks
- ✅ Support for all element types (input, datetime, select, etc.)
- ✅ Display binding info (e.g., "auto-filled from appointment")
- ✅ Show resolved values from bindings
- ✅ Allow user to override auto-filled values

### Step 3: Update NoteRendererTemplate Component

**File**: `/app/notes/page.tsx` (or similar)

Modify the main note rendering section:

\`\`\`typescript
export function ConsultationNotePage() {
  const [template, setTemplate] = useState<Template | null>(null)
  const [noteData, setNoteData] = useState<Record<string, any>>({})

  // Load template and resolve bindings on mount
  useEffect(() => {
    const t = getTemplate(selectedTemplateId)
    setTemplate(t)
    
    // Resolve all bindings
    const bindingResolver = getBindingResolver()
    const context: ClinicalContext = {
      appointmentDate: appointment?.date,
      patientId: patient?.id,
      // ...
    }
    
    // Pre-fill data from bindings
    const resolved: Record<string, any> = {}
    for (const element of t.elements) {
      if (element.data_binding) {
        const value = await bindingResolver.resolveBinding(
          element.data_binding,
          context
        )
        resolved[element.elementKey] = value
      }
    }
    
    setNoteData(resolved)
  }, [selectedTemplateId])

  // Handle field changes
  const handleFieldChange = (fieldKey: string, value: any) => {
    setNoteData(prev => ({
      ...prev,
      [fieldKey]: value
    }))
  }

  return (
    <div className="flex gap-4">
      {/* Left: Group-wise Field Panel */}
      <div className="w-80">
        <NotesGroupFieldPanel
          template={template}
          data={noteData}
          groups={template?.groups || []}
          onFieldChange={handleFieldChange}
        />
      </div>

      {/* Right: Main Note Renderer */}
      <div className="flex-1">
        <TemplateRenderer
          template={template}
          data={noteData}
          onDataChange={handleFieldChange}
          readOnly={false}
        />
      </div>
    </div>
  )
}
\`\`\`

### Step 4: Implement Real-time Two-Way Binding

**Key Behavior**:
1. User types in left panel field → right note updates immediately
2. Template renders with updated values
3. Both sides stay in sync

**Implementation**:
\`\`\`typescript
const handleFieldChange = (fieldKey: string, value: any) => {
  // Update state
  setNoteData(prev => ({
    ...prev,
    [fieldKey]: value
  }))
  
  // Auto-save (optional debounced)
  debouncedSave(fieldKey, value)
}
\`\`\`

### Step 5: Add Preview & Print to Notes Page

**File**: `/app/notes/page.tsx`

Add buttons at bottom:

\`\`\`typescript
<div className="flex gap-2 mt-4">
  <Button
    variant="outline"
    onClick={() => setPreviewMode(!previewMode)}
  >
    {previewMode ? 'Edit' : 'Preview'}
  </Button>
  
  <Button
    onClick={() => {
      // Print or download PDF
      window.print()
    }}
  >
    Print / PDF
  </Button>
  
  <Button onClick={handleSave}>
    Save Note
  </Button>
</div>
\`\`\`

### Step 6: Handle Preview Mode

When preview mode is active:
- ✅ Hide left panel (group fields)
- ✅ Show right panel in read-only mode
- ✅ Render with final values only
- ✅ Hide all input controls

---

## Data Flow Diagram

\`\`\`
User Opens Note
    ↓
Load Template Version Snapshot
    ↓
Create Clinical Context (appointmentDate, patientId, etc.)
    ↓
Resolve All Bindings
    ↓
Pre-fill noteData with binding values
    ↓
────────────────────────────────────────────────────────────
│                                                            │
▼                                ▼                           ▼
Group-wise Field Panel         Real-time Sync            Template Renderer
(Left Side)                     (Two-way binding)          (Right Side)
                                     ↓
                            Both sides update together
                                     ↓
────────────────────────────────────────────────────────────
    ↓
User Clicks Save
    ↓
Save note with templateVersionId
    ↓
Store in localStorage / backend
\`\`\`

---

## Component Dependencies

### New Components Needed
1. `NotesGroupFieldPanel` - Group-wise field entry UI
2. Update to `ConsultationNotePage` - New layout

### Existing Components to Reuse
- ✅ `TemplateRenderer` - Already supports data binding
- ✅ `TemplatePreviewDialog` - Preview & print
- ✅ `GroupMasterPanel` - Group display logic
- ✅ `BindingService` - Data resolution

---

## Important Considerations

### Version Pinning
- Always load template version snapshot with note
- Don't auto-upgrade to newer versions
- If template is deleted, note can still render from snapshot

### Data Binding Resolution
- Resolve bindings **on note load** (not in real-time)
- Show binding source in field label (e.g., "Date (from appointment)")
- Allow user to override auto-filled values

### Backward Compatibility
- Old notes without templateVersionId → use latest version
- Old templates without groups → treat all fields as "Ungrouped"
- Missing labels → use elementKey as fallback

### Performance
- Don't re-resolve bindings on every keystroke
- Cache binding resolution results
- Debounce field change saves

---

## Testing Checklist

- [ ] Create note with new template
- [ ] Verify group-wise fields appear on left
- [ ] Type in left panel field
- [ ] Verify right panel updates in real-time
- [ ] Close and reopen note
- [ ] Verify template version snapshot loaded correctly
- [ ] Test binding resolution
- [ ] Test preview mode
- [ ] Test print output
- [ ] Test with old templates (backward compatibility)

---

## Files to Modify/Create

| File | Action | Notes |
|------|--------|-------|
| `/app/notes/page.tsx` | MODIFY | Add left panel layout |
| `/components/notes-group-field-panel.tsx` | CREATE | New component |
| `/lib/note-storage.ts` | MODIFY | Add version loading |
| `/app/notes/[noteId]/page.tsx` | MODIFY | Load template version |

---

## Mock Data for Testing

### Appointment Context
\`\`\`json
{
  "appointmentDate": "2025-01-20",
  "time": "10:00 AM",
  "clinician": "Dr. Smith",
  "location": "Room 101"
}
\`\`\`

### Patient Context
\`\`\`json
{
  "patientId": "pat-001",
  "fullName": "John Doe",
  "dateOfBirth": "1990-01-01",
  "contact": "+1-555-0123",
  "medicalId": "MR-2025-0001"
}
\`\`\`

### Use in Testing
\`\`\`typescript
const clinicalContext: ClinicalContext = {
  appointmentDate: "2025-01-20",
  patientId: "pat-001",
}
\`\`\`

---

## Success Criteria

✅ Phase 2 is complete when:
1. Notes page shows group-wise fields on left
2. Real-time sync works (left ↔ right)
3. Template version pinning works
4. Preview & print modes work
5. Data bindings resolve correctly
6. Old notes still work (backward compatible)
7. All element types render correctly
8. No regression in existing functionality
