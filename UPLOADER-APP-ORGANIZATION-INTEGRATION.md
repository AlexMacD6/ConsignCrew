# Uploader App Organization Integration Guide

## Overview

The TreasureHub Photo Gallery now supports **organization-based photo sharing**. Photos uploaded by any member of an organization are automatically accessible to all other members of that organization, enabling shared photo repositories for families, couples, or business teams.

---

## 🔐 Authentication

### Step 1: Login

**Endpoint:** `POST https://www.treasurehubclub.com/api/auth/sign-in/email`

**Request:**
```json
{
  "email": "user@example.com",
  "password": "userPassword123"
}
```

**Response Headers:**
- `set-auth-token`: Authentication token (exposed via CORS)

**Response Body:**
```json
{
  "user": {
    "id": "user_abc123",
    "email": "user@example.com",
    "name": "John Doe"
  },
  "session": {
    "token": "session_xyz789",
    "expiresAt": "2025-12-31T23:59:59.000Z"
  }
}
```

### Step 2: Store Authentication

Store the authentication token from the `set-auth-token` header or from the response body. Use it in all subsequent requests.

---

## 📸 Photo Upload

### Upload Photos to Shared Gallery

**Endpoint:** `POST https://www.treasurehubclub.com/api/photo-gallery`

**Headers:**
```
Authorization: Bearer <auth_token>
Content-Type: multipart/form-data
```

