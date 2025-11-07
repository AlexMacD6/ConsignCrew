# TreasureHub Inventory System - Setup Guide

## 🚀 Quick Start (15 Minutes)

This guide will help you integrate TreasureHub's Inventory Management System into Selling To Sold.

---

## Prerequisites

- ✅ Next.js 13+ with App Router
- ✅ Prisma ORM configured
- ✅ PostgreSQL database
- ✅ Authentication system (Better Auth or similar)
- ✅ Admin role/permissions system

---

## Step 1: Database Setup (5 minutes)

### 1.1 Add Prisma Models

Open your `prisma/schema.prisma` and add these models at the end:

```prisma
// ============================================================================
// INVENTORY MANAGEMENT SYSTEM
// ============================================================================

model InventoryList {
  id                  String          @id @default(cuid())
  name                String
  createdBy           String?
  createdAt           DateTime        @default(now())
  updatedAt           DateTime        @updatedAt
  msrpPercentage      Float?
  serviceCharges      Float?
  shippingCharges     Float?
  totalExtRetailValue Float?
  totalPurchasePrice  Float?
  winningBidAmount    Float?
  briefDescription    String?
  datePurchased       DateTime?
  lotNumber           String?
  items               InventoryItem[]
  
  @@index([createdBy])
  @@index([createdAt])
}

model InventoryItem {
  id                   String                 @id @default(cuid())
  listId               String
  lotNumber            String?
  itemNumber           String?
  deptCode             String?
  department           String?
  description          String?
  quantity             Int?
  unitRetail           Float?
  extRetail            Float?
  vendor               String?
  categoryCode         String?
  category             String?
  purchasePrice        Float?
  createdAt            DateTime               @default(now())
  updatedAt            DateTime               @updatedAt
  list                 InventoryList          @relation(fields: [listId], references: [id], onDelete: Cascade)
  listings             Listing[]              // Link to your existing Listing model
  dispositions         InventoryDisposition[] @relation("ItemDispositions")
  
  @@index([listId])
  @@index([itemNumber])
  @@index([vendor])
  @@index([department])
  @@index([description])
}

model InventoryDisposition {
  id              String              @id @default(cuid())
  inventoryItemId String
  status          InventoryItemStatus
  quantity        Int
  notes           String?
  createdAt       DateTime            @default(now())
  updatedAt       DateTime            @updatedAt
  createdBy       String?
  InventoryItem   InventoryItem       @relation("ItemDispositions", fields: [inventoryItemId], references: [id], onDelete: Cascade)
  
  @@index([inventoryItemId])
  @@index([status])
  @@index([createdAt])
}

enum InventoryItemStatus {
  RECEIVED
  TRASH
  USE
}
```

### 1.2 Run Migration

```bash
npx prisma migrate dev --name add_inventory_system
npx prisma generate
```

---

## Step 2: Copy API Routes (3 minutes)

### 2.1 Create Directory Structure

```bash
mkdir -p app/api/admin/inventory/items/[id]/disposition
mkdir -p app/api/admin/inventory/upload
mkdir -p app/api/admin/inventory-lists/[id]
```

### 2.2 Copy Files from Export

Copy these files from the export package:

```
FROM: public/inventory-system-export/api/
TO:   app/api/admin/

├── inventory/
│   ├── items/
│   │   ├── route.ts                    ✅ Main items API
│   │   └── [id]/
│   │       └── disposition/
│   │           └── route.ts            ✅ Disposition management
│   ├── route.ts                        ✅ Legacy items fetch
│   └── upload/
│       └── route.ts                    ✅ CSV upload
└── inventory-lists/
    ├── route.ts                        ✅ List CRUD
    └── [id]/
        └── route.ts                    ✅ Single list ops
```

### 2.3 Update Import Paths

In each API file, update these imports to match your project:

```typescript
// Change this:
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

// To match your paths:
import { prisma } from "@/lib/prisma"; // or wherever your Prisma client is
import { auth } from "@/lib/auth";     // or your auth solution
```

---

## Step 3: Copy Frontend Components (3 minutes)

### 3.1 Copy Component Files

