## Changelog

### Added Inline Inventory Receiving in Item Listing Flow

Enhanced the "Select from Inventory" modal when listing items to allow receiving inventory directly within the selection screen, preventing users from listing manifested items that haven't been received yet.

#### Component Changes
- Updated `InventorySelector.tsx` to support inline receiving functionality
  - Added receive status indicators (MANIFESTED, RECEIVED)
  - Added quantity input and "Receive" button for manifested items
  - Added validation to prevent selecting unrecieved items
  - Added real-time receive functionality without leaving the modal

### Added Out-of-Order Receiving Override

Added ability to receive inventory items that were accidentally listed before being received, allowing users to correct the mistake without data loss.

#### API Changes
- Updated `/api/admin/inventory/items/[id]/receive` endpoint:
  - Added `override` boolean parameter to bypass posted-before-received check
  - Returns `requiresOverride: true` when item has listings but isn't received
  - Prevents receiving if posted and `override=false`

#### UI Changes in Admin Inventory Receiving
- Modified "Receive" button logic:
  - Uses `unreceived` quantity (total - received) instead of `remaining` (total - received - posted)
  - Enables "Receive" button for items that need receiving, even if already posted
  - Shows prompt asking for confirmation when override is needed
  - Displays item details (ID and quantity) in override prompt
- **Fixed Action Qty input default value**:
  - Changed from `?? unreceived` to `|| unreceived` to handle both `undefined` and `0` values
  - Now defaults to `unreceived` quantity instead of `0`
  - Makes "Receive" button immediately usable without manual input
  - Handles cases where input was previously set to 0 or never initialized
  - Simplifies override workflow (just click "Receive")
- **Fixed receive function**:
  - Updated to calculate `effectiveTotal` and `unreceived` based on item data
  - Uses `inputQuantities[id] || unreceived` instead of `inputQuantities[id] ?? 0`
  - Now works even when quantity hasn't been manually entered
  - Prevents silent failures when input state is undefined
- Clear user feedback for override scenarios

#### Features
- **Override Protection**: Prevents accidental out-of-order receiving without confirmation
- **Recovery Path**: Allows fixing mistakes when items are posted before receiving
- **Data Integrity**: Tracks both receive and post actions independently
- **User-Friendly**: Clear prompts explain what happened and what will happen
- **Smart Defaults**: Action quantity automatically set to the unreceived amount

#### Workflow
1. **Normal Case**: User manifests → receives → posts (no override needed)
2. **Override Case**: User manifests → posts by accident → needs to receive
   - User goes to Admin → Inventory → Receiving
   - Finds the item (shows Qty: X, Received: 0, Listed: X)
   - "Action Qty" field automatically shows the unreceived quantity
   - "Receive" button is enabled (green)
   - Clicks "Receive" button
   - System detects item was posted before receiving
   - Prompt appears: "This inventory has already been posted to listings..."
   - User clicks OK to override and receive
   - System receives the item and updates status

### Added "Listed" and "Remaining" Columns to Admin Inventory Receiving

Restructured the inventory columns to provide clearer visibility into inventory flow and status. Added "Listed" column to show active listings count and "Remaining" column to show available quantity after accounting for all operations.

#### Changes
- **API** (`app/api/admin/inventory/items/route.ts`):
  - Already includes `postedListings` count in response
  - Counts only active listings
- **TypeScript Interface** (`app/admin/InventoryReceiving.tsx`):
  - Added `postedListings?: number` to Item interface
