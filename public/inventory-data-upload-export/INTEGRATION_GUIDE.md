# Inventory Data Upload - Integration Guide

## Quick Start (5 Steps)

### 1. Install Dependencies

All required dependencies should already be installed in your Next.js project. This export requires:
- React 18+
- Next.js 14+
- Prisma 5+
- Lucide React

### 2. Update Database Schema

Add these models to your `prisma/schema.prisma`:

```prisma
model InventoryList {
  id                String    @id @default(cuid())
  name              String
  lotNumber         String?
  datePurchased     DateTime?
  briefDescription  String?
  createdBy         String
  createdAt         DateTime  @default(now())
  
  items             InventoryItem[]
  
  @@index([createdBy])
}

model InventoryItem {
  id            String   @id @default(cuid())
  listId        String
  lotNumber     String?
  itemNumber    String?
  deptCode      String?
  department    String?
  description   String?
  quantity      Int?
  unitRetail    Float?
  extRetail     Float?
  purchasePrice Float?
  vendor        String?
  categoryCode  String?
  category      String?
  
  list          InventoryList @relation(fields: [listId], references: [id], onDelete: Cascade)
  
  @@index([listId])
  @@index([itemNumber])
}
```

Run migration:
```bash
npx prisma migrate dev --name add_inventory_data_upload
```

### 3. Copy Files

```bash
# API Routes
cp app/api/admin/inventory/upload-route.ts your-project/app/api/admin/inventory/upload/route.ts
cp app/api/admin/inventory-lists/create-with-csv/create-with-csv-route.ts your-project/app/api/admin/inventory-lists/create-with-csv/route.ts

# Components
cp app/components/CreateInventoryListModal.tsx your-project/app/components/
cp app/admin/InventoryDataUpload.tsx your-project/app/admin/
```

### 4. Update Import Paths

In both API routes, update:
```typescript
import { prisma } from "@/lib/prisma";  // Match your project
import { auth } from "@/lib/auth";      // Match your auth system
```

In components, ensure Button component path is correct:
```typescript
import { Button } from "../components/ui/button";  // Adjust if needed
```

### 5. Add to Admin Dashboard

```typescript
import InventoryDataUpload from "@/app/admin/InventoryDataUpload";

// In your admin dashboard:
{activeTab === "inventory_upload" && (
  <InventoryDataUpload />
)}
```

---

## Detailed Setup

### Authentication Setup

**Using Better Auth** (like TreasureHub):
No changes needed.

**Using NextAuth**:
```typescript
// In API routes, replace:
const session = await auth.api.getSession({ headers: request.headers });

// With:
import { getServerSession } from "next-auth";
const session = await getServerSession(authOptions);
```

### Required API Endpoints

These should already exist:
- `GET /api/admin/inventory-lists` - Fetch all lists
- `DELETE /api/admin/inventory-lists/[id]` - Delete a list

If not, you'll need to create them (see FILE_INVENTORY.md).

### Button Component

If you don't have a Button component:

**Option A**: Install Shadcn UI
```bash
npx shadcn-ui@latest add button
```

**Option B**: Use basic button
```typescript
// Replace Button with:
<button className="px-4 py-2 bg-blue-600 text-white rounded...">
```

---

## CSV Format Setup

### Expected CSV Format

Header row (case-insensitive):
```
Lot Number, Item Number, Dept Code, Department, Item Description, Qty, Unit Retail, Ext. Retail, Vendor, Category Code, Category
```

**Example**:
```csv
Lot Number,Item Number,Dept Code,Department,Item Description,Qty,Unit Retail,Ext. Retail,Vendor,Category Code,Category
AMZ36279,ITEM-001,10,Furniture,"Blue chair, wooden",5,29.99,149.95,ACME,CAT-10,Seating
```

**Required Column**: Only `Item Number` is required (rows without it are skipped).

### Creating a CSV Template

Provide users with this template:

```csv
Lot Number,Item Number,Dept Code,Department,Item Description,Qty,Unit Retail,Ext. Retail,Vendor,Category Code,Category
,,,,,,,,,,
```

---

## Testing

### Test Data

Create this test CSV:

```csv
Lot Number,Item Number,Dept Code,Department,Item Description,Qty,Unit Retail,Ext. Retail,Vendor
TEST-01,ITEM-001,10,Electronics,Laptop Computer,1,999.99,999.99,TechCo
TEST-01,ITEM-002,10,Electronics,Wireless Mouse,5,29.99,149.95,TechCo
TEST-01,ITEM-003,20,Furniture,"Office Chair, Black",3,199.99,599.97,FurnCo
```

### Test Steps

1. Navigate to admin dashboard → Inventory → Data Upload
2. Click "Create List & Upload CSV"
3. Fill in:
   - Lot Number: TEST-01
   - Date: Today's date
   - Description: Test Inventory
4. Upload the test CSV
5. Click "Create List"
6. Verify list appears with 3 items
7. Check financial summaries are calculated
8. Test delete functionality

---

## Customization

### Brand Colors

```typescript
// In components, replace:
className="bg-[#D4AF3D] hover:bg-[#b8932f]"

// With your colors:
className="bg-yourPrimary hover:bg-yourPrimaryDark"
```

### List Name Format

In `CreateInventoryListModal.tsx`:

```typescript
const generateTitle = (lot, date, desc) => {
  // Current: "MMDDYYYY - Lot - Description"
  // Change to your format:
  return `${lot}_${desc}_${date}`;
};
```

---

## Troubleshooting

### Error: "Unauthorized"
**Fix**: Update auth import to match your system.

### Error: "prisma is not defined"
**Fix**: Update `@/lib/prisma` to your Prisma client path.

### CSV not parsing
**Fix**: Ensure CSV is comma-separated with header row.

### Items not showing
**Fix**: Check `Item Number` column exists and has values.

---

## Next Steps

1. Add inventory item viewer modal
2. Implement edit list functionality
3. Add financial data editor
4. Integrate with listing creation
5. Add inventory search/filter

See README.md for complete feature documentation.