```bash
# Copy to your components directory
FROM: public/inventory-system-export/frontend/
TO:   app/admin/

├── InventoryReceiving.tsx       ✅ Main receiving interface
└── InventoryInStock.tsx         ✅ In-stock view

FROM: public/inventory-system-export/components/
TO:   app/components/

└── InventorySelector.tsx        ✅ Modal selector
```

### 3.2 Install Dependencies

```bash
npm install lucide-react
```

---

## Step 4: Integrate into Admin Dashboard (2 minutes)

### 4.1 Add Inventory Tab

In your `app/admin/page.tsx`:

```typescript
import InventoryReceiving from "./InventoryReceiving";
import InventoryInStock from "./InventoryInStock";

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("overview");
  
  return (
    <div>
      {/* Your existing tabs */}
      <button onClick={() => setActiveTab("inventory")}>
        Inventory
      </button>
      
      {/* Inventory Tab Content */}
      {activeTab === "inventory" && (
        <div className="space-y-6">
          <InventoryReceiving />
          <InventoryInStock />
        </div>
      )}
    </div>
  );
}
```

---

## Step 5: Integrate with Listing Creation (2 minutes)

### 5.1 Add to List Item Page

In your `app/(dashboard)/list-item/page.tsx` or equivalent:

```typescript
import InventorySelector from "@/components/InventorySelector";

export default function ListItemPage() {
  // Add these state variables
  const [showInventoryModal, setShowInventoryModal] = useState(false);
  const [selectedInventoryItem, setSelectedInventoryItem] = useState(null);
  const [inventoryItems, setInventoryItems] = useState([]);
  const [inventoryPage, setInventoryPage] = useState(1);
  const [inventoryTotalPages, setInventoryTotalPages] = useState(1);
  const [inventorySearchQuery, setInventorySearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("RECEIVED");
  const [showUnlistedOnly, setShowUnlistedOnly] = useState(false);
  const [isLoadingInventory, setIsLoadingInventory] = useState(false);

  // Add load function
  const loadInventoryItems = useCallback(async () => {
    setIsLoadingInventory(true);
    try {
      const params = new URLSearchParams();
      if (inventorySearchQuery) params.append("q", inventorySearchQuery);
      params.append("page", String(inventoryPage));
      params.append("limit", "25");
      if (statusFilter !== "ALL") params.append("status", statusFilter);
      if (showUnlistedOnly) params.append("unlistedOnly", "true");

      const response = await fetch(`/api/admin/inventory/items?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setInventoryItems(data.items || []);
        setInventoryTotalPages(data.pagination.totalPages || 1);
      }
    } catch (error) {
      console.error("Error loading inventory:", error);
    } finally {
      setIsLoadingInventory(false);
    }
  }, [inventorySearchQuery, inventoryPage, statusFilter, showUnlistedOnly]);

  // Add button to your form
  return (
    <form>
      {/* Your existing form fields */}
      
      <button 
        type="button"
        onClick={() => setShowInventoryModal(true)}
        className="px-4 py-2 bg-blue-500 text-white rounded"
      >
        📦 Select from Inventory
      </button>

      {/* Add selector */}
      <InventorySelector
        showInventoryModal={showInventoryModal}
        setShowInventoryModal={setShowInventoryModal}
        inventoryItems={inventoryItems}
        inventorySearchQuery={inventorySearchQuery}
        setInventorySearchQuery={setInventorySearchQuery}
        selectedInventoryItem={selectedInventoryItem}
        setSelectedInventoryItem={setSelectedInventoryItem}
        inventoryPage={inventoryPage}
        setInventoryPage={setInventoryPage}
        inventoryTotalPages={inventoryTotalPages}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        showUnlistedOnly={showUnlistedOnly}
        setShowUnlistedOnly={setShowUnlistedOnly}
        isLoadingInventory={isLoadingInventory}
        onItemsChanged={loadInventoryItems}
      />
    </form>
  );
}
```

### 5.2 Auto-fill Form from Selection

When an inventory item is selected, pre-fill your form:

```typescript
useEffect(() => {
  if (selectedInventoryItem) {
    setTitle(selectedInventoryItem.description || "");
    setPrice(String(selectedInventoryItem.unitRetail || ""));
    setBrand(selectedInventoryItem.vendor || "");
    setDepartment(selectedInventoryItem.department || "");
    // Add any other fields you want to pre-fill
  }
}, [selectedInventoryItem]);
```

---

## Step 6: Test the System (5 minutes)

### 6.1 Create Sample CSV

Create a file `test-manifest.csv`:

```csv
Lot #,Item #,Dept Code,Department,Item Description,Qty,Unit Retail,Ext. Retail,Vendor,Category Code,Category
L001,A001,10,Electronics,Samsung TV 55 inch,2,499.99,999.98,Samsung,TV01,Televisions
L001,A002,10,Electronics,Apple AirPods Pro,5,249.99,1249.95,Apple,AUDIO01,Headphones
L001,A003,20,Home,Dyson Vacuum V15,1,649.99,649.99,Dyson,CLEAN01,Vacuums
```

### 6.2 Test Workflow

1. **Create Inventory List**
   - Go to Admin Dashboard → Inventory
   - Click "Create List"
   - Name it "Test Manifest - Nov 2024"

2. **Upload CSV**
   - Click "Upload CSV"
   - Select your `test-manifest.csv`
   - Verify items appear in table

3. **Mark as Received**
   - Find an item in the Receiving tab
   - Click "Receive" button
   - Set quantity to 2
   - Submit

4. **Create Listing from Inventory**
   - Go to "List Item" page
   - Click "Select from Inventory"
   - Search for the item you just received
   - Click the item
   - Verify form is pre-filled
   - Complete and publish listing

5. **Verify Quantity Updates**
   - Go back to Inventory → In Stock
   - Verify "Available to List" decreased by 1
   - Verify "Already Listed" increased by 1

---

## Common Integration Issues

### Issue 1: Import Path Errors

**Error:** `Cannot find module '@/lib/prisma'`

**Fix:** Update imports in all API files to match your project structure:
```typescript
// Update to your actual path
import { prisma } from "../../../lib/prisma";  // or wherever
```

### Issue 2: Authentication Errors

**Error:** `Unauthorized` on API calls

**Fix:** Verify your auth setup in API routes matches your project:
```typescript
const session = await auth.api.getSession({ headers: request.headers });

