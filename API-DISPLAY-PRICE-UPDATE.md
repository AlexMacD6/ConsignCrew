# Display Price API Update

## ✅ **COMPLETE - API Now Returns Calculated Display Price**

### **What Changed:**

The listings API (`GET /api/listings`) now calculates and returns the **actual display price** (the green discounted price) for every listing.

---

### **New Fields in API Response:**

```json
{
  "success": true,
  "listings": [
    {
      "id": "listing_abc123",
      "itemId": "9U1R33",
      "title": "Zesthome 8x10 Modern Abstract Area Rug",
      "price": 59.99,                    // Original list price
      
      // 👇 NEW FIELDS - USE THESE IN iOS APP
      "displayPrice": 47.99,             // ⭐ THE GREEN PRICE (calculated)
      "isDiscounted": true,              // Whether currently on sale
      "originalPrice": 59.99,            // For strikethrough display
      
      "discountSchedule": {
        "type": "Classic-60"
      },
      "createdAt": "2025-10-15T10:00:00Z",
      "status": "active",
      // ... other fields
    }
  ]
}
```

---

### **For Your iOS App:**

**Just pull these fields directly - no calculations needed!**

```swift
// Swift example
struct Listing: Codable {
    let itemId: String
    let title: String
    let price: Double              // Original
    let displayPrice: Double       // 👈 USE THIS (green price)
    let isDiscounted: Bool         // Whether on sale
    let originalPrice: Double?     // For strikethrough
}

// Display the price
if listing.isDiscounted {
    // Show green price with strikethrough original
    Text("$\(listing.displayPrice, specifier: "%.2f")")
        .foregroundColor(.green)
        .font(.headline)
    
    Text("$\(listing.originalPrice ?? 0, specifier: "%.2f")")
        .strikethrough()
        .foregroundColor(.gray)
        .font(.caption)
} else {
    // Show regular price
    Text("$\(listing.displayPrice, specifier: "%.2f")")
        .font(.headline)
}
```

---

### **How It Works:**

1. **Server calculates** the display price based on:
   - Original list price
   - Discount schedule (Turbo-30 or Classic-60)
   - Days since listing was created
   - Reserve price (minimum floor)

2. **API returns** the calculated price in `displayPrice` field

3. **iOS app displays** it directly - zero calculation needed!

---

### **Examples:**

**Item on Day 7 of Classic-60:**
- `price`: 59.99 (original)
- `displayPrice`: 53.99 (90% of original)
- `isDiscounted`: true
- `originalPrice`: 59.99

**Item on Day 35:**
- `price`: 59.99 (original)
- `displayPrice`: 38.99 (65% of original)
- `isDiscounted`: true
- `originalPrice`: 59.99

**Item not on discount schedule:**
- `price`: 59.99
- `displayPrice`: 59.99 (same)
- `isDiscounted`: false
- `originalPrice`: null

---

### **API Endpoint:**

```bash
GET https://treasurehub.club/api/listings?status=active

Response:
{
  "success": true,
  "listings": [...],  // Each with displayPrice calculated
  "pagination": {...}
}
```

---

### **Testing:**

Test with curl:
```bash
curl https://treasurehub.club/api/listings?status=active | jq '.listings[0] | {title, price, displayPrice, isDiscounted}'
```

Expected output:
```json
{
  "title": "Zesthome 8x10 Modern Abstract Area Rug",
  "price": 59.99,
  "displayPrice": 47.99,
  "isDiscounted": true
}
```

---

### **Files Modified:**

- ✅ `app/api/listings/route.ts`
  - Imported `getDisplayPrice` from price-calculator
  - Added calculation for each listing
  - Returns `displayPrice`, `isDiscounted`, `originalPrice`

---

### **Benefits:**

✅ **Zero calculation in iOS app** - Just display the value  
✅ **Server-side accuracy** - Same logic as web app  
✅ **Consistent pricing** - Web and mobile show same prices  
✅ **Real-time updates** - Recalculated on every API call  

---

**🎉 Done! Your iOS app can now pull `displayPrice` directly from the API!**

