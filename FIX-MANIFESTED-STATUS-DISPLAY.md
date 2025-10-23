# Fix: Manifested Items Showing Wrong Status

## Issue

Items that were manifested (not yet allocated to any disposition) were incorrectly showing "RECEIVED" status badge instead of "MANIFESTED".

## Root Cause

In the `getDisplayRows()` function, when an item had no dispositions but had `manifestedQuantity > 0`, we were creating a placeholder row with:
```typescript
type: "RECEIVED", // Placeholder type - WRONG!
quantity: 0,
```

This caused the UI to render a "RECEIVED" status badge for manifested items.

## Solution

### 1. Updated DisplayRow Interface

Added "MANIFESTED" as a valid type:

```typescript
interface DisplayRow {
  itemId: string;
  type: "RECEIVED" | "TRASH" | "USE" | "MANIFESTED"; // ← Added MANIFESTED
  quantity: number;
  item: Item;
  notes?: string;
}
```

### 2. Fixed getDisplayRows() Logic

Changed the placeholder row creation to use the correct type:

```typescript
// If no dispositions, show as manifested
if (dispositions.length === 0 && (item.manifestedQuantity ?? 0) > 0) {
  // Show item with MANIFESTED type
  rows.push({
    itemId: item.id,
    type: "MANIFESTED", // ← Correct type
    quantity: item.manifestedQuantity ?? 0, // ← Show actual quantity
    item,
  });
}
```

### 3. Added MANIFESTED Status Badge

Added rendering for the MANIFESTED status in the Status column:

```tsx
{/* Status column */}
<td className="py-3 px-4 border-l-2 border-gray-300">
  {row.type === "MANIFESTED" && (
    <span className="px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-800">
      MANIFESTED
    </span>
  )}
  {row.type === "RECEIVED" && (
    <span className="px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800">
      RECEIVED
    </span>
  )}
  {/* ... other statuses ... */}
</td>
```

### 4. Updated Notes Handling for Manifested Items

Since manifested items don't have dispositions yet, they can't have notes. Updated the Notes column:

```tsx
{/* Notes column */}
<td className="py-3 px-4">
  {row.type === "MANIFESTED" ? (
    <div className="text-xs text-gray-400 italic">
      Receive first to add notes
    </div>
  ) : (
    /* ... editable notes UI ... */
  )}
</td>
```

And added validation in the `saveNote()` function:

```typescript
const saveNote = async (row: DisplayRow) => {
  // For MANIFESTED rows, there's no disposition yet, so we can't save notes
  if (row.type === "MANIFESTED") {
    alert("Cannot add notes to manifested items. Please receive, trash, or use the item first.");
    cancelEditingNote();
    return;
  }
  // ... rest of save logic ...
};
```

## Status Badge Colors

| Status | Badge Color | Background | Use Case |
|--------|-------------|------------|----------|
| **MANIFESTED** | Gray | `bg-gray-100 text-gray-800` | Items not yet allocated |
| **RECEIVED** | Green | `bg-green-100 text-green-800` | Items received for resale |
| **TRASH** | Red | `bg-red-100 text-red-800` | Disposed items |
| **USE** | Blue | `bg-blue-100 text-blue-800` | Items for business use |

## User Experience

**Before:**
- Manifested items showed "RECEIVED" status ❌
- Confusing - users thought items were already received
- Status didn't match the actual state

**After:**
- Manifested items show "MANIFESTED" status ✅
- Clear distinction between manifested vs. received
- Status accurately reflects item state
- Notes column shows "Receive first to add notes" for manifested items

## Testing

1. Navigate to Inventory Receiving tab
2. Filter by "Manifested" in the dropdown
3. Verify items show:
   - Status badge: "MANIFESTED" (gray background)
   - Notes column: "Receive first to add notes"
4. Click "Receive" on a manifested item
5. After receiving, verify status changes to "RECEIVED" (green)
6. Verify you can now add notes to the received item

## Technical Notes

- Manifested items are those with `manifestedQuantity > 0` but no `InventoryDisposition` records
- Once an item is received, trashed, or used, it gets an `InventoryDisposition` record and is no longer considered "manifested"
- The quantity shown for manifested rows now correctly shows `item.manifestedQuantity` instead of `0`



