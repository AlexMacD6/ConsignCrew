# Pick Ticket QR Code and Logo Update

## Summary
Fixed the pick ticket print preview by restoring the actual QR code and adding the black TreasureHub logo.

## Changes Made

### 1. Restored QR Code Generation
- Modified `handlePrint` function in `PickTicketModal` to be `async`
- Added QR code generation using the `qrcode` library
- Generates a data URL for the QR code pointing to the listing page
- Replaced placeholder "QR CODE" text with actual scannable QR code image

### 2. Added Black Logo
- Added the black TreasureHub logo (`TreasureHub - Banner - Label.png`) to the pick ticket header
- Positioned logo to the left of "WAREHOUSE PICK TICKET" title
- Used flex layout to properly align logo and title

### 3. QR Code Implementation Details
```javascript
const QRCode = require('qrcode');
const qrUrl = `${window.location.origin}/list-item/${order.listing.itemId}`;
const qrCodeDataUrl = await QRCode.toDataURL(qrUrl, {
  width: 120,
  margin: 1,
  color: {
    dark: '#000000',
    light: '#FFFFFF'
  }
});
```

### 4. Logo Implementation
```html
<div style="display: flex; align-items: center; justify-content: center; margin-bottom: 0.2in; border-bottom: 2pt solid #000; padding-bottom: 0.1in;">
  <img src="${process.env.NEXT_PUBLIC_APP_URL || 'https://treasurehub.club'}/TreasureHub%20-%20Banner%20-%20Label.png" alt="TreasureHub" style="height: 0.8in; margin-right: 0.2in;" />
  <div class="title" style="border: none; margin: 0; padding: 0;">WAREHOUSE PICK TICKET</div>
</div>
```

## Files Modified
- `app/admin/delivery-scheduler/page.tsx`

## Benefits
- Pick ticket now has a proper scannable QR code that links to the listing
- Black logo ensures no colored ink is needed for printing
- Maintains professional appearance and branding
- QR code displays the item ID below for manual reference
