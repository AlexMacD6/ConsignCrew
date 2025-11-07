# TreasureHub Inventory Management System - Complete Export

## 📋 Table of Contents
1. [Overview](#overview)
2. [System Architecture](#system-architecture)
3. [Core Features](#core-features)
4. [Database Schema](#database-schema)
5. [API Endpoints](#api-endpoints)
6. [Frontend Components](#frontend-components)
7. [Setup Instructions](#setup-instructions)
8. [File Inventory](#file-inventory)

---

## 🎯 Overview

This is a complete export of TreasureHub's **Inventory Management System** - a sophisticated inventory tracking and disposition management solution built for resale operations.

### Key Capabilities:
- **CSV Manifest Upload** - Import inventory manifests from liquidation purchases
- **Disposition Tracking** - Mark items as RECEIVED (for resale), TRASH (disposed), or USE (personal/tax write-off)
- **Real-time Status Tracking** - Monitor manifested, received, trashed, and used quantities
- **Searchable Interface** - Full-text search across all inventory fields
- **List Management** - Organize inventory by purchase lots/deliveries
- **Integration Ready** - Links directly to listing creation workflow

---

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    INVENTORY SYSTEM                          │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────┐    ┌───────────────┐    ┌─────────────┐ │
│  │   CSV Upload │───▶│ Inventory DB  │◀───│  Receiving  │ │
│  └──────────────┘    └───────────────┘    └─────────────┘ │
│                              │                              │
│                              ▼                              │
│                  ┌───────────────────────┐                 │
│                  │  Disposition System   │                 │
│                  │  • RECEIVED           │                 │
│                  │  • TRASH              │                 │
│                  │  • USE                │                 │
│                  └───────────────────────┘                 │
│                              │                              │
│                              ▼                              │
│                  ┌───────────────────────┐                 │
│                  │   Listing Creation    │                 │
│                  │   (InventorySelector) │                 │
│                  └───────────────────────┘                 │
└─────────────────────────────────────────────────────────────┘
```

---

## ✨ Core Features

### 1. **Inventory List Management**
- Create inventory lists (delivery lots)
- Track financial metrics (winning bid, service charges, shipping, MSRP %)
- View total units and item counts per list

### 2. **CSV Manifest Import**
- Parse CSV files from liquidation vendors
- Support for quoted fields (handles commas in descriptions)
- Automatic calculation of extended retail values
- Batch processing for large files (chunked inserts)

**Expected CSV Format:**
```csv
Lot #,Item #,Dept Code,Department,Item Description,Qty,Unit Retail,Ext. Retail,Vendor,Category Code,Category
L001,A123,10,Electronics,"Samsung TV, 55 inch",2,499.99,999.98,Samsung,CAT01,Televisions
```

### 3. **Disposition Management**
Items move through these statuses:
- **MANIFESTED** - Just uploaded, not yet processed
- **RECEIVED** - Ready for resale (available for listing)
- **TRASH** - Damaged/unsellable, disposed
- **USE** - Personal use or business use (tax write-off)

**Key Business Logic:**
- Only RECEIVED items can be listed for sale
- Quantities can be split across statuses
- System prevents over-allocation beyond total quantity
- Reallocation automatically deallocates from other statuses

### 4. **Receiving Interface**
The `InventoryReceiving` component provides:
- **Tabular view** showing all disposition statuses
- **Row splitting** - Items with multiple dispositions show multiple rows
- **Status counts** - Real-time quantity tracking
- **Modal workflow** - Set quantities and add notes
- **Search & filters** - Find items quickly
- **Color coding** - Visual status indicators

### 5. **In-Stock View**
The `InventoryInStock` component shows:
- Only items with RECEIVED status
- Available quantity for listing
- Unit pricing (MSRP and purchase cost)
- Searchable interface

### 6. **Inventory Selector (for Listing Creation)**
The `InventorySelector` component enables:
- **Modal popup** during listing creation
- **Search across all fields** (item #, description, vendor, dept)
- **Status filtering** (show only received items)
- **"Unlisted Only" toggle** - Show items not yet listed
- **Real-time disposition** - Receive/Trash/Use directly from selector
- **Smart validation** - Prevents listing un-received items
- **Quantity tracking** - Shows available to list vs already listed

---

## 🗄️ Database Schema

### Core Models

#### **InventoryList**
```prisma
model InventoryList {
  id                  String          @id @default(cuid())
  name                String          // e.g., "Home Depot Returns - March 2024"
  createdBy           String?
  createdAt           DateTime        @default(now())
  updatedAt           DateTime        @updatedAt
  
  // Financial tracking
  msrpPercentage      Float?          // What % of MSRP was paid
  serviceCharges      Float?
  shippingCharges     Float?
  totalExtRetailValue Float?          // Total MSRP value
  totalPurchasePrice  Float?          // Total paid
  winningBidAmount    Float?
  
  // Lot metadata
  briefDescription    String?
  datePurchased       DateTime?
  lotNumber           String?
  
  items               InventoryItem[] // One-to-many relationship
}
```

#### **InventoryItem**
```prisma
model InventoryItem {
  id                   String                 @id @default(cuid())
  listId               String                 // Foreign key to InventoryList
  
  // Item identification
  lotNumber            String?
  itemNumber           String?                // Unique item # from vendor
  
  // Classification
  deptCode             String?
  department           String?
  categoryCode         String?
  category             String?
  
  // Description & pricing
  description          String?
  vendor               String?
  quantity             Int?                   // Total quantity
  unitRetail           Float?                 // MSRP per unit
  extRetail            Float?                 // Total MSRP (qty × unit)
  purchasePrice        Float?                 // What was paid (total for this SKU)
  
  createdAt            DateTime               @default(now())
  updatedAt            DateTime               @updatedAt
  
  // Relations
  list                 InventoryList          @relation(fields: [listId], references: [id], onDelete: Cascade)
  listings             Listing[]              // Items that were listed for sale
  dispositions         InventoryDisposition[] // Disposition records
  
  @@index([listId])
  @@index([itemNumber])
  @@index([vendor])
  @@index([department])
}
```

#### **InventoryDisposition**
```prisma
model InventoryDisposition {
  id              String              @id @default(cuid())
  inventoryItemId String              // Foreign key to InventoryItem
  
  status          InventoryItemStatus // RECEIVED | TRASH | USE
  quantity        Int                 // How many units
  notes           String?             // Optional reason/notes
  
  createdAt       DateTime            @default(now())
  updatedAt       DateTime            @updatedAt
  createdBy       String?             // User who created this
  
  InventoryItem   InventoryItem       @relation(fields: [inventoryItemId], references: [id], onDelete: Cascade)
  
  @@index([inventoryItemId])
  @@index([status])
}

enum InventoryItemStatus {
  RECEIVED  // Ready for resale
  TRASH     // Disposed/unsellable
  USE       // Personal/business use
}
```

### Calculated Fields (API Layer)
These are computed at runtime from the dispositions:
- `receivedQuantity` - Sum of all RECEIVED dispositions
- `trashedQuantity` - Sum of all TRASH dispositions
- `usedQuantity` - Sum of all USE dispositions
- `manifestedQuantity` - `quantity - (received + trashed + used)`
- `postedListings` - Count of active listings
- `availableToList` - `receivedQuantity - postedListings`
- `unitPurchasePrice` - `purchasePrice / quantity` (calculated)

---

## 🔌 API Endpoints

### **GET /api/admin/inventory-lists**
Fetch all inventory lists with metadata.

**Response:**
```json
{
  "success": true,
  "lists": [
    {
      "id": "list_123",
      "name": "Home Depot Returns - March 2024",
      "totalUnits": 150,
      "totalExtRetailValue": 45000.00,
      "totalPurchasePrice": 9000.00,
      "msrpPercentage": 20,
      "_count": { "items": 75 },
      "createdAt": "2024-03-01T10:00:00Z"
    }
  ]
}
```

### **POST /api/admin/inventory-lists**
Create a new inventory list.

**Request:**
```json
{
  "name": "Amazon Returns - April 2024"
}
```

### **POST /api/admin/inventory/upload**
Upload CSV manifest to create inventory items.

**Request (FormData):**
```
file: <CSV file>
listId: "list_123"
```

**Response:**
```json
{
  "success": true,
  "listId": "list_123",
  "count": 75
}
```

### **GET /api/admin/inventory/items**
Fetch inventory items with filters and pagination.

**Query Parameters:**
- `q` - Search query (description, item #, vendor, dept)
- `listId` - Filter by inventory list
- `status` - Filter by disposition status (ALL|MANIFESTED|RECEIVED|TRASH|USE)
- `inStock` - Show only received items (true|false)
- `unlistedOnly` - Show only items not yet listed (true|false)
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 25)

**Response:**
```json
{
  "success": true,
  "items": [
    {
      "id": "item_456",
      "itemNumber": "A123",
      "description": "Samsung TV, 55 inch",
      "vendor": "Samsung",
      "unitRetail": 499.99,
      "quantity": 10,
      "totalQuantity": 10,
      "receivedQuantity": 8,
      "trashedQuantity": 1,
      "usedQuantity": 0,
      "manifestedQuantity": 1,
      "postedListings": 3,
      "availableToList": 5,
      "list": {
        "id": "list_123",
        "name": "Home Depot Returns"
      },
      "dispositions": [
        {
          "id": "disp_789",
          "status": "RECEIVED",
          "quantity": 8,
          "notes": null
        }
      ]
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 25,
    "total": 75,
    "totalPages": 3
  },
  "statusCounts": {
    "MANIFESTED": 15,
    "RECEIVED": 50,
    "TRASH": 5,
    "USE": 5
  }
}
```

### **POST /api/admin/inventory/items/{id}/disposition**
Add quantity to a disposition status (incremental).

**Request:**
```json
{
  "status": "RECEIVED",
  "quantity": 5,
  "notes": "Items in good condition"
}
```

**Logic:**
- Adds to existing disposition or creates new one
- Validates available quantity
- Cannot exceed manifested quantity

### **PUT /api/admin/inventory/items/{id}/disposition**
Set total quantity for a disposition status (absolute).

**Request:**
```json
{
  "status": "RECEIVED",
  "quantity": 8,
  "notes": "Updated after inspection"
}
```

**Logic:**
- Sets the total quantity for this status
- Automatically deallocates from other statuses if needed
- Setting to 0 removes the disposition

### **GET /api/admin/inventory/items/{id}/disposition**
Get all disposition records for an item.

**Response:**
```json
{
  "dispositions": [
    {
      "id": "disp_789",
      "status": "RECEIVED",
      "quantity": 8,
      "notes": null,
      "createdAt": "2024-03-15T14:30:00Z"
    }
  ]
}
```

---

## 🎨 Frontend Components

### 1. **InventoryReceiving.tsx**
**Location:** `app/admin/InventoryReceiving.tsx`

**Purpose:** Main receiving interface for processing manifested inventory.

**Features:**
- Tabular display with row splitting for multiple dispositions
- Status counts (Manifested, Received, Trash, Use)
- Search and status filtering
- Action buttons (Receive, Trash, Use)
- Modal for setting quantities and notes
- Pagination
- Debounced search

**State Management:**
```typescript
const [items, setItems] = useState<Item[]>([]);
const [status, setStatus] = useState<"ALL"|"MANIFESTED"|"RECEIVED"|"TRASH"|"USE">("ALL");
const [page, setPage] = useState(1);
const [modal, setModal] = useState<ModalState>(...);
```

**Key Methods:**
- `fetchItems()` - Loads items from API
- `getDisplayRows()` - Splits items by disposition for table display
- `openModal()` - Opens disposition modal
- `handleModalSubmit()` - Submits disposition change

### 2. **InventoryInStock.tsx**
**Location:** `app/admin/InventoryInStock.tsx`

**Purpose:** View all received inventory available for listing.

**Features:**
- Shows only items with `receivedQuantity > 0`
- Displays in-stock quantity (received quantity)
- Unit pricing information
- Search functionality
- Pagination

### 3. **InventorySelector.tsx**
**Location:** `app/components/InventorySelector.tsx`

**Purpose:** Modal component for selecting inventory during listing creation.

**Features:**
- Full-screen modal overlay
- Search across all fields
- Status filter dropdown (Received, All, Manifested, Trash, Use)
- "Unlisted Only" toggle
- Disposition action buttons (Receive/Trash/Use)
- Color-coded status badges
- Quantity tracking display
- Smart click validation (only received items)
- Nested disposition modal

**Usage Example:**
```typescript
<InventorySelector
  showInventoryModal={showInventoryModal}
  setShowInventoryModal={setShowInventoryModal}
  inventoryItems={inventoryItems}
  inventorySearchQuery={searchQuery}
  setInventorySearchQuery={setSearchQuery}
  selectedInventoryItem={selectedItem}
  setSelectedInventoryItem={setSelectedItem}
  inventoryPage={page}
  setInventoryPage={setPage}
  inventoryTotalPages={totalPages}
  statusFilter={statusFilter}
  setStatusFilter={setStatusFilter}
  showUnlistedOnly={showUnlistedOnly}
  setShowUnlistedOnly={setShowUnlistedOnly}
  isLoadingInventory={loading}
  onItemsChanged={() => fetchItems()}
/>
```

---

## 🚀 Setup Instructions

### Step 1: Database Setup

1. **Add Prisma Schema**
   
   Copy the schema from `prisma/inventory-schema.prisma` to your `schema.prisma`:
   ```prisma
   // Add these models to your schema
   model InventoryList { ... }
   model InventoryItem { ... }
   model InventoryDisposition { ... }
   enum InventoryItemStatus { ... }
   ```

2. **Run Migration**
   ```bash
   npx prisma migrate dev --name add_inventory_system
   ```

3. **Generate Prisma Client**
   ```bash
   npx prisma generate
   ```

### Step 2: API Routes Setup

1. **Copy API Files**
   ```
   app/api/admin/inventory/
   ├── items/
   │   ├── route.ts
   │   └── [id]/
   │       └── disposition/
   │           └── route.ts
   ├── route.ts
   ├── upload/
   │   └── route.ts
   app/api/admin/inventory-lists/
   ├── route.ts
   └── [id]/
       └── route.ts
   ```

2. **Update Imports**
   - Ensure `@/lib/prisma` points to your Prisma client
   - Ensure `@/lib/auth` points to your auth solution

### Step 3: Frontend Components

1. **Copy Components**
   ```
   app/admin/
   ├── InventoryReceiving.tsx
   └── InventoryInStock.tsx
   
   app/components/
   └── InventorySelector.tsx
   ```

2. **Install Dependencies**
   ```bash
   npm install lucide-react
   ```

3. **Update Admin Dashboard**
   
   Add inventory tab to your admin dashboard (`app/admin/page.tsx`):
   ```typescript
   const [activeTab, setActiveTab] = useState("overview");
   
   // Add to tabs
   {activeTab === "inventory" && (
     <div>
       <InventoryReceiving />
       <InventoryInStock />
     </div>
   )}
   ```

### Step 4: Integration with Listing Creation

In your `list-item/page.tsx`:

1. **Add State**
   ```typescript
   const [showInventoryModal, setShowInventoryModal] = useState(false);
   const [selectedInventoryItem, setSelectedInventoryItem] = useState(null);
   const [inventoryItems, setInventoryItems] = useState([]);
   ```

2. **Load Inventory Function**
   ```typescript
   const loadInventoryItems = useCallback(async () => {
     const params = new URLSearchParams({
       page: String(inventoryPage),
       limit: "25",
       status: statusFilter,
       unlistedOnly: showUnlistedOnly.toString(),
     });
     
     const response = await fetch(`/api/admin/inventory/items?${params}`);
     const data = await response.json();
     setInventoryItems(data.items || []);
     setInventoryTotalPages(data.pagination.totalPages || 1);
   }, [inventoryPage, statusFilter, showUnlistedOnly]);
   ```

3. **Add Button**
   ```typescript
   <button onClick={() => setShowInventoryModal(true)}>
     Select from Inventory
   </button>
   ```

4. **Add Selector Component**
   ```typescript
   <InventorySelector
     showInventoryModal={showInventoryModal}
     setShowInventoryModal={setShowInventoryModal}
     inventoryItems={inventoryItems}
     // ... other props
   />
   ```

5. **Pre-fill Form**
   When inventory item is selected, auto-fill:
   - Title → `description`
   - Price → `unitRetail`
   - Brand → `vendor`
   - Department → `department`

### Step 5: Permissions & Security

1. **Add Admin Check**
   All inventory API routes require admin authentication:
   ```typescript
   const session = await auth.api.getSession({ headers: request.headers });
   if (!session?.user?.id) {
     return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
   }
   ```

2. **Add Role Check** (if using roles)
   ```typescript
   const user = await prisma.user.findUnique({
     where: { id: session.user.id },
     include: { members: { include: { organization: true } } },
   });
   
   const isAdmin = user?.members.some(m => 
     m.role === 'ADMIN' || m.role === 'OWNER'
   );
   
   if (!isAdmin) {
     return NextResponse.json({ error: "Forbidden" }, { status: 403 });
   }
   ```

---

## 📁 File Inventory

### Frontend Files
```
✅ InventoryReceiving.tsx         - Main receiving interface
✅ InventoryInStock.tsx           - In-stock view
✅ InventorySelector.tsx          - Modal selector for listing creation
```

### API Routes
```
✅ /api/admin/inventory-lists/route.ts                  - List CRUD
✅ /api/admin/inventory-lists/[id]/route.ts             - Single list operations
✅ /api/admin/inventory/route.ts                        - Legacy items fetch
✅ /api/admin/inventory/items/route.ts                  - Main items API
✅ /api/admin/inventory/items/[id]/disposition/route.ts - Disposition management
✅ /api/admin/inventory/upload/route.ts                 - CSV upload
```

### Database Schema
```
✅ Prisma schema for InventoryList
✅ Prisma schema for InventoryItem
✅ Prisma schema for InventoryDisposition
✅ Enum for InventoryItemStatus
```

### Supporting Files
```
📄 REQUIREMENTS.md               - This file
📄 SETUP_GUIDE.md                - Step-by-step setup
📄 API_DOCUMENTATION.md          - API reference
📄 inventory-schema.prisma       - Isolated Prisma schema
```

---

## 🧪 Testing Checklist

- [ ] Upload CSV manifest
- [ ] Search for items
- [ ] Mark items as RECEIVED
- [ ] Mark items as TRASH with notes
- [ ] Mark items as USE
- [ ] Verify status counts update
- [ ] Test pagination
- [ ] Open inventory selector during listing
- [ ] Select item and verify form pre-fill
- [ ] Verify only RECEIVED items are selectable
- [ ] Test "Unlisted Only" filter
- [ ] Verify disposition prevents over-allocation
- [ ] Test disposition reallocation (PUT endpoint)

---

## 🔧 Customization Points

### 1. **CSV Format**
Modify `parseCsv()` in `upload/route.ts` to match your vendor's format:
```typescript
const col = {
  lot: idx("lot"),
  item: idx("item"),
  // Add your columns here
};
```

### 2. **Status Colors**
Update color coding in components:
```typescript
// InventoryReceiving.tsx
{row.type === "TRASH" ? "bg-red-50/30" : "bg-blue-50/30"}
```

### 3. **Validation Rules**
Modify disposition logic in disposition API:
```typescript
if (newQuantity > maxAllowedForThisStatus) {
  return NextResponse.json({ error: "..." }, { status: 400 });
}
```

### 4. **Fields Displayed**
Add/remove columns in table:
```typescript
<th className="py-3 px-4">Your Column</th>
```

---

## 📊 Business Metrics

### Key Reports You Can Build:
1. **Inventory Turnover** - Track time from manifest to listing
2. **Disposition Rate** - % received vs trash vs use
3. **MSRP Performance** - Compare purchase price to MSRP
4. **Vendor Analysis** - Best/worst vendors by disposition
5. **Category Performance** - Top selling departments/categories
6. **Loss Analysis** - Value of trashed items
7. **Tax Reporting** - Items marked for USE (business use tax)

### Sample Queries:
```typescript
// Total value trashed
const trashedValue = await prisma.inventoryDisposition.aggregate({
  where: { status: 'TRASH' },
  _sum: {
    quantity: true
  }
});

// Inventory turnover time
const avgTurnover = await prisma.$queryRaw`
  SELECT AVG(EXTRACT(EPOCH FROM (l.created_at - ii.created_at)) / 86400) as avg_days
  FROM "Listing" l
  JOIN "InventoryItem" ii ON l."inventoryItemId" = ii.id
`;
```

---

## 🆘 Troubleshooting

### Issue: "Cannot allocate quantity"
**Cause:** Trying to set disposition beyond available quantity.
**Solution:** Check `manifestedQuantity` - you may need to deallocate from other statuses first.

### Issue: "Item must be received before listing"
**Cause:** Trying to select un-received item.
**Solution:** Use disposition buttons to mark items as RECEIVED first.

### Issue: CSV upload fails
**Cause:** Column headers don't match expected format.
**Solution:** Check `parseCsv()` function and update column mapping.

### Issue: Counts don't match
**Cause:** Stale disposition data.
**Solution:** The API calculates counts dynamically - ensure you're using the API response, not database directly.

---

## 📞 Support

For questions or issues integrating this system into Selling To Sold:
1. Check the API documentation for endpoint details
2. Review the Prisma schema for data relationships
3. Test with sample CSV data first
4. Verify admin authentication is working

---

## 📝 License

This export is provided for use in the Selling To Sold application.
Maintain attribution to TreasureHub in code comments.

---

**Last Updated:** November 7, 2024
**Version:** 1.0.0
**Exported From:** TreasureHub Admin Inventory System

