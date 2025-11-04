# Selling to Sold Integration - Quick Start Guide

## ✅ **Integration Complete!**

TreasureHub is now ready to receive photos with metadata from your Selling to Sold mobile app and display that metadata when users create listings.

---

## **What Was Implemented**

### 1. **Database Schema** ✓
- **MobileItem** model - Stores items uploaded from mobile app
- **MobileItemMetadata** model - Stores dimensions, notes, custom IDs
- **PhotoGallery** updated - Links photos to mobile items

### 2. **API Endpoints** ✓
- **`POST /api/mobile/items`** - Create items with metadata
- **`GET /api/mobile/items`** - Retrieve user's mobile items
- **`PATCH /api/mobile/items`** - Update item metadata
- **`GET /api/photo-gallery`** - Now returns metadata with photos

### 3. **UI Updates** ✓
- Photo gallery displays dimension badges (📏 36"W × 24"H)
- Hover overlay shows custom ID and notes
- Metadata visible when selecting photos for listings

---

## **How It Works**

### From Selling to Sold App:
```javascript
// 1. Upload photos
POST /api/photo-gallery
FormData: { file: photo.jpg }
→ Returns: { photo: { id: "photo_123" } }

// 2. Create item with metadata
POST /api/mobile/items
Body: {
  mediaIds: ["photo_123", "photo_124"],
  metadata: {
    itemId: "TABLE-001",
    height: "30",
    width: "48",
    depth: "24",
    notes: "Vintage oak dining table"
  },
  appSource: "selling-to-sold"
}
→ Success: Item created and photos linked
```

### In TreasureHub:
1. User opens photo gallery
2. Photos show dimension badges: **📏 48"W × 30"H × 24"D**
3. Hover shows: **ID: TABLE-001** and **📝 Notes**
4. User selects photos with full context

---

## **Next Steps**

### 1. Run Database Migration
```bash
npx prisma migrate dev --name add_mobile_item_metadata
```

This creates the new tables and columns.

### 2. Test the Integration

**Test Item Creation:**
```bash
curl -X POST http://localhost:3000/api/mobile/items \
  -H "Authorization: Bearer {your_token}" \
  -H "Content-Type: application/json" \
  -d '{
    "mediaIds": ["existing_photo_id"],
    "metadata": {
      "itemId": "TEST-001",
      "height": "24",
      "width": "36",
      "depth": "12",
      "notes": "Test item from mobile app"
    }
  }'
```

**Test Photo Gallery:**
```bash
curl -X GET http://localhost:3000/api/photo-gallery \
  -H "Authorization: Bearer {your_token}"
```

Should return photos with `mobileItem` and `metadata` fields.

### 3. Update Selling to Sold App

In your mobile app (`src/lib/api.ts`), add the item creation call:

```typescript
export async function createMobileItem(
  mediaIds: string[],
  metadata: {
    itemId?: string;
    height?: string;
    width?: string;
    depth?: string;
    notes?: string;
  }
) {
  const response = await fetch(`${API_URL}/api/mobile/items`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${authToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      mediaIds,
      metadata,
      appSource: 'selling-to-sold',
      createdAt: Date.now(),
    }),
  });

  return await response.json();
}
```

### 4. Update Upload Queue

After successful upload in `src/lib/queue.ts`:

```typescript
// 1. Upload all photos
const photoIds = await uploadPhotos(item.media);

// 2. Create item with metadata
if (item.metadata) {
  await createMobileItem(photoIds, item.metadata);
}

// 3. Remove from queue
await removeFromQueue(item.id);
```

---

## **API Reference**

### Create Mobile Item

**Endpoint:** `POST /api/mobile/items`

**Headers:**
```
Authorization: Bearer {token}
Content-Type: application/json
```

**Body:**
```json
{
  "mediaIds": ["photo_id_1", "photo_id_2"],
  "metadata": {
    "itemId": "USER-123",      // Optional: User's custom ID
    "height": "24",             // Optional: Height in inches
    "width": "36",              // Optional: Width in inches
    "depth": "12",              // Optional: Depth in inches
    "notes": "Description..."   // Optional: User notes
  },
  "appSource": "selling-to-sold",
  "createdAt": 1730745000000    // Optional: Unix timestamp
}
```

**Success Response (201):**
```json
{
  "success": true,
  "item": {
    "id": "item_xyz789",
    "userId": "user_abc123",
    "status": "pending",
    "media": [...],
    "metadata": {...}
  }
}
```

**Error Responses:**
- `400` - Missing or invalid mediaIds
- `401` - Unauthorized (invalid/missing token)
- `500` - Server error

---

## **UI Display Examples**

### Photo Gallery Modal:

**Photos WITHOUT metadata:**
- Standard photo thumbnail
- No badges

**Photos WITH metadata:**
- **Top-left badge:** 📏 36"W × 24"H × 12"D
- **Hover overlay shows:**
  - Filename
  - ID: TABLE-001
  - 📝 Vintage oak dining table

---

## **Data Structure**

### MobileItem
```typescript
{
  id: string;
  userId: string;
  status: "pending" | "approved" | "listed";
  appSource: string;
  createdAt: Date;
  media: PhotoGallery[];
  metadata: MobileItemMetadata;
}
```

### MobileItemMetadata
```typescript
{
  id: string;
  mobileItemId: string;
  customItemId?: string;  // User's ID
  height?: string;        // Inches
  width?: string;         // Inches
  depth?: string;         // Inches
  notes?: string;         // User description
}
```

---

## **Security**

✅ **Authentication required** - All endpoints check for valid session  
✅ **Ownership validation** - Users can only link their own photos  
✅ **Input validation** - MediaIds verified before linking  
✅ **XSS protection** - User input properly escaped in UI  

---

## **Troubleshooting**

### "mediaIds invalid or do not belong to you"
- Verify photo IDs are correct
- Ensure photos belong to authenticated user
- Check photos exist in database

### Metadata not showing in gallery
- Run database migration
- Restart dev server
- Clear browser cache
- Check API response includes `mobileItem` field

### Authentication errors
- Verify token is being sent in Authorization header
- Check token hasn't expired
- Ensure user is logged in

---

## **Files Modified**

- ✅ `prisma/schema.prisma` - Added MobileItem models
- ✅ `app/api/mobile/items/route.ts` - New endpoint
- ✅ `app/api/photo-gallery/route.ts` - Include metadata
- ✅ `app/components/PhotoGalleryModal.tsx` - Display metadata

---

## **Testing Checklist**

- [ ] Database migration runs successfully
- [ ] Can create mobile item via API
- [ ] Photo gallery returns metadata
- [ ] Metadata displays in UI (badges/overlays)
- [ ] Can select photos with metadata
- [ ] Hover shows full details
- [ ] Mobile app can call API successfully

---

## **Support**

Full documentation: `requirements/selling-to-sold-integration.txt`

Questions? Check:
- Mobile app: `src/lib/api.ts`, `src/lib/queue.ts`
- Backend: API route files
- Database: `prisma/schema.prisma`

---

## **What's Next?**

The foundation is complete! Future enhancements could include:

- **Auto-fill listings** from metadata
- **Edit metadata** in TreasureHub UI
- **Group photos** by mobile item
- **Search** by custom ID
- **AI dimension detection**

**🎉 You're all set! The integration is ready to use.**

