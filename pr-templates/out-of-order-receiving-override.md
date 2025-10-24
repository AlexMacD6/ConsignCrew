## Changelog

### Added Out-of-Order Receiving Override

Added the ability to receive inventory items even after they've been posted to listings, handling the edge case where items are listed before being physically received.

#### Problem
- User accidentally lists an item from inventory before receiving it
- Item shows 0 "Available" (since it's already posted)
- Received quantity is 0
- Cannot receive through normal flow (blocked by validation)
- Item is in listings but not physically in warehouse

#### Solution
Added **override capability** for out-of-order receiving:

1. **Smart Detection**: API detects when items are posted but not received
2. **User Confirmation**: System prompts user to confirm override
3. **Safe Processing**: Still validates total quantity limits
4. **Warning Feedback**: Alerts user that receiving happened out of order

#### API Changes
- Updated `POST /api/admin/inventory/items/[id]/receive`
  - Added `override` boolean parameter (default: false)
  - Added `requiresOverride` in error response when posted items detected
  - Fetches listing count to detect posted-but-not-received state
  - Allows receiving with override even when "available" is 0
  - Still enforces total quantity limits (can't exceed total inventory)

#### UI Changes
- **Admin Inventory Receiving** (`InventoryReceiving.tsx`):
  - Detects when API returns `requiresOverride: true`
  - Shows confirmation dialog explaining the situation
  - Retries with `override: true` if user confirms
  - Shows success message with warning after override receive

- **Inventory Selector Modal** (`InventorySelector.tsx`):
  - Same override logic for inline receiving
  - Consistent user experience across both entry points

#### Workflow

**Normal Flow** (works as before):
1. User clicks "Receive" button
2. If validation passes, item is received
3. Success message shown

**Override Flow** (NEW - for posted-but-not-received items):
1. User clicks "Receive" button
2. API detects item has been posted but not received (0 received, >0 posted)
3. User sees confirmation dialog:
   ```
   Cannot receive 1. Only 0 remaining. However, 1 item(s) have been 
   posted but not received. Use override to receive out of order.
   
   This item has been posted to listings before receiving. 
   Click OK to receive it anyway (out of order receiving), 
   or Cancel to abort.
   ```
4. If user clicks OK:
   - API receives with `override: true`
   - Item status updates to RECEIVED
   - Success message: "Item received out of order (after posting)"
5. If user clicks Cancel:
   - No changes made
   - Item remains unrecieved

#### Safety Features
- **Still validates total quantity**: Can't receive more than total inventory
- **Detects posted items**: Only offers override when items are actually posted
- **Explicit confirmation**: User must confirm override action
- **Warning feedback**: Clear indication that receiving happened out of order
- **Audit trail**: `receivedBy` and `receivedAt` still tracked

#### Use Cases
1. **Accidental early listing**: Listed item before receiving manifest
2. **Pre-listing**: Listed item based on manifest, receiving later
3. **Inventory correction**: Fix data entry mistakes
4. **Quick turnaround**: List high-demand items before physical receipt

#### Technical Details
- Override doesn't bypass all validation - only the "available" check
- Still requires `receivedQuantity + newQuantity <= totalQuantity`
- Listing relationship is checked to detect posted items
- Works in both Admin Receiving page and List Item modal
- Recursive retry pattern: normal attempt → detect override needed → retry with override

#### Affected Files
- `app/api/admin/inventory/items/[id]/receive/route.ts` - Added override logic
- `app/admin/InventoryReceiving.tsx` - Added override UI handling
- `app/components/InventorySelector.tsx` - Added override UI handling

---

## Testing Instructions

### Prerequisites
1. Pull this branch
2. Start application: `npm run dev`
3. Need test data: Item that's been posted but not received

### Setup Test Case
1. Go to Admin Dashboard → Inventory → Data Upload
2. Upload an inventory item with quantity > 0
3. **DO NOT** go to Receiving tab yet
4. Go to List an Item
5. Select the manifested item from inventory
6. Complete and post the listing
7. Result: Item is now posted but not physically received

### Test Scenarios

#### 1. Test Override in Admin Receiving
1. Go to Admin Dashboard → Inventory → Receiving
2. Find the item you posted (should show 0 available, 0 received, MANIFESTED)
3. Enter quantity to receive (e.g., 1)
4. Click "Receive" button
5. Verify confirmation dialog appears:
   - Shows error about 0 remaining
   - Mentions X items posted but not received
   - Offers to receive out of order
6. Click "OK" to confirm
7. Verify:
   - Success alert shows "Item received out of order (after posting)"
   - Item refreshes with updated received quantity
   - Status changes to RECEIVED
   - Can now proceed normally

#### 2. Test Override in List Item Modal
1. Go to List an Item
2. Click "Select from Inventory"
3. Find a manifested item that's been posted
4. Should see orange "Not Received" badge
5. Enter quantity and click "Receive"
6. Verify same confirmation dialog appears
7. Click "OK"
8. Verify success and item becomes selectable

#### 3. Test Cancel Override
1. Trigger override scenario
2. In confirmation dialog, click "Cancel"
3. Verify:
   - No changes made
   - Item remains unrecieved
   - Can try again later

#### 4. Test Normal Receiving Still Works
1. Find an item that hasn't been posted
2. Try to receive it normally
3. Should receive without any override prompt
4. Normal flow unaffected

#### 5. Test Quantity Limits with Override
1. Trigger override for item with totalQty = 5
2. Try to receive 10 (exceeds total)
3. Should still get error - override doesn't bypass total limits
4. Try to receive 5 (equals total)
5. Should succeed with override

#### 6. Test Partial Receiving with Override
1. Item with totalQty = 10, posted = 1
2. Receive 5 with override
3. Status should be PARTIALLY_RECEIVED
4. Receive remaining 5 normally
5. Status should be RECEIVED

### Expected Behavior
- **Override only offered** when items are posted but not received
- **Confirmation required** - no accidental overrides
- **Clear messaging** about what's happening
- **Still enforces** total quantity limits
- **Normal flow unaffected** for items that haven't been posted
- **Success feedback** includes warning about out-of-order
- **Works in both places**: Admin Receiving and List Item modal

### Edge Cases
1. **Item posted then deleted**: Should still allow override if listing exists
2. **Multiple listings from same inventory**: Counts all active listings
3. **Receiving more than posted**: Allowed up to total quantity
4. **Already partially received**: Override based on remaining vs posted

### Error Messages to Verify
**Without override needed**:
```
Cannot receive 5. Only 3 remaining.
```

**With override needed**:
```
Cannot receive 1. Only 0 remaining. However, 1 item(s) have been 
posted but not received. Use override to receive out of order.
```

**After override**:
```
Success: Item received out of order (after posting)
```

**Exceeds total even with override**:
```
Cannot receive 10. Maximum 5 can be received (total: 5, already received: 0).
```

