# Fix: Status Counts Now Show Total Quantities

## Issue

The status count badges at the top of the Inventory Receiving page were showing the **number of line items** instead of the **total quantity** of items.

**Example:**
- User trashed 2 units of an item
- Badge showed: "Trash: 1" (1 line item)
- Expected: "Trash: 2" (2 units total)

## Root Cause

The status counts were using `.filter().length` which counts the number of items, not the sum of quantities:

```typescript
// Before - Counting items (wrong)
TRASH: itemsWithUnit.filter(item => item.trashedQuantity > 0).length
```

This counted how many items had `trashedQuantity > 0`, not the total quantity trashed.

## Solution

Changed the calculation to use `.reduce()` to sum up the actual quantities:

```typescript
// After - Summing quantities (correct)
TRASH: itemsWithUnit.reduce((sum, item) => sum + (item.trashedQuantity || 0), 0)
```

### Complete Fix

**File:** `app/api/admin/inventory/items/route.ts`

```typescript
// Calculate status counts from the items - sum quantities, not count items
const statusCounts = {
  MANIFESTED: itemsWithUnit.reduce((sum, item) => sum + (item.manifestedQuantity || 0), 0),
  RECEIVED: itemsWithUnit.reduce((sum, item) => sum + (item.receivedQuantity || 0), 0),
  TRASH: itemsWithUnit.reduce((sum, item) => sum + (item.trashedQuantity || 0), 0),
  USE: itemsWithUnit.reduce((sum, item) => sum + (item.usedQuantity || 0), 0),
};
```

## How It Works

### Before:
```typescript
// Item A: 2 units trashed
// Item B: 1 unit trashed
// Item C: 0 units trashed

.filter(item => item.trashedQuantity > 0).length
// Returns: 2 (Item A and Item B)
```

### After:
```typescript
// Item A: 2 units trashed
// Item B: 1 unit trashed  
// Item C: 0 units trashed

.reduce((sum, item) => sum + (item.trashedQuantity || 0), 0)
// Returns: 3 (2 + 1 + 0)
```

## Impact

All four status count badges now show total quantities:

| Badge | What It Shows |
|-------|---------------|
| **Manifested** | Total quantity not yet allocated to any disposition |
| **Received** | Total quantity marked as received for resale |
| **Trash** | Total quantity marked as disposed/damaged |
| **Use** | Total quantity marked for business use |

## Testing

1. Navigate to Inventory Receiving tab
2. Note current counts
3. Trash 2 units of an item
4. Verify "Trash" count increases by 2 (not 1)
5. Receive 5 units across multiple items
6. Verify "Received" count shows total of all received units

## Example Scenarios

### Scenario 1: Multiple items, different statuses
- Item A: 2 manifested, 3 received, 1 trashed
- Item B: 5 manifested
- Item C: 2 received, 1 used

**Status Counts:**
- Manifested: 7 (2 + 5 + 0)
- Received: 5 (3 + 0 + 2)
- Trash: 1 (1 + 0 + 0)
- Use: 1 (0 + 0 + 1)

### Scenario 2: Same item, split dispositions
- Item A: 10 total units
  - 3 received
  - 2 trashed
  - 1 used
  - 4 manifested

**Status Counts Contribution from Item A:**
- Manifested: +4
- Received: +3
- Trash: +2
- Use: +1














