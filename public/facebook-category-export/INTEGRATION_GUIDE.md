# Quick Integration Guide - Facebook Category Selection

This is a step-by-step guide to integrate the Facebook category selection system into Selling To Sold.

---

## ⚡ Quick Start (5 Steps)

### Step 1: Copy Files (2 minutes)

Copy these files to your Selling To Sold project:

```bash
# From TreasureHub/public/facebook-category-export/

# Core files (required)
cp app/lib/facebook-taxonomy-complete.ts      → SellingToSold/app/lib/
cp app/components/UnifiedCategorySelector.tsx → SellingToSold/app/components/

# Support files (recommended)
cp app/lib/ai-confidence-scorer.ts            → SellingToSold/app/lib/
cp app/components/ConfidenceIndicator.tsx     → SellingToSold/app/components/
```

---

### Step 2: Install Dependencies (1 minute)

```bash
npm install lucide-react
```

---

### Step 3: Update Your List Item Page (5 minutes)

Find your list-item page (e.g., `app/(dashboard)/list-item/page.tsx`) and update it:

**Add imports:**
```typescript
import UnifiedCategorySelector from "@/app/components/UnifiedCategorySelector";
import { FACEBOOK_TAXONOMY } from "@/app/lib/facebook-taxonomy-complete";
```

**Add state (if not already present):**
```typescript
const [department, setDepartment] = useState("");
const [category, setCategory] = useState("");
const [subCategory, setSubCategory] = useState("");
```

**Replace your category dropdowns with:**
```typescript
<UnifiedCategorySelector
  department={department}
  setDepartment={setDepartment}
  category={category}
  setCategory={setCategory}
  subCategory={subCategory}
  setSubCategory={setSubCategory}
  taxonomy={FACEBOOK_TAXONOMY}
  confidenceScores={confidenceScores} // Optional - remove if not using AI
/>
```

---

### Step 4: Test (2 minutes)

1. Start your dev server: `npm run dev`
2. Navigate to your list-item page
3. Click the Category dropdown
4. Type to search (e.g., "furniture")
5. Select a category
6. Verify it displays correctly

---

### Step 5: Verify Database (1 minute)

Create a test listing and check that these fields are saved:
- `department`
- `category`
- `subCategory`

✅ Done! You now have Facebook category selection working.

---

## 🔧 Detailed Integration Steps

### For Pages That Create Listings

#### Example: New Listing Page

```typescript
// app/(dashboard)/list-item/page.tsx

import { useState } from "react";
import UnifiedCategorySelector from "@/app/components/UnifiedCategorySelector";
import { FACEBOOK_TAXONOMY } from "@/app/lib/facebook-taxonomy-complete";

export default function ListItemPage() {
  // Category state
  const [department, setDepartment] = useState("");
  const [category, setCategory] = useState("");
  const [subCategory, setSubCategory] = useState("");

  // ... other state ...

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const listingData = {
      department,
      category,
      subCategory,
      // ... other fields ...
    };

    // Save to database
    const response = await fetch("/api/listings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(listingData),
    });

    // Handle response...
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Other form fields */}

      <UnifiedCategorySelector
        department={department}
        setDepartment={setDepartment}
        category={category}
        setCategory={setCategory}
        subCategory={subCategory}
        setSubCategory={setSubCategory}
        taxonomy={FACEBOOK_TAXONOMY}
      />

      {/* Other form fields */}

      <button type="submit">Create Listing</button>
    </form>
  );
}
```

---

### For Pages That Edit Listings

#### Example: Edit Listing Page

```typescript
// app/(dashboard)/list-item/[id]/edit/page.tsx

import { useState, useEffect } from "react";
import UnifiedCategorySelector from "@/app/components/UnifiedCategorySelector";
import { FACEBOOK_TAXONOMY } from "@/app/lib/facebook-taxonomy-complete";

export default function EditListingPage({ params }: { params: { id: string } }) {
  // Category state
  const [department, setDepartment] = useState("");
  const [category, setCategory] = useState("");
  const [subCategory, setSubCategory] = useState("");

  // ... other state ...

  // Load existing data
  useEffect(() => {
    async function loadListing() {
      const response = await fetch(`/api/listings/${params.id}`);
      const listing = await response.json();

      setDepartment(listing.department || "");
      setCategory(listing.category || "");
      setSubCategory(listing.subCategory || "");
      // ... load other fields ...
    }

    loadListing();
  }, [params.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const listingData = {
      department,
      category,
      subCategory,
      // ... other fields ...
    };

    // Update in database
    const response = await fetch(`/api/listings/${params.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(listingData),
    });

    // Handle response...
  };

  return (
    <form onSubmit={handleSubmit}>
      <UnifiedCategorySelector
        department={department}
        setDepartment={setDepartment}
        category={category}
        setCategory={setCategory}
        subCategory={subCategory}
        setSubCategory={setSubCategory}
        taxonomy={FACEBOOK_TAXONOMY}
      />

      <button type="submit">Update Listing</button>
    </form>
  );
}
```

---

### For AI-Generated Listings

If you have AI that generates listing data:

```typescript
// In your AI generation logic

