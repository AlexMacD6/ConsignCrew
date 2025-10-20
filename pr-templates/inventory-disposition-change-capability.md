## Changelog

### Added Disposition Change Capability for Received Items

Enhanced the inventory receiving system to allow administrators to change the disposition status of items after they've been received, providing flexibility to reclassify items as needed.

#### API Changes
- Added `PUT` endpoint to existing disposition route: `PUT /api/admin/inventory/items/[id]/disposition`
  - Allows changing disposition between: `RECEIVED` (normal), `TRASH`, `USE`
  - Automatically handles quantity adjustments
  - Tracks who made the change and when
  - Supports optional notes for audit trail

#### UI Changes
- **Replaced static disposition display with dropdown menu** in "Disposed" column
  - Dropdown appears for all items that have been received (`receivedQuantity > 0`)
  - Three options:
    - **Received (Normal)**: Default status, item received for resale
    - **Trash (Disposed)**: Item damaged, unsellable, thrown out
    - **Use (Personal/Business)**: Item kept for personal/business use (use tax applicable)
- Dropdown only shows for received items (prevents changes to unprocessed items)
- Visual chips still display below dropdown to show current disposition status
- Maintains existing notes prompt system for TRASH and USE dispositions

#### Features
- **Flexible status changes**: Change disposition at any time after receiving
- **Audit trail**: Tracks `dispositionBy`, `dispositionAt` for all changes
- **Smart quantity handling**: Automatically adjusts `dispositionQuantity` based on `receivedQuantity`
- **Prevents data loss**: Prompts for confirmation and notes before making changes
- **User-friendly**: Simple dropdown interface, no complex multi-step process

#### Use Cases
1. **Correction**: Item initially marked as RECEIVED but found to be damaged → change to TRASH
2. **Reclassification**: Item marked as USE but decided to sell → change back to RECEIVED
3. **Audit compliance**: Change disposition for tax reporting purposes
4. **Inventory adjustments**: Update status after physical inventory count

#### Technical Details
- `PUT` vs `POST`: 
  - `POST` is for initial disposition assignment with specific quantity
  - `PUT` is for changing existing disposition (uses all received quantity)
- Backward compatible with existing receiving workflow
- No changes to database schema required (uses existing disposition fields)

#### Affected Files
- `app/api/admin/inventory/items/[id]/disposition/route.ts` - Added PUT endpoint
- `app/admin/InventoryReceiving.tsx` - Added dropdown UI and change handler

---

## Testing Instructions

### Prerequisites
1. Pull this branch
2. Database must have the inventory disposition schema (from previous PR)
3. Start application: `npm run dev`
4. Navigate to Admin Dashboard → Inventory → Receiving

### Test Scenarios

#### 1. Test Dropdown Appears for Received Items
1. Find an item that has NOT been received yet (`Received` column shows 0)
2. Verify the "Disposed" column shows "—" (no dropdown)
3. Receive at least 1 unit of that item using the "Receive" button
4. Page refreshes
5. Verify the "Disposed" column now shows a dropdown menu
6. Verify dropdown is set to "Received (Normal)"

#### 2. Test Change from RECEIVED to TRASH
1. Find an item with received quantity > 0
2. Open the disposition dropdown
3. Select "Trash (Disposed)"
4. In the prompt, enter reason: "Damaged in transit"
5. Click OK
6. Verify:
   - Page refreshes
   - Dropdown now shows "Trash (Disposed)" selected
   - Red "TRASH" chip appears below dropdown
   - Quantity shown reflects received amount

#### 3. Test Change from RECEIVED to USE
1. Find another received item
2. Open the disposition dropdown
3. Select "Use (Personal/Business)"
4. In the prompt, enter: "Office supplies"
5. Click OK
6. Verify:
   - Page refreshes
   - Dropdown shows "Use (Personal/Business)" selected
   - Blue "USE" chip appears below dropdown

#### 4. Test Change Back to RECEIVED
1. Find an item currently set to TRASH or USE
2. Open the disposition dropdown
3. Select "Received (Normal)"
4. Verify:
   - Page refreshes immediately (no prompt needed)
   - Dropdown shows "Received (Normal)" selected
   - Disposition chip disappears (normal received has no chip)
   - Item is back to normal inventory status

#### 5. Test Cancel Operation
1. Find a received item
2. Open dropdown and select "Trash (Disposed)"
3. When prompt appears, click "Cancel"
4. Verify:
   - No change is made
   - Dropdown returns to previous value
   - No page refresh

#### 6. Test Multiple Status Changes
1. Start with item in RECEIVED status
2. Change to TRASH
3. Wait for refresh
4. Change to USE
5. Wait for refresh
6. Change back to RECEIVED
7. Verify each change is reflected correctly

#### 7. Test Unprocessed Items
1. Find an item that has never been received (quantity 0)
2. Verify "Disposed" column shows "—" with no dropdown
3. This prevents premature disposition assignment

#### 8. Test Notes Persistence
1. Change an item to TRASH with note "Test damage reason"
2. After refresh, hover or check if notes are visible
3. Change to USE with note "Test use reason"
4. Verify notes are tracked (check disposition notes in database or item detail)

### Visual Verification
- Dropdown appears clean and professional
- Dropdown is small/compact (text-xs class)
- Gold focus ring (`#D4AF3D`) appears when dropdown is focused
- Disposition chips (red for TRASH, blue for USE) display below dropdown
- Layout doesn't break with dropdown + chip combination

### Database Verification (Optional)
After making several disposition changes, query the database:

```sql
SELECT 
  "itemNumber",
  "description",
  "receivedQuantity",
  "disposition",
  "dispositionQuantity",
  "dispositionNotes",
  "dispositionBy",
  "dispositionAt"
FROM "InventoryItem"
WHERE "receivedQuantity" > 0
ORDER BY "dispositionAt" DESC;
```

Verify:
- `disposition` reflects current selection
- `dispositionQuantity` matches `receivedQuantity` when disposition is set
- `dispositionBy` and `dispositionAt` are updated with each change

### Edge Cases to Test
1. **Rapid changes**: Change disposition multiple times quickly
2. **Network error**: Disconnect network, try to change, verify error handling
3. **Concurrent users**: Have two admins change same item simultaneously (should last-write-win)
4. **Partial receive then dispose**: Receive 2 of 5 units, change disposition, verify only received units affected

### Expected Behavior
- Dropdown is always visible for received items (even if 0 remaining available)
- Selecting current value (e.g., already TRASH, select TRASH again) shows prompt but makes no actual change
- All changes are immediate (take effect on next page refresh)
- Status chips provide quick visual indication of non-normal dispositions
- No dropdown appears for items that have never been received

