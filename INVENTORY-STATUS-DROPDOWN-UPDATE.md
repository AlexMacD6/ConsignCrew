# Inventory Status Dropdown Update

## Summary

Updated the Inventory Receiving tab status filter dropdown to reflect the new disposition-based system, removing the outdated "Partially Received" status and adding new status options: RECEIVED, TRASH, and USE.

## Changes Made

### 1. Frontend - `app/admin/InventoryReceiving.tsx`

**Status Type Update:**
```typescript
// Before
const [status, setStatus] = useState<
  "ALL" | "MANIFESTED" | "PARTIALLY_RECEIVED" | "RECEIVED"
>("ALL");

// After
const [status, setStatus] = useState<
  "ALL" | "MANIFESTED" | "RECEIVED" | "TRASH" | "USE"
>("ALL");
```

**Status Counts Update:**
```typescript
// Before
const [statusCounts, setStatusCounts] = useState({
  MANIFESTED: 0,
  PARTIALLY_RECEIVED: 0,
  RECEIVED: 0,
});

// After
const [statusCounts, setStatusCounts] = useState({
  MANIFESTED: 0,
  RECEIVED: 0,
  TRASH: 0,
  USE: 0,
});
```

**Dropdown Options Update:**
```tsx
<select value={status} onChange={(e) => {...}}>
  <option value="ALL">All</option>
  <option value="MANIFESTED">Manifested</option>
  <option value="RECEIVED">Received</option>
  <option value="TRASH">Trash</option>
  <option value="USE">Use</option>
</select>
```

**Status Count Badges:**
- Removed: "Partial" (yellow badge)
- Added: "Trash" (red badge) and "Use" (blue badge)
- Kept: "Manifested" (gray badge) and "Received" (green badge)

### 2. Backend - `app/api/admin/inventory/items/route.ts`

**Status Counts Calculation:**
```typescript
// Before
const statusCounts = {
  MANIFESTED: itemsWithUnit.filter(item => 
    item.manifestedQuantity > 0 && item.receivedQuantity === 0
  ).length,
  PARTIALLY_RECEIVED: itemsWithUnit.filter(item => 
    item.manifestedQuantity > 0 && item.receivedQuantity > 0
  ).length,
  RECEIVED: itemsWithUnit.filter(item => 
    item.manifestedQuantity === 0 && item.receivedQuantity > 0
  ).length,
};

// After
const statusCounts = {
  MANIFESTED: itemsWithUnit.filter(item => item.manifestedQuantity > 0).length,
  RECEIVED: itemsWithUnit.filter(item => item.receivedQuantity > 0).length,
  TRASH: itemsWithUnit.filter(item => item.trashedQuantity > 0).length,
  USE: itemsWithUnit.filter(item => item.usedQuantity > 0).length,
};
```

**Status Filtering Logic:**
```typescript
// Before
if (statusParam === "MANIFESTED") {
  filteredItems = filteredItems.filter(item => 
    item.manifestedQuantity > 0 && item.receivedQuantity === 0
  );
} else if (statusParam === "PARTIALLY_RECEIVED") {
  filteredItems = filteredItems.filter(item => 
    item.manifestedQuantity > 0 && item.receivedQuantity > 0
  );
} else if (statusParam === "RECEIVED") {
  filteredItems = filteredItems.filter(item => 
    item.manifestedQuantity === 0 && item.receivedQuantity > 0
  );
}

// After
if (statusParam === "MANIFESTED") {
  filteredItems = filteredItems.filter(item => item.manifestedQuantity > 0);
} else if (statusParam === "RECEIVED") {
  filteredItems = filteredItems.filter(item => item.receivedQuantity > 0);
} else if (statusParam === "TRASH") {
  filteredItems = filteredItems.filter(item => item.trashedQuantity > 0);
} else if (statusParam === "USE") {
  filteredItems = filteredItems.filter(item => item.usedQuantity > 0);
}
```

## New Status Meanings

| Status | Description | When to Use |
|--------|-------------|-------------|
| **ALL** | Show all items regardless of status | Default view |
| **MANIFESTED** | Items that haven't been allocated to any disposition yet | Items waiting to be received/processed |
| **RECEIVED** | Items marked as received for normal resale | Normal inventory items |
| **TRASH** | Items marked as damaged/unsellable | Disposed items |
| **USE** | Items kept for personal/business use | Use tax applicable items |

## Key Differences from Old System

### Before (Status-based):
- **MANIFESTED**: Not received at all
- **PARTIALLY_RECEIVED**: Some received, some still manifested
- **RECEIVED**: All units received

### After (Disposition-based):
- Items can have multiple dispositions simultaneously
- Each disposition tracks a specific quantity and status
- Status filter shows items that have ANY quantity in that status
- Example: An item with 2 total units can have:
  - 1 unit RECEIVED
  - 1 unit TRASH
  - This item would appear in both "RECEIVED" and "TRASH" filters

## User Experience

**Filtering:**
- Select "MANIFESTED" → See items with unallocated quantities
- Select "RECEIVED" → See items with at least 1 unit marked as received
- Select "TRASH" → See items with at least 1 unit marked as trash
- Select "USE" → See items with at least 1 unit marked for use
- Select "ALL" → See everything

**Status Counts:**
- Counts show how many unique items have at least 1 unit in that status
- An item with mixed statuses (e.g., 1 RECEIVED, 1 TRASH) counts in both

## Testing

1. Navigate to `/admin` → Inventory tab
2. Check that dropdown shows: All, Manifested, Received, Trash, Use
3. Check that status count badges show all 4 statuses
4. Filter by each status and verify correct items appear
5. Verify items with mixed dispositions appear in multiple filters





