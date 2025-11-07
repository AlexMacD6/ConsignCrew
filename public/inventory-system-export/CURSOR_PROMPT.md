# 🎯 Cursor AI Prompt: Integrate TreasureHub Inventory System into Selling To Sold

## Quick Copy-Paste Prompt for Cursor

```
I need to integrate the TreasureHub Inventory Management System into my Selling To Sold application.

LOCATION: public/inventory-system-export/

TASK: Integrate the complete inventory management system following these requirements:

1. DATABASE SETUP:
   - Add the Prisma schema from public/inventory-system-export/prisma/inventory-schema.prisma
   - Run migration: npx prisma migrate dev --name add_inventory_system
   - Generate client: npx prisma generate

2. API ROUTES:
   Copy all files from public/inventory-system-export/api/ to app/api/admin/inventory/
   - Update import paths for @/lib/prisma and @/lib/auth to match my project
   - Ensure authentication checks work with my auth system

3. FRONTEND COMPONENTS:
   - Copy InventoryReceiving.tsx and InventoryInStock.tsx to app/admin/
   - Copy InventorySelector.tsx to app/components/
   - Install lucide-react if not already installed

4. ADMIN DASHBOARD INTEGRATION:
   Add an "Inventory" tab to my admin dashboard at app/admin/page.tsx that displays:
   - InventoryReceiving component (for processing items)
   - InventoryInStock component (for viewing received items)

5. LISTING CREATION INTEGRATION:
   In my list-item page, add:
   - A "Select from Inventory" button
   - InventorySelector modal component
   - State management for inventory items, search, pagination, filters
   - Auto-fill form fields when inventory item is selected (title, price, brand, department)

DOCUMENTATION:
- Full requirements: public/inventory-system-export/docs/REQUIREMENTS.md
- Setup guide: public/inventory-system-export/docs/SETUP_GUIDE.md
- File inventory: public/inventory-system-export/docs/FILE_INVENTORY.md

IMPORTANT:
- Follow the step-by-step instructions in SETUP_GUIDE.md
- Update all import paths to match my project structure
- Ensure admin authentication is enforced on all inventory routes
- Test with sample CSV: public/inventory-system-export/docs/SETUP_GUIDE.md has sample data

Please integrate this system following the documentation provided.
```

---

## Alternative: Detailed Step-by-Step Prompt

```
I have a complete inventory management system exported from TreasureHub located at:
public/inventory-system-export/

Please integrate it into Selling To Sold following these exact steps:

STEP 1 - DATABASE (Read: public/inventory-system-export/prisma/inventory-schema.prisma)
- Open my prisma/schema.prisma
- Add the three models: InventoryList, InventoryItem, InventoryDisposition
- Add the enum: InventoryItemStatus
- Run: npx prisma migrate dev --name add_inventory_system

STEP 2 - API ROUTES (Read: public/inventory-system-export/api/)
Create these API routes:
- app/api/admin/inventory/items/route.ts (from api/route.ts)
- app/api/admin/inventory/upload/route.ts (from api/upload-route.ts)
- app/api/admin/inventory-lists/route.ts (from api/inventory-lists-route.ts)

For each file:
1. Copy the content
2. Update import { prisma } from "@/lib/prisma" to match my project
3. Update import { auth } from "@/lib/auth" to match my project
4. Ensure admin authentication is checked

STEP 3 - FRONTEND (Read: public/inventory-system-export/frontend/)
- Copy InventoryReceiving.tsx to app/admin/
- Copy InventoryInStock.tsx to app/admin/
- Copy InventorySelector.tsx from components/ to app/components/
- Run: npm install lucide-react (if needed)

STEP 4 - ADMIN INTEGRATION (Read: app/admin/page.tsx)
In my admin dashboard:
- Add new tab state for "inventory"
- Import InventoryReceiving and InventoryInStock
- Display both components when inventory tab is active

STEP 5 - LISTING INTEGRATION (Read: app/(dashboard)/list-item/page.tsx)
In my listing creation page:
- Add state variables for inventory modal, selected item, pagination
- Add loadInventoryItems function
- Add "Select from Inventory" button
- Add InventorySelector component
- Add useEffect to auto-fill form when item selected

STEP 6 - TEST
- Upload CSV from docs/SETUP_GUIDE.md
- Mark items as RECEIVED
- Create listing from inventory
- Verify quantities update

Please complete all steps and let me know if you need clarification on any part.

DOCUMENTATION REFERENCE:
- Complete guide: public/inventory-system-export/docs/SETUP_GUIDE.md
- System docs: public/inventory-system-export/docs/REQUIREMENTS.md
```