- **UI** (`app/admin/InventoryReceiving.tsx`):
  - Renamed "Qty" column to "Total Qty" for clarity
  - Added "Listed" column showing active listings count (blue font)
  - Added "Remaining" column showing available quantity (Total - Received - Listed - Disposed)
  - Updated remaining calculation to account for posted listings: `Math.max(total - rec - posted - dispositioned, 0)`
  - Updated colspan values for loading/empty states (10 → 11)
  - **Edge Case Handling**: When `total` is 0 but listings exist:
    - Shows strikethrough `0` (gray) with the correct `effectiveTotal` (green) next to it
    - Database value (0) is crossed out to indicate it's incorrect
    - Inferred value (effectiveTotal) is shown in green
    - Tooltips explain: "Database value is incorrect" and "Inferred from received + listed"
    - Infers `effectiveTotal` as `Math.max(total, posted, rec + dispositioned)`
    - Enables receiving with the effective total quantity
    - Gracefully handles data integrity issues

#### Features
- **Clear Inventory Flow**: Column progression now tells the complete story
- **Active Listings Count**: Shows how many active listings use this inventory
- **Remaining Quantity**: Makes it obvious what's left to work with (accounts for posted listings)
- **Context for Override**: Helps understand when override is needed (Received: 0, Listed: 1)
- **Logical Progression**: Total → Received → Listed → Remaining shows the flow
- **Data Issue Detection**: Flags inconsistencies (e.g., Total: 0, Listed: 1)
- **Graceful Recovery**: Allows fixing data issues by inferring correct totals

