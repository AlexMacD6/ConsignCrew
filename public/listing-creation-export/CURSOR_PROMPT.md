# 🎯 Cursor AI Prompt: Create Unified Listing System for Selling To Sold

## Context
Build a streamlined listing creation system based on TreasureHub's architecture with these key modifications:
1. **Combined media upload** - Photos and videos in ONE interface (not separate pages)
2. **Two pathways** - Build from scratch OR select pre-packaged items from iOS app
3. **Mobile item integration** - Items uploaded from iOS come with photos, videos, and metadata

---

## 🎯 MAIN TASK

Create a unified listing creation page at `app/create-listing/page.tsx` with:

### 1. TWO PATHWAYS (User Choice at Start)

**Pathway A: Build from Scratch**
- User manually selects/uploads photos and videos
- User provides item details
- AI generates listing from media + user input

**Pathway B: Select Pre-Packaged Item**
- User selects a "Mobile Item" (uploaded from iOS app)
- Item already has photos, videos, dimensions, notes attached
- AI generates listing using existing media + metadata
- User can add more photos/videos if needed

---

## 📋 DETAILED REQUIREMENTS

### STEP 1: Create Unified Media Upload Interface

Build a single component that handles BOTH photos AND videos:

```typescript
// components/UnifiedMediaUpload.tsx

Features needed:
- Tabbed interface: "Photos" tab | "Videos" tab  
- Bulk upload for photos (drag & drop, multi-select)
- Bulk upload for videos (drag & drop, multi-select)
- Gallery selection (existing photos/videos)
- Preview thumbnails for both
- Remove/reorder capability
- Progress indicators
- Photo categories: Hero, Back, Proof, Additional
- Video thumbnail generation
- S3/CloudFront upload integration

UI Layout:
┌─────────────────────────────────────┐
│ [Photos Tab] [Videos Tab]            │
├─────────────────────────────────────┤
│  Upload Options:                     │
│  ○ Upload New  ○ Select from Gallery│
├─────────────────────────────────────┤
│  [Drag & Drop Zone]                  │
│  or                                  │
│  [Browse Files Button]               │
├─────────────────────────────────────┤
│  Selected Media:                     │
│  ┌───┐ ┌───┐ ┌───┐                 │
│  │ 1 │ │ 2 │ │ 3 │ [+ Add More]    │
│  └───┘ └───┘ └───┘                 │
└─────────────────────────────────────┘
```

### STEP 2: Create Mobile Item Selector

Build a modal to select pre-packaged items from iOS app:

```typescript
// components/MobileItemSelector.tsx

Features needed:
- Modal overlay
- Grid of mobile items with thumbnails
- Show: First photo, item count, dimensions, notes preview
- Search/filter functionality
- Click to select
- Load item with all media and metadata

Data structure:
interface MobileItem {
  id: string;
  media: Array<{id: string; url: string; type: 'photo'|'video'}>;
  metadata: {
    customItemId?: string;
    height?: string;
    width?: string;
    depth?: string;
    notes?: string;
  };
  status: 'pending' | 'used';
  createdAt: Date;
}
```

### STEP 3: Create Main Listing Page Layout

```typescript
// app/create-listing/page.tsx

Layout:
┌──────────────────────────────────────────┐
│  Create Listing                          │
├──────────────────────────────────────────┤
│  Choose Your Starting Point:             │
│                                           │
│  ┌─────────────┐  ┌──────────────┐      │
│  │  🖼️ Build   │  │  📱 iOS Item  │      │
│  │  from       │  │  with Media   │      │
│  │  Scratch    │  │  Attached     │      │
│  └─────────────┘  └──────────────┘      │
├──────────────────────────────────────────┤
│  [Content based on selection]            │
│                                           │
│  If "Build from Scratch":                │
│    - UnifiedMediaUpload component        │
│    - Basic form fields                   │
│    - AI generation button                │
│                                           │
│  If "iOS Item":                          │
│    - MobileItemSelector (modal)          │
│    - Display selected item media         │
│    - Show pre-filled dimensions/notes    │
│    - Option to add more media            │
│    - AI generation button                │
├──────────────────────────────────────────┤
│  Form Fields: (after media selection)   │
│    - Title, Price, Condition             │
│    - Department, Category                │
│    - Dimensions (auto-filled if mobile)  │
│    - Description                         │
│    - Delivery options                    │
│                                           │
│  [Generate with AI] [Publish Listing]   │
└──────────────────────────────────────────┘
```