---

## For Specific Sub-Tasks

### Just Database Setup
```
Add the inventory management database schema to my Prisma schema.

Schema location: public/inventory-system-export/prisma/inventory-schema.prisma

Copy the following models and enum:
- InventoryList
- InventoryItem  
- InventoryDisposition
- InventoryItemStatus (enum)

Then run:
- npx prisma migrate dev --name add_inventory_system
- npx prisma generate
```

### Just API Routes
```
Copy inventory management API routes from public/inventory-system-export/api/ to my app/api/admin/inventory/

Files to copy:
- route.ts → app/api/admin/inventory/items/route.ts
- upload-route.ts → app/api/admin/inventory/upload/route.ts
- inventory-lists-route.ts → app/api/admin/inventory-lists/route.ts
- disposition-route.ts → app/api/admin/inventory/items/[id]/disposition/route.ts

Update import paths:
- Change @/lib/prisma to match my project
- Change @/lib/auth to match my project

Ensure admin authentication is enforced on all routes.
```

### Just Frontend Components
```
Copy inventory management frontend components:

From: public/inventory-system-export/frontend/
To: app/admin/

From: public/inventory-system-export/components/
To: app/components/

Files:
- InventoryReceiving.tsx (main receiving interface)
- InventoryInStock.tsx (in-stock view)
- InventorySelector.tsx (modal selector)

Install dependency: npm install lucide-react

Then integrate into admin dashboard at app/admin/page.tsx by adding inventory tab.
```

### Just Listing Integration
```
Integrate InventorySelector into my listing creation page.

Component location: public/inventory-system-export/components/InventorySelector.tsx

Steps:
1. Import InventorySelector
2. Add state for: modal open/close, selected item, inventory items, search, pagination, filters
3. Add loadInventoryItems function that calls /api/admin/inventory/items
4. Add "Select from Inventory" button
5. Add InventorySelector component with all required props
6. Add useEffect to auto-fill form fields when item is selected

Reference: public/inventory-system-export/docs/SETUP_GUIDE.md Step 5
```

---

## 💡 Tips for Using with Cursor

1. **Copy the prompt above** into Cursor's chat
2. **Cursor will read** all the documentation files automatically
3. **Follow the output** - Cursor will make the changes step-by-step
4. **Test each step** before proceeding to the next
5. **Reference docs** if you need more details

---

## 📚 Documentation Structure

```
public/inventory-system-export/
├── INDEX.md                    ⭐ Start here - Overview
├── docs/
│   ├── SETUP_GUIDE.md         🚀 Step-by-step integration (15 min)
│   ├── REQUIREMENTS.md        📖 Complete system documentation
│   └── FILE_INVENTORY.md      📋 File manifest
├── api/                        🔌 API route files
├── frontend/                   🎨 Admin UI components
├── components/                 🎨 Shared components
└── prisma/                     🗄️ Database schema
```

---

## 🎯 Expected Results

After integration, you'll have:
- ✅ CSV manifest upload capability
- ✅ Inventory receiving workflow
- ✅ Disposition tracking (RECEIVED/TRASH/USE)
- ✅ Searchable inventory interface
- ✅ Integration with listing creation
- ✅ Quantity tracking (remaining to list)
- ✅ Admin dashboard with inventory tab

---

## ⏱️ Time Estimates

- **Database setup:** 5 minutes
- **API routes copy:** 3 minutes
- **Frontend copy:** 3 minutes
- **Admin integration:** 2 minutes
- **Listing integration:** 5 minutes
- **Testing:** 10 minutes

**Total:** ~30 minutes

---

## 🆘 If You Get Stuck

1. **Read the guides** in `docs/` directory
2. **Check FILE_INVENTORY.md** for file locations
3. **Review REQUIREMENTS.md** for API details
4. **Look at SETUP_GUIDE.md** troubleshooting section

---

**Ready to integrate?** Copy one of the prompts above and paste into Cursor! 🚀