// OR if using a different auth system:
const session = await getServerSession(authOptions);
```

### Issue 3: Disposition Buttons Don't Work

**Error:** `Cannot allocate quantity`

**Fix:** Ensure items are uploaded with quantity > 0 in CSV

### Issue 4: Items Don't Appear in Selector

**Error:** Empty list in modal

**Fix:** Items must be marked as RECEIVED first before they appear

---

## Advanced Configuration

### Custom CSV Format

If your vendor uses a different CSV format, update `upload/route.ts`:

```typescript
const col = {
  lot: idx("lot number"),        // Match your column headers
  item: idx("sku"),
  desc: idx("product name"),
  qty: idx("quantity"),
  unitRetail: idx("msrp"),
  // Add your columns here
};
```

### Custom Status Colors

Update colors in `InventoryReceiving.tsx`:

```typescript
{row.type === "TRASH"
  ? "bg-red-50/30"              // Change these
  : row.type === "USE"
  ? "bg-blue-50/30"
  : ""}
```

### Add Custom Fields

To track additional fields (e.g., condition, weight):

1. Add to Prisma schema:
```prisma
model InventoryItem {
  // existing fields...
  condition String?
  weight    Float?
}
```

2. Update CSV parser in `upload/route.ts`
3. Add columns to table in `InventoryReceiving.tsx`

---

## Next Steps

✅ System is now integrated!

**Recommended:**
1. Set up regular CSV imports from your suppliers
2. Train staff on disposition workflow
3. Create reports for inventory turnover
4. Set up alerts for low-stock items
5. Export trashed items for tax reporting

**Optional Enhancements:**
- Add barcode scanning for receiving
- Integrate with accounting software
- Add photo upload for dispositions
- Create bulk disposition operations
- Add inventory valuation reports

---

## Support

- 📖 Full Documentation: See `REQUIREMENTS.md`
- 🔌 API Reference: See `API_DOCUMENTATION.md`
- 📊 Database Schema: See `inventory-schema.prisma`

---

**Setup Time:** ~15 minutes
**Last Updated:** November 7, 2024
**Version:** 1.0.0