---

## 🔌 API ENDPOINTS NEEDED

Reference these from TreasureHub:

### 1. Photo Gallery
```
GET  /api/photo-gallery          - Get available photos
POST /api/photo-gallery          - Upload new photo
```

### 2. Video Upload
```
POST /api/videos/upload          - Upload video
GET  /api/videos/status/:id      - Check processing status
```

### 3. Mobile Items
```
GET  /api/mobile/items           - Get items from iOS app
GET  /api/mobile/items/:id       - Get specific item with media
PATCH /api/mobile/items/:id      - Update item status to 'used'
```

### 4. AI Generation
```
POST /api/ai/generate-comprehensive-listing
Body: {
  photos: Array<{url: string}>,
  video?: {url, thumbnailUrl, frameUrls, duration},
  mobileItemMetadata?: {
    customItemId, height, width, depth, notes
  },
  inventoryItem?: {...},
  userInput: string,
  mode: 'comprehensive'
}
```

### 5. Listing Creation
```
POST /api/listings/create        - Create final listing
```

---

## 📊 DATABASE SCHEMA NEEDED

### PhotoGallery (existing)
```prisma
model PhotoGallery {
  id              String    @id @default(cuid())
  userId          String
  url             String
  thumbnailUrl    String?
  originalFilename String
  fileSize        Int?
  mimeType        String?
  status          String    @default("available")
  listingId       String?
  mobileItemId    String?
  createdAt       DateTime  @default(now())
  
  listing         Listing?  @relation(fields: [listingId], references: [id])
  mobileItem      MobileItem? @relation(fields: [mobileItemId], references: [id])
}
```

### MobileItem (existing)
```prisma
model MobileItem {
  id          String      @id @default(cuid())
  userId      String
  status      String      @default("pending")  // pending | used
  appSource   String      @default("selling-to-sold")
  createdAt   DateTime    @default(now())
  updatedAt   DateTime    @updatedAt
  
  media       PhotoGallery[]
  metadata    MobileItemMetadata?
}

model MobileItemMetadata {
  id           String  @id @default(cuid())
  mobileItemId String  @unique
  customItemId String?
  height       String?
  width        String?
  depth        String?
  notes        String?
  
  mobileItem   MobileItem @relation(fields: [mobileItemId], references: [id])
}
```

### Video (existing)
```prisma
model Video {
  id           String   @id @default(cuid())
  userId       String
  originalUrl  String
  processedUrl String?
  thumbnailUrl String?
  frameUrls    String[] @default([])
  duration     Int?
  status       String   @default("processing")
  listingId    String?
  createdAt    DateTime @default(now())
  
  listing      Listing? @relation(fields: [listingId], references: [id])
}
```

---

## 💻 KEY COMPONENTS TO BUILD

### 1. UnifiedMediaUpload.tsx
- Combines photo and video upload
- Tabbed interface
- Bulk upload support
- Gallery integration
- Drag & drop
- Progress tracking

### 2. MobileItemSelector.tsx
- Modal to select iOS items
- Grid display with thumbnails
- Search/filter
- Show metadata preview
- Select and load

### 3. CreateListingPage.tsx
- Main page with pathway selection
- State management for both pathways
- Media display
- Form fields
- AI generation integration
- Final publish

### 4. MediaPreview.tsx
- Display selected photos/videos
- Thumbnail grid
- Reorder capability
- Remove items
- Categorize photos (hero, back, proof)

