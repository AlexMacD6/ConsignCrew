# File Inventory - Facebook Category Selection Export

## Complete File List

### Components (4 files)
```
app/components/
├── UnifiedCategorySelector.tsx        (293 lines) - Main searchable category dropdown
├── CategorySelector.tsx               (178 lines) - Legacy three-dropdown selector
├── ConfidenceIndicator.tsx            (219 lines) - AI confidence display components
└── FormSection.tsx                    (138 lines) - Example integration
```

### Libraries (3 files)
```
app/lib/
├── facebook-taxonomy-complete.ts      (1,972 lines) - Complete FB taxonomy data
├── facebook-taxonomy.ts               (241 lines) - Simplified taxonomy structure
└── ai-confidence-scorer.ts            (357 lines) - Confidence scoring system
```

### Scripts (1 file)
```
scripts/
└── migrate-facebook-categories.js     (304 lines) - Database migration script
```

### Documentation (3 files)
```
docs/
└── COMPLETE-CATEGORY-LIST-INSTRUCTIONS.md  (113 lines) - Setup guide

requirements/
└── unified-category-selector.txt           (147 lines) - Requirements & technical details

pr-templates/
└── unified-category-selector.md            (180 lines) - Testing & changelog
```

### Package Root (2 files)
```
./
├── README.md                          (This comprehensive guide)
└── FILE_INVENTORY.md                  (This file)
```

---

## File Dependencies

### UnifiedCategorySelector.tsx
**Depends on:**
- `lucide-react` (Search, ChevronDown icons)
- `ConfidenceIndicator.tsx` (ConfidenceBadge component)
- `ai-confidence-scorer.ts` (ConfidenceLevel type)

**Used by:**
- FormSection.tsx
- Any page with category selection

---

### ConfidenceIndicator.tsx
**Depends on:**
- `lucide-react` (Info, CheckCircle, AlertTriangle, HelpCircle icons)
- `ai-confidence-scorer.ts` (All confidence functions and types)

**Used by:**
- UnifiedCategorySelector.tsx
- CategorySelector.tsx
- Any component showing AI confidence

---

### facebook-taxonomy-complete.ts
**Depends on:**
- Nothing (standalone data file)

**Used by:**
- UnifiedCategorySelector.tsx (via page that imports it)
- CategorySelector.tsx (via page that imports it)
- Any page needing category data

**Exports:**
- `FACEBOOK_TAXONOMY` (main taxonomy object)
- `getDepartments()` - Get all departments
- `getCategories(dept)` - Get categories for department
- `getSubCategories(dept, cat)` - Get subcategories
- `findParentCategories(sub)` - Reverse lookup
- `validateCategoryHierarchy()` - Validation function

---

### facebook-taxonomy.ts
**Depends on:**
- Nothing (standalone data file)

**Used by:**
- Edit pages
- Legacy components

**Exports:**
- `FACEBOOK_TAXONOMY` (simplified structure)
- Helper functions (same as complete version)

---

### ai-confidence-scorer.ts
**Depends on:**
- Nothing (standalone library)

**Used by:**
- ConfidenceIndicator.tsx
- Any AI generation logic

**Exports:**
- `ConfidenceLevel` type
- `ConfidenceScore` interface
- `FieldConfidence` interface
- `calculateAllFieldConfidence()` - Main calculation function
- `getConfidenceColor()` - UI helper
- `getConfidenceIcon()` - UI helper
- `getConfidenceLabel()` - UI helper

---

### FormSection.tsx
**Depends on:**
- UnifiedCategorySelector.tsx
- All its child components (BasicFormFields, ProductDimensions, etc.)

**Used by:**
- List item pages
- Edit pages

**Note:** This is an example integration. You may need to adapt it to your project structure.

---

### CategorySelector.tsx
**Depends on:**
- `ConfidenceIndicator.tsx`
- `ai-confidence-scorer.ts`

**Used by:**
- Legacy pages (optional)

**Note:** This is the OLD three-dropdown version. Kept for reference/backward compatibility.

---

### migrate-facebook-categories.js
**Depends on:**
- `@prisma/client`

**Used by:**
- Run once to migrate existing listings

**Note:** Update the mapping objects before running to match your existing categories.

---

## Installation Order

### Minimal Installation (Core functionality only)
1. Copy `app/lib/facebook-taxonomy-complete.ts`
2. Copy `app/components/UnifiedCategorySelector.tsx`
3. Update imports in your list-item page

