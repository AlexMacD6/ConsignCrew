# Facebook Category Selection System - Export Package

This export package contains all the files needed to implement the Facebook Marketplace category selection system in your **Selling To Sold** application.

## 📦 Package Contents

### Components (`app/components/`)
- **UnifiedCategorySelector.tsx** - Main searchable category dropdown component
- **CategorySelector.tsx** - Legacy three-dropdown component (for reference/backward compatibility)
- **ConfidenceIndicator.tsx** - Shows AI confidence scores for selections
- **FormSection.tsx** - Example integration showing how to use the selector

### Libraries (`app/lib/`)
- **facebook-taxonomy-complete.ts** - Complete Facebook Marketplace taxonomy (1,800+ categories)
- **facebook-taxonomy.ts** - Simplified taxonomy structure with validation helpers
- **ai-confidence-scorer.ts** - Confidence scoring system for AI-generated fields

### Scripts (`scripts/`)
- **migrate-facebook-categories.js** - Database migration script for existing listings

### Documentation (`docs/`, `requirements/`, `pr-templates/`)
- **COMPLETE-CATEGORY-LIST-INSTRUCTIONS.md** - Setup and usage instructions
- **unified-category-selector.txt** - Detailed requirements and implementation notes
- **unified-category-selector.md** - PR template with testing instructions

---

## 🚀 Quick Start Guide

### Step 1: Copy Files to Selling To Sold

Copy the files to your Selling To Sold project:

```bash
# From the TreasureHub/public/facebook-category-export directory:

# Copy components
cp app/components/*.tsx <SellingToSold>/app/components/

# Copy libraries
cp app/lib/*.ts <SellingToSold>/app/lib/

# Copy scripts (optional, for migration)
cp scripts/*.js <SellingToSold>/scripts/
```

### Step 2: Install Dependencies

The components use these dependencies (likely already in your project):
- `lucide-react` - For icons (Search, ChevronDown)
- `@prisma/client` - For database operations (if using migration script)

If not installed:
```bash
npm install lucide-react
```

### Step 3: Update Your List Item Page

Replace or update your category selection with the UnifiedCategorySelector:

```typescript
import UnifiedCategorySelector from "@/app/components/UnifiedCategorySelector";
import { FACEBOOK_TAXONOMY } from "@/app/lib/facebook-taxonomy-complete";

// In your component:
export default function ListItemPage() {
  const [department, setDepartment] = useState("");
  const [category, setCategory] = useState("");
  const [subCategory, setSubCategory] = useState("");

  return (
    <UnifiedCategorySelector
      department={department}
      setDepartment={setDepartment}
      category={category}
      setCategory={setCategory}
      subCategory={subCategory}
      setSubCategory={setSubCategory}
      taxonomy={FACEBOOK_TAXONOMY}
      confidenceScores={confidenceScores} // Optional
    />
  );
}
```

### Step 4: Verify Database Schema

Ensure your Prisma schema has these fields on your `Listing` model:

```prisma
model Listing {
  // ... other fields
  department    String?
  category      String?
  subCategory   String?
  // ... other fields
}
```

If you need to add them:
```bash
npx prisma migrate dev --name add_category_fields
```

---

## 📚 Key Features

### 1. Unified Search Interface
- Single dropdown replaces three cascading dropdowns
- Real-time search across all 1,800+ categories
- Type any part of category path to filter results

### 2. Complete Facebook Taxonomy
- All official Facebook Marketplace categories
- Hierarchical structure: Department → Category → Sub-category
- Over 1,800 category combinations

### 3. AI Confidence Integration
- Shows AI confidence scores for category selections
- Visual badges: Green (high), Yellow (medium), Red (low)
- Tooltips explain reasoning behind confidence levels

### 4. Easy Maintenance
- Single source of truth in `facebook-taxonomy-complete.ts`
- Add new categories by simply adding a line to the file
- Validates category hierarchy automatically

---

## 🔧 Customization

### Changing Colors

The selector uses TreasureHub's gold accent color (`#D4AF3D`). To change it to match Selling To Sold:

In `UnifiedCategorySelector.tsx`, find and replace:
- `focus:ring-[#D4AF3D]` → `focus:ring-[YOUR_COLOR]`
- `bg-[#D4AF3D]` → `bg-[YOUR_COLOR]`
- `text-[#D4AF3D]` → `text-[YOUR_COLOR]`

### Removing Confidence Scores

If you don't want the confidence scoring system:

1. Remove `ConfidenceBadge` import and usage from `UnifiedCategorySelector.tsx`
2. Remove the `confidenceScores` prop
3. Delete `ai-confidence-scorer.ts` and `ConfidenceIndicator.tsx`

---

## 📖 How It Works

### Data Flow