### 5. AIGenerationPanel.tsx
- User input textarea
- Generate button
- Loading state
- Display AI results
- Edit generated fields

---

## 🎨 UI/UX REQUIREMENTS

### Pathway Selection (Initial Screen)
```
┌────────────────────────────────────────┐
│  How do you want to create your        │
│  listing?                              │
│                                        │
│  ┌──────────────┐  ┌─────────────┐   │
│  │   🖼️          │  │   📱        │   │
│  │              │  │             │   │
│  │  Build from  │  │  Use Item   │   │
│  │  Scratch     │  │  from iOS   │   │
│  │              │  │  App        │   │
│  │  • Upload    │  │  • Photos   │   │
│  │    photos    │  │    included │   │
│  │  • Upload    │  │  • Videos   │   │
│  │    videos    │  │    included │   │
│  │  • Fill      │  │  • Metadata │   │
│  │    details   │  │    included │   │
│  │              │  │             │   │
│  │  [Select]    │  │  [Select]   │   │
│  └──────────────┘  └─────────────┘   │
└────────────────────────────────────────┘
```

### Media Upload Interface (After Selection)
```
┌────────────────────────────────────────┐
│  Add Media                             │
├────────────────────────────────────────┤
│  [Photos Tab] [Videos Tab]  ← Active   │
├────────────────────────────────────────┤
│  Upload Method:                        │
│  ○ Upload New  ● Select from Gallery   │
├────────────────────────────────────────┤
│  Your Media:                           │
│  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐     │
│  │Hero │ │Back │ │Proof│ │Add 1│     │
│  │ [×] │ │ [×] │ │ [×] │ │ [×] │     │
│  └─────┘ └─────┘ └─────┘ └─────┘     │
│  [+ Add More Media]                    │
└────────────────────────────────────────┘
```

---

## 🔄 USER FLOW

### Flow A: Build from Scratch
1. User clicks "Build from Scratch"
2. Shows UnifiedMediaUpload component
3. User switches between Photos/Videos tabs
4. User uploads or selects from gallery
5. Media appears in preview grid
6. User fills basic form fields
7. User clicks "Generate with AI"
8. AI analyzes media + input
9. AI fills remaining fields
10. User reviews and publishes

### Flow B: Select iOS Item
1. User clicks "Use Item from iOS App"
2. Opens MobileItemSelector modal
3. User sees grid of pending items
4. User clicks an item
5. Modal closes, item loads:
   - All photos displayed
   - All videos displayed
   - Dimensions auto-filled
   - Notes shown
6. User can add more media if needed
7. User clicks "Generate with AI"
8. AI uses existing media + metadata
9. AI fills listing fields
10. User reviews and publishes

---

## 📝 IMPLEMENTATION CHECKLIST

### Phase 1: Core Components (Priority 1)
- [ ] Create UnifiedMediaUpload.tsx
  - [ ] Photo tab with upload
  - [ ] Video tab with upload
  - [ ] Gallery integration
  - [ ] Drag & drop
  - [ ] Preview grid
  
- [ ] Create MobileItemSelector.tsx
  - [ ] Fetch mobile items API
  - [ ] Grid display
  - [ ] Search/filter
  - [ ] Select functionality
  
- [ ] Create CreateListingPage.tsx
  - [ ] Pathway selection UI
  - [ ] State management
  - [ ] Media display
  - [ ] Form fields

### Phase 2: Integration (Priority 2)
- [ ] Photo upload API integration
- [ ] Video upload API integration
- [ ] Mobile items API integration
- [ ] AI generation API integration
- [ ] S3/CloudFront upload

### Phase 3: Polish (Priority 3)
- [ ] Error handling
- [ ] Loading states
- [ ] Validation
- [ ] Success messages
- [ ] Analytics tracking

---

## 🚀 QUICK START COMMAND

