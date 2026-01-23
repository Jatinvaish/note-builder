# Developer Quick Start Guide

## 5-Minute Overview

### What Changed
1. Template types: "normal" and "navigation_callback" (was "regular" / "navigate only")
2. Templates now have groups for organizing fields
3. Elements support data binding (auto-fill from APIs)
4. Templates have version snapshots (immutable)
5. New 3-panel template builder UI

### Key Files
\`\`\`
/components/template-builder.tsx    ← Main editor (3-panel layout)
/lib/binding-service.ts            ← Data binding resolver
/lib/compat-layer.ts               ← Backward compatibility
/lib/types.ts                       ← Updated data model
\`\`\`

---

## Running Locally

\`\`\`bash
# No new dependencies needed - uses existing stack
npm install  # if needed
npm run dev

# Open http://localhost:3000/templates/create
\`\`\`

---

## Template Structure (New Schema)

\`\`\`typescript
Template {
  id: string
  templateName: string
  templateType: "normal" | "navigation_callback"  // [CHANGED]
  status: "active" | "inactive"  // [NEW]
  groups: Group[]  // [NEW]
  elements: {
    label: string  // [NEW - required]
    group_id?: string  // [NEW]
    data_binding?: DataBinding  // [NEW]
  }
  versionHistory: []  // [ENHANCED - immutable snapshots]
}
\`\`\`

---

## Common Tasks

### Create New Template
\`\`\`typescript
import { TemplateBuilder } from "@/components/template-builder"

<TemplateBuilder
  onSave={(template) => saveTemplate(template)}
  onCancel={() => router.back()}
/>
\`\`\`

### Access Binding Service
\`\`\`typescript
import { getBindingResolver } from "@/lib/binding-service"

const resolver = getBindingResolver()
const value = await resolver.resolveBinding(
  element.data_binding,
  clinicalContext
)
\`\`\`

### Migrate Old Template
\`\`\`typescript
import { normalizeTemplate } from "@/lib/compat-layer"

const oldTemplate = getTemplate(id)
const newTemplate = normalizeTemplate(oldTemplate)
// Automatically migrates type and adds missing fields
\`\`\`

### Configure Element Data Binding
\`\`\`typescript
{
  elementType: "input",
  label: "Appointment Date",
  data_binding: {
    type: "api",
    source: "appointment.appointmentDate",
    apiEndpoint: "/api/appointments/{appointmentId}",
    fallbackValue: ""
  }
}
\`\`\`

### Load Template Version
\`\`\`typescript
import { getTemplateVersion } from "@/lib/template-storage"

// Load exact version snapshot
const template = getTemplateVersion(templateId, versionId)
\`\`\`

---

## Component Map

### Template Editor
\`\`\`
TemplateBuilder (main entry point)
├── Header Row (name, type, status, version)
├── Left Panel
│   ├── Groups Tab (GroupMasterPanel)
│   └── Elements Tab (ElementPalette)
├── Middle Panel (FreeFormEditor)
└── Right Panel
    ├── Properties Tab (ElementPropertiesPanel)
    └── Preview Tab (GroupWisePreview)
\`\`\`

### Element Properties
\`\`\`
ElementPropertiesPanel
├── Basic Tab (label, type, default)
├── Advanced Tab (group, order)
└── Binding Tab (api config, fallback)
\`\`\`

### Preview & Print
\`\`\`
TemplatePreviewDialog
├── Preview Tab (read-only view)
└── Print Tab (printable layout)
\`\`\`

---

## Data Flow

### Template Creation
\`\`\`
User inputs → TemplateBuilder state → FreeFormEditor (TipTap)
                    ↓
            Save button clicked
                    ↓
            normalizeTemplate() [backward compat]
                    ↓
            Create version snapshot
                    ↓
            localStorage.setItem()
\`\`\`

### Data Binding Resolution
\`\`\`
Load template with clinical context
        ↓
For each element in template:
  - Check if data_binding exists
  - Call bindingResolver.resolveBinding()
  - Get value (or fallback)
        ↓
Pre-fill element in note
\`\`\`

### Notes Page (Phase 2)
\`\`\`
User opens note
    ↓
Load template version snapshot
    ↓
Resolve all bindings
    ↓
Left panel: group-wise field entry
Right panel: main note renderer
    ↓
Real-time sync (left ↔ right)
\`\`\`

---

## Testing Binding

### In Template Editor
1. Create element with data binding
2. Go to Properties → Binding tab
3. Set type: "api"
4. Set source: "appointment.appointmentDate"
5. Set endpoint: "/api/appointments/{id}"
6. Click Preview tab
7. See resolved value from mock data

### Mock Clinical Context
\`\`\`typescript
const context = {
  appointmentDate: "2025-01-20",
  patientId: "pat-001",
}

// Binding resolver will use this to fetch data
\`\`\`

---

## Common Errors & Fixes

### ❌ "Element missing label"
**Cause**: FormElement created without label  
**Fix**: Add label in properties panel (required)

### ❌ "Type is not 'normal' or 'navigation_callback'"
**Cause**: Old template using "regular" type  
**Fix**: Auto-fixed by `normalizeTemplate()` on load

### ❌ "Binding not resolving"
**Cause**: Missing clinical context field  
**Fix**: Check clinical context has needed field, use fallback value

### ❌ "Version not found"
**Cause**: templateVersionId mismatch  
**Fix**: Verify templateVersionId exists in versionHistory

---

## Phase 2 Tasks (Notes Page)

When ready to implement Notes page updates:

1. **Create NotesGroupFieldPanel component**
   - Show groups on left
   - List elements by group
   - Real-time field edit callbacks

2. **Update ConsultationNotePage**
   - Load template version snapshot
   - Resolve all bindings on mount
   - Pass data to both panels

3. **Implement two-way sync**
   - Left panel change → update state → right panel re-renders
   - Right panel change → update state → left panel reflects

See `/NOTES_PAGE_PHASE2_GUIDE.md` for detailed steps.

---

## Debugging Tips

### Enable Binding Logs
\`\`\`typescript
const resolver = getBindingResolver()
// Logs appear in browser console
// Shows: resolved values, API calls, fallbacks
\`\`\`

### Check Template Structure
\`\`\`typescript
import { validateTemplate } from "@/lib/compat-layer"

const issues = validateTemplate(template)
console.log(issues)  // Shows any schema problems
\`\`\`

### Inspect Version Snapshot
\`\`\`typescript
const template = getTemplate(id)
console.log("Version snapshots:", template.versionHistory)
// Each version has immutable templateContent
\`\`\`

### Test Backward Compatibility
\`\`\`typescript
import { normalizeTemplate } from "@/lib/compat-layer"

// Test old template
const oldTemplate = { templateType: "regular", /* ... */ }
const normalized = normalizeTemplate(oldTemplate)
console.log(normalized.templateType)  // "normal"
\`\`\`

---

## Environment Variables

No new environment variables needed. All APIs mocked behind service interface.

To connect real APIs (Phase 2):
\`\`\`typescript
// In binding-service.ts, update:
const response = await fetch(process.env.NEXT_PUBLIC_API_BASE + endpoint)
\`\`\`

---

## Performance Tips

1. **Template Loading**: Versions are cached in memory
2. **Binding Resolution**: Done once on load, not on every keystroke
3. **Real-time Sync**: Use debouncing for frequent updates
4. **Large Templates**: TipTap handles 1000+ elements efficiently

---

## Useful Imports

\`\`\`typescript
// Types
import type { 
  Template, 
  Group, 
  FormElement, 
  DataBinding,
  ClinicalContext 
} from "@/lib/types"

// Utilities
import { normalizeTemplate, validateTemplate } from "@/lib/compat-layer"
import { getBindingResolver } from "@/lib/binding-service"
import { 
  getTemplate, 
  saveTemplate, 
  getTemplateVersion 
} from "@/lib/template-storage"

// Components
import { TemplateBuilder } from "@/components/template-builder"
import { GroupMasterPanel } from "@/components/group-master-panel"
import { ElementPropertiesPanel } from "@/components/element-properties-panel"
import { TemplatePreviewDialog } from "@/components/template-preview-dialog"
\`\`\`

---

## Links & Resources

- **Specification**: See attached files or `/SPEC_IMPLEMENTATION_STATUS.md`
- **API Reference**: `/API_BINDING_REFERENCE.md`
- **Phase 2 Guide**: `/NOTES_PAGE_PHASE2_GUIDE.md`
- **Final Summary**: `/FINAL_DELIVERY_SUMMARY.md`

---

## Need Help?

### Documentation
- Data binding config: `API_BINDING_REFERENCE.md`
- Implementation details: `SPEC_IMPLEMENTATION_STATUS.md`
- Phase 2 roadmap: `NOTES_PAGE_PHASE2_GUIDE.md`

### Code Inspection
- Open `/components/template-builder.tsx` for main layout
- Open `/lib/binding-service.ts` for data binding logic
- Open `/lib/compat-layer.ts` for backward compatibility

### Testing
- Test old template loads: check compat-layer
- Test binding resolves: check binding-service logs
- Test version pinning: save template, check versionHistory

---

**Last Updated**: January 20, 2025  
**Status**: Phase 1 Complete ✅