**Request Body (FormData):**
- `file`: Image file (required)
  - Max size: 10MB
  - Accepted types: image/*

**Example (JavaScript):**
```javascript
const formData = new FormData();
formData.append('file', imageBlob, 'photo.jpg');

const response = await fetch('https://www.treasurehubclub.com/api/photo-gallery', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${authToken}`,
  },
  body: formData,
});

const result = await response.json();
```

**Response:**
```json
{
  "success": true,
  "photo": {
    "id": "photo_abc123",
    "userId": "user_abc123",
    "organizationId": "org_xyz789",
    "url": "https://cdn.treasurehub.com/photo-gallery/user_abc123/1234567890-photo.jpg",
    "thumbnailUrl": null,
    "originalFilename": "photo.jpg",
    "fileSize": 2048000,
    "mimeType": "image/jpeg",
    "status": "available",
    "createdAt": "2025-11-03T19:00:00.000Z"
  }
}
```

### Key Features:

1. **Automatic Organization Tagging**: Photos are automatically tagged with the user's primary organization
2. **Shared Access**: All members of the organization can view and use these photos
3. **User Attribution**: Photos retain information about who uploaded them
4. **Status Tracking**: Photos have status (available, listed) for tracking usage

---

## 📥 Fetch Photos

### Get Photos from Shared Gallery

**Endpoint:** `GET https://www.treasurehubclub.com/api/photo-gallery`

**Headers:**
```
Authorization: Bearer <auth_token>
```

**Query Parameters:**
- `status` (optional): Filter by status
  - `available` (default): Photos not yet used in listings
  - `listed`: Photos already used in listings
  - `all`: All photos
- `organizationId` (optional): Filter by specific organization

**Example:**
```javascript
const response = await fetch(
  'https://www.treasurehubclub.com/api/photo-gallery?status=available',
  {
    headers: {
      'Authorization': `Bearer ${authToken}`,
    },
  }
);

const data = await response.json();
```

**Response:**
```json
{
  "photos": [
    {
      "id": "photo_abc123",
      "userId": "user_abc123",
      "organizationId": "org_xyz789",
      "url": "https://cdn.treasurehub.com/photo-gallery/user_abc123/1234567890-photo.jpg",
      "thumbnailUrl": null,
      "originalFilename": "photo.jpg",
      "fileSize": 2048000,
      "mimeType": "image/jpeg",
      "width": 1920,
      "height": 1080,
      "status": "available",
      "listingId": null,
      "createdAt": "2025-11-03T19:00:00.000Z",
      "user": {
        "id": "user_abc123",
        "name": "John Doe",
        "email": "john@example.com"
      }
    }
  ],
  "count": 1
}
```

### What You Get:

1. **User's Photos**: All photos uploaded by the authenticated user
2. **Shared Photos**: All photos from other members of the same organization(s)
3. **User Information**: Shows who uploaded each photo
4. **Metadata**: File size, dimensions, status, etc.

---

## 👥 Organization Management

### Understanding Organizations

- **Automatic Membership**: New users are automatically added to a default organization
- **Multiple Organizations**: Users can belong to multiple organizations
- **Shared Gallery**: Photos tagged with an organizationId are visible to all org members
- **Primary Organization**: Photos are tagged with the user's first/primary organization

### Creating Organizations (Admin Only)

Organizations are managed through the **Admin Dashboard** at:
```
https://www.treasurehubclub.com/admin
```

Navigate to: **Organizations Tab**

#### Features:
- ✅ Create organizations
- ✅ Add/remove members
- ✅ Assign roles (MEMBER, ADMIN, OWNER)
- ✅ Send invitations by email
- ✅ Create teams within organizations

### Use Cases:

**1. Couples/Families:**
- Create an organization for a household
- Both partners can upload photos
- Both see all photos in the shared gallery
- Example: "Smith Family"

**2. Business Teams:**
- Create an organization for a company or team
- All team members share a photo repository
- Useful for product photography, inventory documentation
- Example: "Acme Products"

**3. Multiple Organizations:**
- Users can be members of multiple organizations
- Photos are tagged with their primary organization
- Can filter by specific organization when fetching photos

---

## 🔄 Complete Workflow Example

### Scenario: Husband and Wife Sharing Photos

**Step 1: Admin creates organization**
```
Admin Dashboard → Organizations → Create Organization
Name: "Johnson Family"
Slug: "johnson-family"
```

**Step 2: Admin adds members**
```
Johnson Family → Members → Add Member
- Add: john@example.com (MEMBER)
- Add: jane@example.com (MEMBER)
```

**Step 3: John uploads photos from mobile app**
```javascript
// John's uploader app
const formData = new FormData();
formData.append('file', photoBlob);

await fetch('https://www.treasurehubclub.com/api/photo-gallery', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${johnToken}` },
  body: formData,
});
// Photo is tagged with "Johnson Family" organization
```

**Step 4: Jane views all photos**
```javascript
// Jane's app fetches photos
const response = await fetch(
  'https://www.treasurehubclub.com/api/photo-gallery',
  {
    headers: { 'Authorization': `Bearer ${janeToken}` },
  }
);
// Jane sees:
// - All her own photos
// - All of John's photos (from Johnson Family org)
// - Any other Johnson Family member's photos
```

---

## 🛠️ Error Handling

### Common Error Responses:

**401 Unauthorized:**
```json
{
  "error": "Unauthorized - Please log in"
}
```
*Solution: Check authentication token*

**400 Bad Request:**
```json
{
  "error": "No file provided"
}
```
*Solution: Ensure file is included in FormData*

**400 Bad Request:**
```json
{
  "error": "Only image files are allowed"
}
```
*Solution: Only upload image files (JPEG, PNG, etc.)*

**400 Bad Request:**
```json
{
  "error": "File size must be less than 10MB"
}
```
*Solution: Compress or resize image before upload*

**500 Internal Server Error:**
```json
{
  "error": "Failed to upload photo"
}
```
*Solution: Retry request, check server logs*

---

## 📋 API Reference Summary

| Endpoint | Method | Purpose | Auth Required |
|----------|--------|---------|---------------|
| `/api/auth/sign-in/email` | POST | Login and get auth token | No |
| `/api/photo-gallery` | POST | Upload photo to shared gallery | Yes |
| `/api/photo-gallery` | GET | Fetch photos from shared gallery | Yes |
| `/api/photo-gallery/[id]` | DELETE | Delete photo from gallery | Yes |
| `/api/profile/organizations` | GET | Get user's organizations | Yes |

---

## 🔒 Security Notes

1. **Authentication Required**: All photo operations require valid authentication
2. **Organization Isolation**: Users can only see photos from their own organizations
3. **User Attribution**: Photos always track who uploaded them
4. **CORS Enabled**: Cross-origin requests are allowed from authorized domains
5. **S3 Secure Storage**: Photos are stored securely in AWS S3
6. **CDN Delivery**: Photos are served via CloudFront CDN for performance

---

## 🚀 Migration & Database

### Running the Migration

When you have database access, run:
```bash
npx prisma migrate dev
```

This will apply the migration:
- Adds `organizationId` field to PhotoGallery table
- Creates index for better query performance
- Automatically assigns existing photos to users' primary organization

### Manual Migration

If you need to run manually:
```bash
npx prisma migrate deploy
```

---

## 📞 Support

For questions or issues:
- **Admin Dashboard**: https://www.treasurehubclub.com/admin
- **API Docs**: This document
- **Database Schema**: See `prisma/schema.prisma`

---

## ✅ Checklist for Integration

- [ ] Implement authentication flow
- [ ] Store auth token securely
- [ ] Implement photo upload with FormData
- [ ] Handle upload errors gracefully
- [ ] Implement photo gallery fetch
- [ ] Display user attribution for photos
- [ ] Handle organization filtering (if needed)
- [ ] Test with multiple organization members
- [ ] Implement photo deletion (optional)
- [ ] Add loading states and progress indicators
- [ ] Test error scenarios
- [ ] Deploy and test on production

---

**Last Updated:** November 3, 2025  
**Version:** 1.0.0  
**Status:** Production Ready ✅