```bash
# Use this prompt in Cursor:

"Create a unified listing creation system for Selling To Sold with two pathways:

1. Build from Scratch - User uploads photos/videos manually
2. Use iOS Item - User selects pre-packaged item with media and metadata

Key requirements:
- Single page at app/create-listing/page.tsx
- Combined photo/video upload in ONE interface (tabs, not separate pages)
- MobileItemSelector modal to choose iOS items
- UnifiedMediaUpload component for media handling
- AI generation using media + metadata
- Auto-fill dimensions from mobile items

Reference TreasureHub architecture at:
- app/(dashboard)/list-item/page.tsx for listing logic
- app/components/PhotoGalleryModal.tsx for gallery
- app/components/VideoUpload.tsx for video handling
- app/api/mobile/items/route.ts for mobile items API

Build the three main components:
1. UnifiedMediaUpload.tsx
2. MobileItemSelector.tsx  
3. CreateListingPage.tsx

Include all necessary state management, API calls, and UI elements."
```

---

## 📚 REFERENCE FILES IN TREASUREHUB

Use these as reference (don't copy directly, adapt for new structure):

### Components
- `app/components/PhotoGalleryModal.tsx` - Photo gallery selection
- `app/components/VideoUpload.tsx` - Video upload logic
- `app/components/ProgressBar.tsx` - Step indicator
- `app/components/BasicFormFields.tsx` - Form inputs
- `app/components/ProductDimensions.tsx` - Dimension fields

### Pages
- `app/(dashboard)/list-item/page.tsx` - Main listing page (4000+ lines)
  - Photo upload logic
  - Video upload logic
  - Mobile item integration
  - AI generation
  - Form management

### API Routes
- `app/api/photo-gallery/route.ts` - Photo CRUD
- `app/api/videos/upload/route.ts` - Video upload
- `app/api/mobile/items/route.ts` - Mobile items
- `app/api/ai/generate-comprehensive-listing/route.ts` - AI generation
- `app/api/listings/create/route.ts` - Create listing

### Libraries
- `app/lib/ai-service.ts` - AI integration
- `app/lib/video-upload.ts` - Video utilities
- `app/lib/s3-upload.ts` - S3 upload logic

---

## 💡 KEY DIFFERENCES FROM TREASUREHUB

### TreasureHub (Old)
- ❌ 3 separate steps (Video → Photo → AI)
- ❌ Photos and videos on different pages
- ❌ Complex multi-step wizard

### Selling To Sold (New)
- ✅ Single unified page
- ✅ Photos and videos in ONE interface (tabs)
- ✅ Two clear pathways (scratch vs iOS)
- ✅ Simplified flow

---

## 🎯 SUCCESS CRITERIA

### Must Have:
✅ Single page for all listing creation
✅ Photos and videos in same interface (tabs)
✅ Pathway selection at start
✅ Mobile item selector works
✅ Media uploads to S3/CloudFront
✅ AI generation functions
✅ Listings publish successfully

### Nice to Have:
- Drag & drop reordering
- Bulk upload progress
- Video thumbnail preview
- Mobile item search
- Dimension validation

---

## ⚡ QUICK REFERENCE

### Key State Variables
```typescript
const [pathway, setPathway] = useState<'scratch'|'mobile'|null>(null);
const [selectedMobileItem, setSelectedMobileItem] = useState<MobileItem|null>(null);
const [photos, setPhotos] = useState<Photo[]>([]);
const [videos, setVideos] = useState<Video[]>([]);
const [mediaTab, setMediaTab] = useState<'photos'|'videos'>('photos');
```

### Key Functions
```typescript
- handlePathwaySelect(type: 'scratch'|'mobile')
- handleMobileItemSelect(item: MobileItem)
- handlePhotoUpload(files: File[])
- handleVideoUpload(files: File[])
- handleGallerySelect(items: Photo[]|Video[])
- handleAIGenerate()
- handlePublish()
```

---

**Ready to build?** Copy this prompt into Cursor and start with Phase 1! 🚀

#The file path is located here:
#"C:\Users\macdo\OneDrive\Desktop\SellingtoSold\public\listing-creation-export"