import { FACEBOOK_TAXONOMY, validateCategoryHierarchy } from "@/app/lib/facebook-taxonomy-complete";

async function generateListingFromAI(photos: string[]) {
  // Call your AI service
  const aiResponse = await fetch("/api/ai/generate-listing", {
    method: "POST",
    body: JSON.stringify({ photos }),
  });

  const aiData = await aiResponse.json();

  // Validate and fix category hierarchy
  const validatedCategories = validateCategoryHierarchy(
    aiData.department,
    aiData.category,
    aiData.subCategory
  );

  // Update state with validated categories
  setDepartment(validatedCategories.department);
  setCategory(validatedCategories.category);
  setSubCategory(validatedCategories.subCategory);

  // ... handle other AI-generated fields ...
}
```

---

## 🎨 Customization

### Changing Colors

To match Selling To Sold's brand colors, update `UnifiedCategorySelector.tsx`:

```typescript
// Find these classes and replace with your colors:

// From:
focus:ring-[#D4AF3D]
bg-[#D4AF3D]/10
bg-[#D4AF3D]/20
text-[#D4AF3D]

// To (example):
focus:ring-blue-500
bg-blue-50
bg-blue-100
text-blue-600
```

---

### Removing Confidence Scores

If you don't want the confidence badge feature:

1. In `UnifiedCategorySelector.tsx`, remove:
   ```typescript
   import { ConfidenceBadge } from "./ConfidenceIndicator";
   import { ConfidenceLevel } from "@/lib/ai-confidence-scorer";
   ```

2. Remove the `confidenceScores` prop from the component

3. Remove these lines from the JSX:
   ```typescript
   {highestConfidence && <ConfidenceBadge level={highestConfidence} />}
   ```

---

## 🗄️ Database Setup

### Prisma Schema

Ensure your `Listing` model has these fields:

```prisma
model Listing {
  id          String   @id @default(cuid())
  
  // Category fields
  department  String?
  category    String?
  subCategory String?
  
  // ... other fields ...
}
```

### Migration

If you need to add these fields:

```bash
# Add the fields to your schema.prisma, then:
npx prisma migrate dev --name add_category_fields
```

---

## 🔄 Migrating Existing Data

If you have existing listings that need Facebook categories:

1. Copy the migration script:
   ```bash
   cp scripts/migrate-facebook-categories.js → SellingToSold/scripts/
   ```

2. Update the mapping objects in the script to match YOUR existing categories

3. Run the migration:
   ```bash
   node scripts/migrate-facebook-categories.js
   ```

4. Review the output and verify results

---

## ✅ Testing Checklist

- [ ] Category dropdown appears on create page
- [ ] Can search for categories by typing
- [ ] Can select a category from dropdown
- [ ] Selected category displays correctly
- [ ] Category saves to database (check with Prisma Studio)
- [ ] Edit page loads existing category correctly
- [ ] Can change category and save update
- [ ] AI generation populates category (if applicable)
- [ ] No TypeScript errors
- [ ] No console errors

---

## 🐛 Troubleshooting

### Problem: Import errors
```
Cannot find module '@/app/lib/facebook-taxonomy-complete'
```
**Solution:** Check your import alias in `tsconfig.json`. You might need to use relative imports like `../../lib/` instead.

---

### Problem: Categories not showing
**Solution:** 
1. Check that `FACEBOOK_TAXONOMY` is imported
2. Verify it's passed to `taxonomy` prop
3. Check console for parsing errors
4. Console.log `FACEBOOK_TAXONOMY` to see if it loaded

---

### Problem: Search not working
**Solution:**
1. Check that you're typing in the search input
2. Verify `searchQuery` state is updating (add console.log)
3. Check that `filteredOptions` is being set

---

### Problem: Database not saving
**Solution:**
1. Check Prisma schema has the three fields
2. Verify form submission includes category data
3. Check API route is receiving the data
4. Test with Prisma Studio

---

## 📞 Need Help?

1. **Check README.md** - Comprehensive overview
2. **Check FILE_INVENTORY.md** - File dependencies and structure
3. **Review requirements/** - Original requirements and specs
4. **Compare with TreasureHub** - See how it's implemented there

---

## 🚀 Going Live

Before deploying to production:

1. Test thoroughly in development
2. Migrate existing data if needed
3. Verify all category selections save correctly
4. Test on multiple browsers
5. Check mobile responsiveness
6. Deploy to staging first
7. Verify in production

---

## 📊 Summary

**Time to integrate:** ~15 minutes
**Files to copy:** 4-7 files (depending on features wanted)
**Dependencies:** 1 (lucide-react)
**Lines of code:** ~3,700
**Categories available:** 1,800+

---

**Last Updated:** November 10, 2025
**For:** Selling To Sold Integration