```
1. RAW_CATEGORY_DATA (facebook-taxonomy-complete.ts)
   ↓
2. Parse into hierarchical object structure
   ↓
3. Load into page state
   ↓
4. Pass to UnifiedCategorySelector
   ↓
5. Flatten to searchable options array
   ↓
6. User searches/selects category
   ↓
7. Split selection into department/category/subCategory
   ↓
8. Update individual state variables
   ↓
9. Save to database as separate fields
```

### Category Format

Categories are stored in the format: `Department//Category//Sub-category`

**Examples:**
```
Antiques & Collectibles//Antique & Collectible Furniture//Chairs
Electronics//Video Games & Consoles//Video Game Accessories
Clothing, Shoes & Accessories//Women's Clothing//Dresses
```

The component automatically:
- Parses this into hierarchical structure
- Displays as: `Department → Category → Sub-category`
- Stores as three separate database fields

---

## 🧪 Testing

### Test Manual Selection
1. Navigate to your list-item page
2. Click the Category dropdown
3. Type to search (e.g., "video game", "furniture")
4. Select a category
5. Verify it displays correctly

### Test AI Integration
1. Upload product photos
2. Click "Generate with AI"
3. Verify category is populated automatically
4. Check that it matches the product

### Test Database Storage
1. Create a listing with a category
2. Check database - should have three separate fields:
   - `department`
   - `category`
   - `subCategory`

---

## 🔄 Migration Script

If you have existing listings that need Facebook categories:

1. Review `scripts/migrate-facebook-categories.js`
2. Update the mapping objects to match your existing categories
3. Run the script:
   ```bash
   node scripts/migrate-facebook-categories.js
   ```

This will:
- Find all listings without Facebook categories
- Map them based on existing department/category/subCategory
- Update the database
- Provide statistics

---

## 📝 File Descriptions

### UnifiedCategorySelector.tsx (293 lines)
The main component. Features:
- Search input with auto-focus
- Filtered dropdown list
- Click-outside-to-close
- Confidence badge integration
- State management for all three category levels

### facebook-taxonomy-complete.ts (1,972 lines)
Complete category data. Contains:
- `RAW_CATEGORY_DATA` - All 1,800+ categories as string
- `FACEBOOK_TAXONOMY` - Parsed hierarchical object
- Helper functions for accessing categories
- Validation functions

### ai-confidence-scorer.ts (357 lines)
Confidence scoring system. Calculates:
- Field-specific confidence scores
- Based on photo count, video availability, visual clarity
- Returns level (high/medium/low), score (0-100), reasoning

### ConfidenceIndicator.tsx (219 lines)
UI components for confidence display:
- `ConfidenceIndicator` - Full component with tooltip
- `ConfidenceBadge` - Compact inline badge
- `ConfidenceSummary` - Overview of all scores

---

## 🐛 Troubleshooting

### Categories not showing up
- Check that `FACEBOOK_TAXONOMY` is imported correctly
- Verify taxonomy is passed to component via `taxonomy` prop
- Check console for parsing errors

### Search not working
- Ensure `searchQuery` state is updating
- Check that `filteredOptions` is being set correctly
- Verify `toLowerCase()` comparison is working

### Database not saving
- Confirm Prisma schema has the three category fields
- Check that `setDepartment`, `setCategory`, `setSubCategory` are being called
- Verify form submission includes these fields

### TypeScript errors
- Ensure `@/lib/ai-confidence-scorer` import path is correct
- Check that types are exported from the library files
- Verify Prisma types are generated (`npx prisma generate`)

---

## 📞 Support

For questions or issues:
1. Check the documentation in `docs/` folder
2. Review the requirements file for implementation details
3. See the PR template for testing instructions
4. Compare with TreasureHub implementation for reference

---

## 🎯 Next Steps

1. **Copy files** to Selling To Sold project
2. **Update imports** to match your project structure
3. **Test** the category selector
4. **Customize** colors and styling if needed
5. **Migrate** existing data if necessary
6. **Deploy** and verify in production

---

## 📊 Statistics

- **Total Categories:** 1,800+
- **Departments:** 20+
- **Lines of Code:** ~3,000
- **Components:** 4
- **Libraries:** 3
- **Scripts:** 1

---

## ✅ Benefits

1. **Improved UX** - Single dropdown vs. three cascading dropdowns
2. **Better Search** - Find categories instantly by typing
3. **AI Compatible** - AI selects from same list as users
4. **Single Source of Truth** - Easy to maintain and update
5. **Scalable** - Add new categories by adding one line
6. **Validated** - Ensures proper category hierarchy
7. **Professional** - Matches Facebook Marketplace exactly

---

## 📄 License

This code is part of TreasureHub and is being exported for use in Selling To Sold (sister application).

---

**Last Updated:** November 10, 2025
**Exported From:** TreasureHub v1.0
**For Use In:** Selling To Sold


