# Listings Display Improvements

## Changelog

### Information Hiding and Privacy
- Removed "Service Fee" from listing display (now only shown at checkout)
- Concealed "price range" and "reserve price" from listings
- Added "Reserve Met" badge when list price is at or below reserve minimum
- Removed "Item ID" from listing display
- Made "Serial Number" and "Model Number" conditional (only show if filled out)

### Enhanced Listing Information
- Added "time left before next price drop" display based on discount schedule
- Added "brand/manufacturer" information to listings
- Added "product dimensions" to listings
- Added estimated retail price display with strikethrough, percentage off, and red arrow

### UI Text and Button Changes
- Changed "Contact Seller" button to "Ask A Question"
- Made "Buy it Now" the main Call to Action
- Made "Ask a Question" button tiny with Question Mark icon

### Gallery and Display Updates
- Removed "Approved Zone" comment from listing cards
- Removed "Classic-60" discount code tag
- Removed all discount schedule tags from listings
- Removed ZIP codes from Gallery page
- Removed "Heart" functionality, keeping only "Save" and "Hide"

### List an Item Page Alignment
- Updated "List an Item" page to match listing details
- Implemented two-column layout with auto-generated fields on left and editable fields on right
- Added all missing fields: brand, dimensions, serial/model numbers, estimated retail price, discount schedule
- Made auto-generated fields read-only with lock icons
- Added detailed tooltip for discount schedule options with complete pricing tables

### Listing Tags and Badges
- Added "Newly Listed" tag for items added in the last 7 days
- Added "Price Drop" tag for price drops in the last 3 days

### Questions and Answers System
- Added public "Questions component" below listing details in modal
- Implemented "Approve" button for Admin to release questions and answers publicly
- Added approval workflow: Pending Approval → Approved - Not Public → Public
- Admin can preview answers before making them public
- Display "TreasureHub" as the responder for approved answers
- Added mock data for testing the questions system

### AI Responses System
- Created `ai_responses` table with specified schema
- Populated with 19 initial standard responses across 10 categories
- Support for Pickup & Delivery, Pricing & Offers, Item Details, Availability, Returns & Refunds, Buyer Support, Payment & Checkout, Delivery Updates, General, Trust & Safety

---

## Testing Instructions

1. **Pull this branch and run `npm install`**

2. **Test Information Hiding:**
   - Verify Service Fee is not visible in listings
   - Check that price range and reserve price are hidden
   - Confirm "Reserve Met" badge appears when appropriate
   - Verify Item ID is not displayed

3. **Test Enhanced Information:**
   - Check that brand and dimensions appear when available
   - Verify estimated retail price shows with strikethrough and percentage
   - Test time until next price drop calculations

4. **Test UI Changes:**
   - Verify "Buy it Now" is the main CTA button
   - Check that "Ask a Question" is a tiny icon button
   - Confirm all discount schedule tags are removed

5. **Test List an Item Page:**
    - Verify two-column layout with auto-generated fields on left
    - Check that all new fields are present and functional
    - Test form submission includes all fields
    - Test discount schedule tooltip by clicking the info icon
    - Verify tooltip shows detailed pricing tables for both Turbo-30 and Classic-60

6. **Test Listing Tags:**
   - Check for "Newly Listed" tags on recent items
   - Verify "Price Drop" tags appear (mock data)

7. **Test Questions Component:**
   - Open a listing modal and scroll to Questions section
   - Verify questions and answers are displayed
   - Test admin approval functionality (mock admin enabled)
   - Check different approval states: Pending, Approved-Not-Public, Public

8. **Test Responsive Design:**
   - Check layout on mobile, tablet, and desktop
   - Verify all elements scale appropriately

9. **Test Database:**
   - Run `npx prisma migrate dev` to apply schema changes
   - Verify `ai_responses` table is created and populated 