#### Column Order (Updated)
1. Item (description, item #, vendor, unit price)
2. Delivery (list name)
3. **Total Qty** (manifested quantity) ← RENAMED from "Qty"
4. Received (quantity physically received)
5. **Listed (active listings count)** ← NEW
6. **Remaining (available quantity)** ← NEW
7. Disposed (trash/use tracking with dropdown)
8. Status (manifested/received badges)
9. Action Qty (input field for actions)
10. Actions (receive/trash/use buttons)
11. Notes (disposition notes)

#### How It Clarifies the Flow
**Before**: 
- Qty: 3, Received: 0, Listed: 1 → Confusing! How can 1 be listed if none received?

**After**:
- Total Qty: 3, Received: 0, Listed: 1, Remaining: 2 → Clear! Item was posted before receiving (override case)

**Normal Flow**:
- Total Qty: 10, Received: 10, Listed: 3, Remaining: 7 → 7 available to list or dispose

#### UI Changes
- **Status Badges**:
  - Orange badge: "Not Received - Must Receive First" for manifested items
  - Green badge: "Received (X)" for received items with quantity
- **Inline Receiving** for manifested items:
  - Quantity input field (defaults to remaining quantity)
  - Green "Receive" button with loading state
  - Prevents item selection until received
- **Visual Feedback**:
  - Manifested items have orange border and background (orange-50)
  - Received items are clickable with normal styling
  - Manifested items show reduced opacity and no hover effect
  - Clear warning message about needing to receive first

#### Features
- **Inline receiving**: Receive inventory without navigating to Admin → Inventory → Receiving
- **Automatic refresh**: List refreshes after receiving to show updated status
- **Quantity control**: Specify exact quantity to receive (partial or full)
- **Selection prevention**: Cannot select manifested items - must receive first
- **User-friendly**: Clear status indicators and intuitive workflow

#### Workflow
1. User clicks "Select from Inventory" when listing an item
2. Modal shows all inventory items (manifested + received)
3. **If item is RECEIVED**: Click to select normally
4. **If item is MANIFESTED**:
   - See orange warning badge
   - Enter quantity to receive
   - Click "Receive" button
   - Item refreshes and becomes selectable
   - Click item to select it

#### Technical Details
- Uses existing `/api/admin/inventory/items/[id]/receive` endpoint
- Added `receiveStatus` and `receivedQuantity` to InventoryItem interface
- Added `onItemsChanged` callback prop to trigger list refresh
- State management for per-item receiving status and quantities
- Click handlers prevent propagation to avoid accidental selection

#### Affected Files
- `app/components/InventorySelector.tsx` - Added receive functionality and status display
- `app/(dashboard)/list-item/page.tsx` - Added onItemsChanged callback

---

## Testing Instructions

### Prerequisites
1. Pull this branch
2. Database must have inventory with both MANIFESTED and RECEIVED items
3. Start application: `npm run dev`
4. Navigate to List an Item page

### Test Scenarios

#### 1. Test Status Display
1. Click "Select from Inventory" button
2. Modal opens showing inventory items
3. Verify items show one of two statuses:
   - **RECEIVED items**: Green badge "Received (X)" where X is quantity
   - **MANIFESTED items**: Orange badge "Not Received - Must Receive First"
4. Verify manifested items have orange border and background

#### 2. Test Received Item Selection (Normal Flow)
1. Find an item with green "Received" badge
2. Click anywhere on the item card
3. Verify:
   - Modal closes
   - Item is selected
   - Item details populate in the listing form
4. This is the normal existing behavior - should work as before

#### 3. Test Manifested Item Selection Prevention
1. Find an item with orange "Not Received" badge
2. Try to click on the item card
3. Verify:
   - Alert appears: "This item must be received before you can list it..."
   - Modal stays open
   - Item is NOT selected
   - User is directed to use Receive button

#### 4. Test Inline Receiving
1. Find a manifested item (orange badge)
2. Verify receive controls appear on the right:
   - Number input with quantity
   - Green "Receive" button
3. Verify quantity input defaults to total unreceived quantity
4. Click "Receive" button
5. Verify:
   - Button shows "Receiving..." with spinning icon
   - After completion, list refreshes
   - Item now shows green "Received" badge
   - Item is now clickable to select

#### 5. Test Partial Receiving
1. Find a manifested item with quantity > 1
2. Change the quantity input to half the total (e.g., 5 out of 10)
3. Click "Receive"
4. Verify:
   - Only specified quantity is received
   - Item may show "Partially Received" status (if API returns it)
   - Can receive more later

#### 6. Test Receiving Then Selecting
1. Find a manifested item
2. Click "Receive" to receive it
3. Wait for refresh
4. Item now has green badge
5. Click the item to select it
6. Verify:
   - Modal closes
   - Item is selected
   - Form populates with item data

#### 7. Test Multiple Items
1. Receive item A
2. Select item A (modal closes)
3. Re-open modal
4. Receive item B
5. Go back and select item B
6. Verify both workflows work independently

#### 8. Test Quantity Validation
1. Find manifested item with quantity of 10
2. Try to enter quantity > 10 (e.g., 15)
3. Click "Receive"
4. Should show error about exceeding available quantity

#### 9. Test Error Handling
1. Disconnect network
2. Try to receive an item
3. Should show error alert
4. Network reconnects
5. Try again - should work

#### 10. Test Visual States
**Received Item**:
- Normal white/gray background
- Green "Received" badge
- Hover effect (bg-gray-50)
- Cursor shows pointer
- Normal opacity

**Manifested Item**:
- Orange background (bg-orange-50)
- Orange border (border-orange-300)
- Orange "Not Received" badge
- Reduced opacity (opacity-90)
- No hover effect
- No pointer cursor on main card
- Receive button and input on right side

### Expected Behavior
- Cannot list items that haven't been received
- Can receive items without leaving the modal
- List automatically refreshes after receiving
- Clear visual distinction between received and manifested
- Inline workflow is faster than going to Admin → Inventory
- All existing functionality remains intact

### Edge Cases
1. **No manifested items**: All items received - modal works as before
2. **All manifested items**: User can receive any/all inline
3. **Mixed list**: Both types shown, each behaves correctly
4. **Search/filter**: Receiving works regardless of filter state
5. **Pagination**: Receiving on any page, then paginating works
6. **Concurrent receives**: Multiple users receiving same item (last-write-wins)

### Performance
- Receiving is fast (single API call)
- List refresh is efficient (reuses existing loadInventoryItems)
- No page navigation required
- Smooth user experience

### Accessibility
- Clear warning messages
- Disabled states are obvious
- Loading states provide feedback
- Error messages are informative

