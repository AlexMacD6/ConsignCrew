## Changelog

### Added Partial Quantity Disposition Changes

Enhanced the inventory disposition system to support changing disposition for a specific quantity of items rather than all received items at once. This allows for more granular tracking when only some units need to be marked as TRASH or USE.

#### API Changes
- Updated `PUT /api/admin/inventory/items/[id]/disposition` endpoint to accept optional `quantity` parameter
  - If quantity provided: Changes disposition for specified number of units
  - If quantity omitted: Changes disposition for all received units (backward compatible)
- Added validation to prevent exceeding received quantity
- Smart quantity handling:
  - When changing to TRASH/USE: Adds to disposition quantity
  - When changing back to RECEIVED: Reduces disposition quantity
  - Automatically clears disposition entirely when quantity reaches 0

#### UI Changes
- **Added quantity input field** in "Disposed" column
  - Shows above the disposition dropdown
  - Displays "X of Y" format (e.g., "2 of 10")
  - Defaults to 1 unit
  - Max value limited to received quantity
  - Compact design with text-xs styling
- Updated prompts to show selected quantity
- Input validation before API call

#### Features
- **Partial disposition**: Mark only some items as TRASH/USE while keeping others as RECEIVED
- **Flexible adjustments**: Can mark additional items later by changing quantity
- **Clear feedback**: Shows exactly how many units are affected before confirmation
- **Safety validation**: Prevents invalid quantities (0, negative, exceeding received)

#### Use Cases
1. **Mixed quality batch**: Received 10 items, 2 are damaged
   - Set quantity to 2
   - Select "Trash (Disposed)"
   - Result: 2 trashed, 8 normal received
   
2. **Personal use subset**: Received 5 items, keeping 1 for office use
   - Set quantity to 1
   - Select "Use (Personal/Business)"
   - Result: 1 for use tax, 4 for resale

3. **Incremental marking**: Initially marked 2 as trash, found 1 more damaged later
   - Set quantity to 1
   - Select "Trash (Disposed)" again
   - Result: 3 total trashed

4. **Correction**: Accidentally marked item as trash, move back
   - Set quantity to desired amount
   - Select "Received (Normal)"
   - Result: Reduces or clears disposition

#### Technical Details
- Quantity state tracked separately from receiving quantity state
- `dispositionQuantities` object maintains per-item quantities
- Initialized to 1 for all received items on page load
- API maintains total `dispositionQuantity` across multiple operations
- Disposition type is single (not split between TRASH and USE)

#### Affected Files
- `app/api/admin/inventory/items/[id]/disposition/route.ts` - Added quantity parameter handling
- `app/admin/InventoryReceiving.tsx` - Added quantity input UI and state management

---

## Testing Instructions

### Prerequisites
1. Pull this branch
2. Database must have inventory disposition schema
3. Start application: `npm run dev`
4. Navigate to Admin Dashboard → Inventory → Receiving
5. Have items with received quantity > 1 for proper testing

### Test Scenarios

#### 1. Test Quantity Input Appearance
1. Find an item that has NOT been received yet
2. Verify "Disposed" column shows "—"
3. Receive multiple units (e.g., 5) of that item
4. Verify "Disposed" column now shows:
   - A number input with value "1"
   - Text showing "of 5" (or whatever was received)
   - A dropdown showing "Received (Normal)"

#### 2. Test Partial TRASH Marking
1. Find an item with 10 units received
2. In "Disposed" column, set quantity input to **2**
3. Select "Trash (Disposed)" from dropdown
4. In prompt, enter reason: "2 units damaged in shipping"
5. Click OK
6. Verify:
   - Page refreshes
   - Disposition shows "2" with red TRASH chip
   - Received column still shows 10
   - Can select additional units to mark as trash

#### 3. Test Partial USE Marking
1. Find an item with 5 units received
2. Set quantity input to **1**
3. Select "Use (Personal/Business)" from dropdown
4. In prompt, enter: "Office use"
5. Click OK
6. Verify:
   - Disposition shows "1" with blue USE chip
   - 1 unit marked for use tax

#### 4. Test Incremental Marking
1. Start with item having 10 received, 0 dispositioned
2. Set quantity to 2, mark as TRASH
3. After refresh, set quantity to 3, mark as TRASH again
4. Verify disposition shows "5" total (2 + 3)
5. This tests cumulative disposition

#### 5. Test Moving Back to RECEIVED
1. Find an item with disposition set
2. Set quantity input to partial amount
3. Select "Received (Normal)"
4. Verify:
   - No prompt (immediate change for RECEIVED)
   - Disposition quantity reduces by specified amount
   - If all units moved back, disposition clears entirely

#### 6. Test Quantity Validation
1. Try to set quantity to 0
   - Change disposition
   - Should show alert: "Please enter a valid quantity greater than 0"
   
2. Try to set quantity higher than received (e.g., 999)
   - Change disposition
   - Should show alert: "Cannot change 999 units. Only X units received."

3. Try to set negative quantity
   - Input should prevent this (min="1")

#### 7. Test Default Quantity Behavior
1. Receive new item
2. Verify quantity input defaults to 1
3. Change dropdown without modifying quantity
4. Verify only 1 unit is affected

#### 8. Test Maximum Quantity
1. Item with 5 units received
2. Set quantity to exactly 5
3. Mark as TRASH
4. Verify all 5 marked as trash
5. Disposition should show "5" with TRASH chip

#### 9. Test Mixed Scenario
1. Start: 10 units received
2. Mark 3 as TRASH
3. Verify: 3 dispositioned
4. Mark 2 more as TRASH
5. Verify: 5 total dispositioned
6. Move 2 back to RECEIVED
7. Verify: 3 dispositioned remain
8. Mark remaining 3 back to RECEIVED
9. Verify: Disposition clears completely (no chip shown)

#### 10. Test Prompt Shows Quantity
1. Set quantity to 7
2. Select TRASH
3. Verify prompt says "Mark 7 unit(s) as TRASH?"
4. Confirms correct quantity before proceeding

### Visual Verification
- Quantity input is compact (w-16, text-xs)
- "of X" text is gray and small
- Input and dropdown are stacked vertically
- Disposition chip appears below controls
- Layout is clean and not cluttered

### Edge Cases
1. **Rapid changes**: Change quantity multiple times before selecting disposition
2. **Cancel prompt**: Set quantity, select disposition, cancel prompt - verify no change
3. **Invalid input**: Try entering decimals (should round) or letters (should clear)
4. **Boundary testing**: 
   - Quantity = 1 (minimum)
   - Quantity = receivedQty (maximum)
5. **State persistence**: Change quantity, refresh page, verify defaults reset to 1

### Database Verification (Optional)
Query to see partial dispositions:

```sql
SELECT 
  "itemNumber",
  "description",
  "receivedQuantity",
  "disposition",
  "dispositionQuantity",
  CASE 
    WHEN "disposition" IS NULL THEN "receivedQuantity"
    ELSE "receivedQuantity" - "dispositionQuantity"
  END as "normalReceivedQty"
FROM "InventoryItem"
WHERE "receivedQuantity" > 0
ORDER BY "dispositionAt" DESC;
```

Verify:
- `dispositionQuantity` can be less than `receivedQuantity`
- Partial dispositions tracked correctly
- Normal received quantity = receivedQuantity - dispositionQuantity (when disposition set)

### Expected Behavior
- Quantity input appears for all items with receivedQuantity > 0
- Input limited by max="receivedQuantity"
- Disposition changes affect only specified quantity
- Can mark additional units incrementally
- Can move units back to RECEIVED partially
- Prompt shows exact quantity being changed
- All validations prevent invalid operations