**Limitations:** No confidence scores, no legacy support

---

### Standard Installation (Recommended)
1. Copy all files from `app/lib/`
2. Copy all files from `app/components/`
3. Update imports in your pages
4. Test functionality

**Includes:** Full confidence system, all features

---

### Full Installation (With migration)
1. Do Standard Installation
2. Copy `scripts/migrate-facebook-categories.js`
3. Update mapping objects in script
4. Run migration script
5. Verify results

**Includes:** Everything + data migration

---

## Import Path Examples

### In your list-item page:
```typescript
// Core imports
import UnifiedCategorySelector from "@/app/components/UnifiedCategorySelector";
import { FACEBOOK_TAXONOMY } from "@/app/lib/facebook-taxonomy-complete";

// Optional - if using confidence scores
import { ConfidenceLevel } from "@/app/lib/ai-confidence-scorer";
```

### In UnifiedCategorySelector.tsx (already done):
```typescript
import { ConfidenceBadge } from "./ConfidenceIndicator";
import { ConfidenceLevel } from "@/lib/ai-confidence-scorer";
import { ChevronDown, Search } from "lucide-react";
```

### In ConfidenceIndicator.tsx (already done):
```typescript
import { Info, CheckCircle, AlertTriangle, HelpCircle } from "lucide-react";
import {
  ConfidenceLevel,
  getConfidenceColor,
  getConfidenceIcon,
  getConfidenceLabel,
} from "@/lib/ai-confidence-scorer";
```

---

## NPM Dependencies

### Required
- `lucide-react` - Icon library
  ```bash
  npm install lucide-react
  ```

### Optional (for migration script)
- `@prisma/client` - Database ORM (likely already installed)
  ```bash
  npm install @prisma/client
  ```

---

## TypeScript Types

All TypeScript types are defined in the library files:

### From ai-confidence-scorer.ts
```typescript
type ConfidenceLevel = 'low' | 'medium' | 'high';

interface ConfidenceScore {
  level: ConfidenceLevel;
  score: number;
  reasoning: string;
  factors: string[];
}

interface FieldConfidence {
  [fieldName: string]: ConfidenceScore;
}
```

### From facebook-taxonomy-complete.ts
```typescript
type FacebookTaxonomy = Record<string, Record<string, string[]>>;
```

---

## File Sizes

| File | Lines | Size | Purpose |
|------|-------|------|---------|
| facebook-taxonomy-complete.ts | 1,972 | ~180KB | Category data |
| ai-confidence-scorer.ts | 357 | ~15KB | Confidence logic |
| UnifiedCategorySelector.tsx | 293 | ~9KB | Main component |
| migrate-facebook-categories.js | 304 | ~11KB | Migration |
| facebook-taxonomy.ts | 241 | ~8KB | Simple taxonomy |
| ConfidenceIndicator.tsx | 219 | ~7KB | UI components |
| CategorySelector.tsx | 178 | ~6KB | Legacy component |
| FormSection.tsx | 138 | ~5KB | Example usage |

**Total:** ~3,700 lines, ~240KB

---

## Verification Checklist

After copying files, verify:

- [ ] All files copied to correct directories
- [ ] Import paths updated to match your project structure
- [ ] `lucide-react` installed
- [ ] TypeScript compiles without errors
- [ ] Category dropdown appears on page
- [ ] Search functionality works
- [ ] Categories can be selected
- [ ] Selection saves to database
- [ ] Confidence badges appear (if using that feature)

---

## Common Issues & Solutions

### Issue: "Cannot find module '@/lib/ai-confidence-scorer'"
**Solution:** Update import path to match your project structure (e.g., `../lib/` or `@/app/lib/`)

### Issue: "lucide-react icons not found"
**Solution:** Install lucide-react: `npm install lucide-react`

### Issue: Categories not showing in dropdown
**Solution:** Check that FACEBOOK_TAXONOMY is imported and passed to component

### Issue: TypeScript errors about types
**Solution:** Run `npx prisma generate` and restart TypeScript server

---

## Next Steps

1. Review README.md for setup instructions
2. Copy files to your project
3. Update import paths
4. Test on a dev page first
5. Roll out to production pages
6. Run migration if needed

---

**Export Date:** November 10, 2025
**Source:** TreasureHub
**Destination:** Selling To Sold


