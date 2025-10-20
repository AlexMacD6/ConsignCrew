## Changelog

### Added Inventory Disposition Tracking (Trash & Use)

Added comprehensive tracking for inventory items that need to be disposed of or kept for personal/business use, separate from normal receiving process.

#### Database Changes
- Added `InventoryDisposition` enum with two values:
  - `TRASH`: Items disposed of (damaged, unsellable)
  - `USE`: Items kept for personal/business use (subject to use tax)
- Added disposition tracking fields to `InventoryItem` model:
  - `disposition`: Type of disposition applied
  - `dispositionQuantity`: Number of units marked with this disposition
  - `dispositionAt`: Timestamp when disposition was applied
  - `dispositionBy`: User ID who applied the disposition
  - `dispositionNotes`: Optional notes explaining the disposition (damage reason, use tax category, etc.)
- Created migration `20251019000000_add_inventory_disposition_tracking`

#### API Changes
- Created new endpoint: `POST /api/admin/inventory/items/[id]/disposition`
  - Marks inventory items as TRASH or USE
  - Validates quantity availability
  - Updates receive status when all items are accounted for (received + dispositioned)
  - Tracks who made the disposition and when
- Updated `GET /api/admin/inventory/items` to include disposition fields in response

#### UI Changes
- Updated `InventoryReceiving` component with three action buttons:
  - **Receive** (green): Normal receiving for resale (existing)
  - **Trash** (red): Mark items as disposed
  - **Use** (blue): Mark items for personal/business use (use tax applicable)
- Added "Disposed" column showing:
  - Quantity of dispositioned items
  - Visual chips indicating TRASH (red) or USE (blue)
- Updated "Available" calculation to account for dispositioned items: `Total - Received - Dispositioned`
- Added disposition notes display inline with item description
- Updated page description to explain all three disposition options

#### Business Logic
- **TRASH Category**: 
  - Tracks items that must be thrown out
  - Used for loss accounting and inventory reconciliation
  - Potential tax write-offs
  
- **USE Category**:
  - Tracks items kept for personal or business use
  - Subject to use tax obligations
  - Required for tax compliance

- Items marked with either disposition are counted toward the item's "received" status to maintain accurate inventory reconciliation

---

## Testing Instructions

### Prerequisites
1. Pull this branch
2. Install dependencies: `npm install`
3. **Apply the database migration** when database is available:
   ```bash
   npx prisma migrate deploy
   ```
   Or for development:
   ```bash
   npx prisma migrate dev
   ```

### Test Scenarios

#### 1. Test Trash Disposition
1. Start the application: `npm run dev`
2. Navigate to Admin Dashboard → Inventory → Receiving tab
3. Find an item with available quantity
4. Enter a quantity in the "Action Qty" field
5. Click the red **Trash** button
6. When prompted, enter a reason (e.g., "Damaged in shipping")
7. Verify:
   - Item refreshes and shows the disposed quantity in the "Disposed" column
   - Red "TRASH" chip appears next to the quantity
   - Available quantity decreases by the amount marked as trash
   - Disposition notes appear below the item description

#### 2. Test Use Disposition
1. Find another item with available quantity
2. Enter a quantity in the "Action Qty" field
3. Click the blue **Use** button
4. When prompted, enter a reason (e.g., "Office supplies")
5. Verify:
   - Item refreshes and shows the disposed quantity
   - Blue "USE" chip appears next to the quantity
   - Available quantity decreases
   - Disposition notes appear below the item description

#### 3. Test Normal Receive Flow
1. Find an item with available quantity
2. Enter a quantity
3. Click the green **Receive** button
4. Verify:
   - "Received" column updates
   - Available quantity decreases
   - No disposition is shown (this is normal receiving)

#### 4. Test Mixed Actions
1. For a single item with quantity of 10:
   - Receive 3 units (normal)
   - Mark 2 units as Trash
   - Mark 1 unit as Use
2. Verify:
   - Received: 3
   - Disposed: 3 (latest disposition shown)
   - Available: 4
   - Total: 10

#### 5. Test Status Updates
1. Process all units of an item using various actions
2. Verify the "Status" column updates:
   - MANIFESTED → PARTIALLY_RECEIVED → RECEIVED
   - Status considers both received and dispositioned items

#### 6. Test Validation
1. Try to disposition more items than available
2. Verify error message appears
3. Try to disposition with 0 quantity
4. Verify button is disabled

### Visual Verification
- **Trash chip**: Red background, red text
- **Use chip**: Blue background, blue text
- **Buttons**:
  - Receive: Green with checkmark icon
  - Trash: Red with trash icon
  - Use: Blue with user icon
- All buttons should be disabled when quantity is 0 or no items available

### Edge Cases
1. Test with items that have no available quantity
2. Test canceling the disposition prompt (should not update)
3. Test with partial quantities
4. Test rapid successive actions
5. Verify notes field persists across page refreshes

### Database Verification (Optional)
Query the database to verify disposition tracking:
```sql
SELECT 
  "itemNumber",
  "description",
  "quantity",
  "receivedQuantity",
  "disposition",
  "dispositionQuantity",
  "dispositionNotes"
FROM "InventoryItem"
WHERE "disposition" IS NOT NULL;
```

