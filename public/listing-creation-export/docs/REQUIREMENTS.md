# Unified Listing Creation System - Complete Requirements

## 📋 Table of Contents
1. [Overview](#overview)
2. [System Architecture](#system-architecture)
3. [Two Pathways Explained](#two-pathways-explained)
4. [Component Specifications](#component-specifications)
5. [API Integration](#api-integration)
6. [Database Schema](#database-schema)
7. [User Flows](#user-flows)
8. [Implementation Guide](#implementation-guide)

---

## 🎯 Overview

This is a streamlined listing creation system that combines photo and video upload into a single, unified interface with two distinct pathways for creating listings.

### Key Improvements Over TreasureHub
| TreasureHub (Old) | Selling To Sold (New) |
|---|---|
| 3 separate steps (Video → Photo → AI) | Single unified page |
| Photos and videos on different pages | Photos and videos in ONE interface (tabs) |
| Complex multi-step wizard | Two clear pathways |
| Manual entry required | Option to use pre-packaged iOS items |

---

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│              UNIFIED LISTING CREATION SYSTEM                 │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  START: Choose Your Pathway                                 │
│  ┌─────────────────┐      ┌──────────────────┐            │
│  │ Build from      │      │ Use iOS Item     │            │
│  │ Scratch         │      │ (Pre-packaged)   │            │
│  └────────┬────────┘      └────────┬─────────┘            │
│           │                         │                       │
│           ▼                         ▼                       │
│  ┌─────────────────┐      ┌──────────────────┐            │
│  │ Unified Media   │      │ Mobile Item      │            │
│  │ Upload          │      │ Selector         │            │
│  │ • Photos tab    │      │ • Grid view      │            │
│  │ • Videos tab    │      │ • Search/filter  │            │
│  │ • Gallery select│      │ • Load with media│            │
│  │ • Bulk upload   │      │ • Load metadata  │            │
│  └────────┬────────┘      └────────┬─────────┘            │
│           │                         │                       │
│           └────────┬────────────────┘                       │
│                    ▼                                         │
│          ┌──────────────────┐                               │
│          │ Media Preview    │                               │
│          │ • Photos         │                               │
│          │ • Videos         │                               │
│          │ • Reorder        │                               │
│          └────────┬─────────┘                               │
│                   ▼                                          │
│          ┌──────────────────┐                               │
│          │ Form Fields      │                               │
│          │ • Title, Price   │                               │
│          │ • Dimensions*    │                               │
│          │ • Category       │                               │
│          │ • Description    │                               │
│          └────────┬─────────┘                               │
│                   ▼                                          │
│          ┌──────────────────┐                               │
│          │ AI Generation    │                               │
│          │ • Analyze media  │                               │
│          │ • Use metadata*  │                               │
│          │ • Fill fields    │                               │
│          └────────┬─────────┘                               │
│                   ▼                                          │
│          ┌──────────────────┐                               │
│          │ Review & Publish │                               │
│          └──────────────────┘                               │
│                                                              │
│  * Auto-filled if iOS item selected                        │
└─────────────────────────────────────────────────────────────┘
```

---

## 🚪 Two Pathways Explained

### Pathway A: Build from Scratch

**When to use:** Creating a listing for an item you have in hand, need to photograph and describe.

**Flow:**
1. User selects "Build from Scratch"
2. Media Upload Interface appears
3. User uploads photos (drag & drop or browse)
4. User uploads videos (same interface, different tab)
5. OR user selects from photo/video gallery
6. User fills basic fields (title, price, etc.)
7. AI generates detailed description and fills remaining fields
8. User reviews and publishes

**Benefits:**
- Complete control over media
- Flexible upload options
- Can use existing gallery media
- AI analyzes fresh uploads

---

### Pathway B: Use iOS Item (Pre-packaged)

**When to use:** Item was already photographed/videoed using Selling To Sold iOS app with dimensions measured.

**Flow:**
1. User selects "Use Item from iOS App"
2. Mobile Item Selector modal opens
3. User sees grid of items uploaded from phone
4. User clicks an item
5. System loads:
   - All photos from the item
   - All videos from the item
   - Dimensions (height, width, depth)
   - Custom ID and notes
6. Dimensions are pre-filled in form
7. User can add more media if needed
8. AI generates listing using existing media + metadata
9. User reviews and publishes

**Benefits:**
- No re-uploading needed
- Dimensions already measured
- Notes/context preserved
- Faster listing creation
- Mobile-to-desktop workflow

---

## 🧩 Component Specifications

### 1. UnifiedMediaUpload Component

**File:** `components/UnifiedMediaUpload.tsx`

**Purpose:** Single interface for uploading/selecting both photos and videos.

#### Features:
- **Tabbed Interface** - Switch between Photos and Videos
- **Upload Methods**
  - Drag & Drop
  - File browser
  - Gallery selection
- **Bulk Upload** - Multiple files at once
- **Progress Tracking** - Upload progress for each file
- **Preview Grid** - Thumbnails of selected media
- **Reordering** - Drag photos to reorder
- **Categorization** - Mark photos as Hero, Back, Proof, Additional
- **Remove** - Delete from selection

#### Props Interface:
```typescript
interface UnifiedMediaUploadProps {
  // Photo state
  photos: Photo[];
  onPhotosChange: (photos: Photo[]) => void;
  
  // Video state
  videos: Video[];
  onVideosChange: (videos: Video[]) => void;
  
  // Active tab
  activeTab: 'photos' | 'videos';
  onTabChange: (tab: 'photos' | 'videos') => void;
  
  // Upload method
  uploadMethod: 'upload' | 'gallery';
  onUploadMethodChange: (method: 'upload' | 'gallery') => void;
  
  // Limits
  maxPhotos?: number;       // Default: 10
  maxVideos?: number;       // Default: 5
  
  // States
  isUploading?: boolean;
  uploadProgress?: Record<string, number>;  // fileId -> progress %
  
  // Callbacks
  onError?: (error: string) => void;
  onSuccess?: (message: string) => void;
}

interface Photo {
  id?: string;              // ID if from gallery
  file?: File;              // File if newly uploaded
  url: string;              // S3/CloudFront URL
  thumbnailUrl?: string;
  category: 'hero' | 'back' | 'proof' | 'additional';
  order: number;
  status: 'uploading' | 'uploaded' | 'error';
  progress?: number;
}

interface Video {
  id?: string;
  file?: File;
  url: string;
  thumbnailUrl?: string;
  frameUrls?: string[];
  duration?: number;
  order: number;
  status: 'uploading' | 'processing' | 'ready' | 'error';
  progress?: number;
}
```

#### UI Layout:
```
┌──────────────────────────────────────────────┐
│ [Photos Tab]  [Videos Tab]                   │
├──────────────────────────────────────────────┤
│ Upload Method:                               │
│ ○ Upload New      ○ Select from Gallery     │
├──────────────────────────────────────────────┤
│                                              │
│ [If Upload New:]                             │
│ ┌──────────────────────────────────────┐    │
│ │                                       │    │
│ │      Drag & Drop Files Here          │    │
│ │                                       │    │
│ │          or                           │    │
│ │                                       │    │
│ │      [Browse Files]                   │    │
│ │                                       │    │
│ └──────────────────────────────────────┘    │
│                                              │
│ [If Gallery:]                                │
│ Opens PhotoGalleryModal or VideoGalleryModal│
├──────────────────────────────────────────────┤
│ Selected Media: (3/10)                       │
│                                              │
│ ┌─────┐ ┌─────┐ ┌─────┐                    │
│ │Hero │ │Back │ │Proof│  [+ Add More]      │
│ │ [×] │ │ [×] │ │ [×] │                    │
│ │ ↕   │ │ ↕   │ │ ↕   │                    │
│ └─────┘ └─────┘ └─────┘                    │
│                                              │
│ [Hero] [Back] [Proof] [Additional] ← Labels │
└──────────────────────────────────────────────┘
```

#### Key Methods:
```typescript
// Photo handling
async function handlePhotoUpload(files: File[]): Promise<void>
async function handlePhotoGallerySelect(photoIds: string[]): Promise<void>
function handlePhotoReorder(fromIndex: number, toIndex: number): void
function handlePhotoRemove(photoId: string): void
function handlePhotoCategoryChange(photoId: string, category: string): void

// Video handling  
async function handleVideoUpload(files: File[]): Promise<void>
async function handleVideoGallerySelect(videoIds: string[]): Promise<void>
function handleVideoReorder(fromIndex: number, toIndex: number): void
function handleVideoRemove(videoId: string): void

// Upload to S3
async function uploadToS3(file: File, type: 'photo'|'video'): Promise<{url: string; thumbnailUrl?: string}>

// Track progress
function updateUploadProgress(fileId: string, progress: number): void
```

---

### 2. MobileItemSelector Component

**File:** `components/MobileItemSelector.tsx`

**Purpose:** Modal for selecting pre-packaged items from iOS app.

#### Features:
- **Grid Display** - Visual grid of available items
- **Search** - Filter by item ID, notes, date
- **Status Filter** - Show pending or all
- **Preview** - First photo, item count, dimensions
- **Selection** - Click to select and load
- **Empty State** - Message if no items available

#### Props Interface:
```typescript
interface MobileItemSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (item: MobileItem) => void;
  userId: string;
}

interface MobileItem {
  id: string;
  userId: string;
  status: 'pending' | 'used';
  appSource: string;
  createdAt: Date;
  updatedAt: Date;
  
  // Relations
  media: Array<{
    id: string;
    url: string;
    thumbnailUrl?: string;
    type: 'photo' | 'video';
    mimeType: string;
  }>;
  
  metadata?: {
    customItemId?: string;
    height?: string;
    width?: string;
    depth?: string;
    notes?: string;
  };
}
```

#### UI Layout:
```
┌────────────────────────────────────────────┐
│ Select Item from iOS App           [×]     │
├────────────────────────────────────────────┤
│ Search: [__________________] [Filter ▼]    │
├────────────────────────────────────────────┤
│ Items (Pending Only):                      │
│                                            │
│ ┌─────────────┐ ┌─────────────┐          │
│ │ [Thumbnail] │ │ [Thumbnail] │          │
│ │             │ │             │          │
│ │ ID: #A1234  │ │ ID: #B5678  │          │
│ │ 📏 24×36×12 │ │ 📏 48×24×18 │          │
│ │ 📷 3 photos │ │ 📷 5 photos │          │
│ │ 🎥 1 video  │ │ 🎥 2 videos │          │
│ │ 📝 Notes... │ │             │          │
│ │             │ │             │          │
│ │  [Select]   │ │  [Select]   │          │
│ └─────────────┘ └─────────────┘          │
│                                            │
│ ┌─────────────┐ ┌─────────────┐          │
│ │ [Thumbnail] │ │ [+ More]    │          │
│ └─────────────┘ └─────────────┘          │
├────────────────────────────────────────────┤
│                              [Cancel]      │
└────────────────────────────────────────────┘
```

#### Key Methods:
```typescript
async function fetchMobileItems(): Promise<MobileItem[]>
function filterItems(items: MobileItem[], query: string): MobileItem[]
function handleSearch(query: string): void
function handleSelect(item: MobileItem): void
async function markItemAsUsed(itemId: string): Promise<void>
```

---

### 3. CreateListingPage Component

**File:** `app/create-listing/page.tsx`

**Purpose:** Main page orchestrating the entire listing creation flow.

#### State Management:
```typescript
// Pathway selection
const [pathway, setPathway] = useState<'scratch' | 'mobile' | null>(null);

// Mobile item (if pathway B)
const [selectedMobileItem, setSelectedMobileItem] = useState<MobileItem | null>(null);
const [showMobileItemSelector, setShowMobileItemSelector] = useState(false);

// Media
const [photos, setPhotos] = useState<Photo[]>([]);
const [videos, setVideos] = useState<Video[]>([]);
const [mediaTab, setMediaTab] = useState<'photos' | 'videos'>('photos');
const [uploadMethod, setUploadMethod] = useState<'upload' | 'gallery'>('upload');

// Form fields
const [title, setTitle] = useState('');
const [price, setPrice] = useState('');
const [condition, setCondition] = useState('');
const [department, setDepartment] = useState('');
const [category, setCategory] = useState('');
const [description, setDescription] = useState('');
const [height, setHeight] = useState('');
const [width, setWidth] = useState('');
const [depth, setDepth] = useState('');
const [zipCode, setZipCode] = useState('');
const [deliveryCategory, setDeliveryCategory] = useState('');

// AI generation
const [aiLoading, setAiLoading] = useState(false);
const [aiUserInput, setAiUserInput] = useState('');

// Publishing
const [isPublishing, setIsPublishing] = useState(false);
```

#### Key Workflows:

**1. Pathway Selection:**
```typescript
function handlePathwaySelect(type: 'scratch' | 'mobile') {
  setPathway(type);
  
  if (type === 'mobile') {
    setShowMobileItemSelector(true);
  }
}
```

**2. Mobile Item Loading:**
```typescript
async function handleMobileItemSelect(item: MobileItem) {
  setSelectedMobileItem(item);
  setShowMobileItemSelector(false);
  
  // Load all media from item
  const itemPhotos = item.media
    .filter(m => m.mimeType.startsWith('image/'))
    .map((m, index) => ({
      id: m.id,
      url: m.url,
      thumbnailUrl: m.thumbnailUrl,
      category: index === 0 ? 'hero' : 'additional',
      order: index,
      status: 'uploaded' as const
    }));
  
  const itemVideos = item.media
    .filter(m => m.mimeType.startsWith('video/'))
    .map((m, index) => ({
      id: m.id,
      url: m.url,
      thumbnailUrl: m.thumbnailUrl,
      order: index,
      status: 'ready' as const
    }));
  
  setPhotos(itemPhotos);
  setVideos(itemVideos);
  
  // Auto-fill metadata if available
  if (item.metadata) {
    if (item.metadata.height) setHeight(item.metadata.height);
    if (item.metadata.width) setWidth(item.metadata.width);
    if (item.metadata.depth) setDepth(item.metadata.depth);
    if (item.metadata.customItemId) {
      // Could set as externalItemId or display somewhere
    }
  }
}
```

**3. AI Generation:**
```typescript
async function handleAIGenerate() {
  setAiLoading(true);
  
  try {
    const response = await fetch('/api/ai/generate-comprehensive-listing', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userInput: aiUserInput,
        photos: photos.map(p => ({ url: p.url })),
        video: videos[0] ? {
          url: videos[0].url,
          thumbnailUrl: videos[0].thumbnailUrl,
          frameUrls: videos[0].frameUrls || [],
          duration: videos[0].duration || 0
        } : undefined,
        mobileItemMetadata: selectedMobileItem?.metadata ? {
          customItemId: selectedMobileItem.metadata.customItemId,
          height: selectedMobileItem.metadata.height,
          width: selectedMobileItem.metadata.width,
          depth: selectedMobileItem.metadata.depth,
          notes: selectedMobileItem.metadata.notes
        } : undefined,
        mode: 'comprehensive'
      })
    });
    
    const data = await response.json();
    
    // Fill form fields from AI response
    if (data.title) setTitle(data.title);
    if (data.description) setDescription(data.description);
    if (data.price) setPrice(String(data.price));
    if (data.condition) setCondition(data.condition);
    if (data.department) setDepartment(data.department);
    if (data.category) setCategory(data.category);
    // ... etc
    
  } catch (error) {
    console.error('AI generation failed:', error);
    alert('Failed to generate listing. Please try again.');
  } finally {
    setAiLoading(false);
  }
}
```

**4. Publishing:**
```typescript
async function handlePublish() {
  // Validation
  if (!title || !price || photos.length === 0) {
    alert('Please fill required fields and add at least one photo');
    return;
  }
  
  setIsPublishing(true);
  
  try {
    const response = await fetch('/api/listings/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title,
        price: parseFloat(price),
        condition,
        department,
        category,
        description,
        height: height ? parseFloat(height) : undefined,
        width: width ? parseFloat(width) : undefined,
        depth: depth ? parseFloat(depth) : undefined,
        zipCode,
        deliveryCategory,
        photos: photos.map(p => ({
          id: p.id,
          url: p.url,
          category: p.category
        })),
        videos: videos.map(v => ({
          id: v.id,
          url: v.url
        })),
        mobileItemId: selectedMobileItem?.id
      })
    });
    
    const data = await response.json();
    
    if (data.success) {
      // Mark mobile item as used if applicable
      if (selectedMobileItem) {
        await fetch(`/api/mobile/items/${selectedMobileItem.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'used' })
        });
      }
      
      // Redirect to listing
      router.push(`/listings/${data.listingId}`);
    }
    
  } catch (error) {
    console.error('Publishing failed:', error);
    alert('Failed to publish listing. Please try again.');
  } finally {
    setIsPublishing(false);
  }
}
```

#### Page Layout:
```typescript
return (
  <div className="max-w-6xl mx-auto p-6">
    <h1>Create New Listing</h1>
    
    {/* Step 1: Pathway Selection */}
    {!pathway && (
      <PathwaySelector onSelect={handlePathwaySelect} />
    )}
    
    {/* Step 2: Media & Form */}
    {pathway && (
      <>
        {/* Media Upload/Display */}
        <section className="mb-8">
          <h2>Media</h2>
          {selectedMobileItem && (
            <div className="mb-4 p-4 bg-blue-50 rounded">
              <p>✅ Using iOS item: {selectedMobileItem.metadata?.customItemId}</p>
              <p>📷 {photos.length} photos, 🎥 {videos.length} videos</p>
              {selectedMobileItem.metadata && (
                <p>📏 {selectedMobileItem.metadata.width}×{selectedMobileItem.metadata.height}×{selectedMobileItem.metadata.depth}</p>
              )}
            </div>
          )}
          
          <UnifiedMediaUpload
            photos={photos}
            onPhotosChange={setPhotos}
            videos={videos}
            onVideosChange={setVideos}
            activeTab={mediaTab}
            onTabChange={setMediaTab}
            uploadMethod={uploadMethod}
            onUploadMethodChange={setUploadMethod}
          />
        </section>
        
        {/* AI Generation */}
        {(photos.length > 0 || videos.length > 0) && (
          <section className="mb-8">
            <h2>AI Generation</h2>
            <textarea
              placeholder="Describe your item (optional)..."
              value={aiUserInput}
              onChange={(e) => setAiUserInput(e.target.value)}
              rows={3}
            />
            <button onClick={handleAIGenerate} disabled={aiLoading}>
              {aiLoading ? 'Generating...' : 'Generate with AI'}
            </button>
          </section>
        )}
        
        {/* Form Fields */}
        <section className="mb-8">
          <h2>Listing Details</h2>
          <div className="grid grid-cols-2 gap-4">
            <input placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
            <input placeholder="Price" value={price} onChange={(e) => setPrice(e.target.value)} />
            <select value={condition} onChange={(e) => setCondition(e.target.value)}>
              <option value="">Condition</option>
              <option value="New">New</option>
              <option value="Used - Like New">Used - Like New</option>
              <option value="Used - Good">Used - Good</option>
              <option value="Used - Fair">Used - Fair</option>
            </select>
            {/* ... more fields ... */}
          </div>
          
          <div className="grid grid-cols-3 gap-4 mt-4">
            <input placeholder="Height (in)" value={height} onChange={(e) => setHeight(e.target.value)} />
            <input placeholder="Width (in)" value={width} onChange={(e) => setWidth(e.target.value)} />
            <input placeholder="Depth (in)" value={depth} onChange={(e) => setDepth(e.target.value)} />
          </div>
          
          <textarea
            placeholder="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={6}
            className="mt-4"
          />
        </section>
        
        {/* Publish */}
        <section>
          <button
            onClick={handlePublish}
            disabled={isPublishing}
            className="w-full py-3 bg-blue-500 text-white rounded-lg"
          >
            {isPublishing ? 'Publishing...' : 'Publish Listing'}
          </button>
        </section>
      </>
    )}
    
    {/* Mobile Item Selector Modal */}
    <MobileItemSelector
      isOpen={showMobileItemSelector}
      onClose={() => setShowMobileItemSelector(false)}
      onSelect={handleMobileItemSelect}
      userId={session?.user?.id || ''}
    />
  </div>
);
```

---

## 🔌 API Integration

### Endpoints Required

#### 1. Photo Gallery API
```
GET  /api/photo-gallery
     Query: ?status=available&userId={userId}
     Response: { photos: PhotoGallery[] }

POST /api/photo-gallery
     Body: FormData with file
     Response: { photo: PhotoGallery }
```

#### 2. Video API
```
POST /api/videos/upload
     Body: FormData with file, listingId (optional)
     Response: { videoId: string, status: 'processing' }

GET  /api/videos/status/:id
     Response: {
       videoId: string,
       status: 'processing' | 'completed' | 'failed',
       urls: { processedVideo, thumbnail, frames[] },
       metadata: { duration, resolution }
     }
```

#### 3. Mobile Items API
```
GET  /api/mobile/items
     Query: ?status=pending&userId={userId}
     Response: { items: MobileItem[] }

GET  /api/mobile/items/:id
     Response: { item: MobileItem (with relations) }

PATCH /api/mobile/items/:id
      Body: { status: 'used' }
      Response: { success: true }
```

#### 4. AI Generation API
```
POST /api/ai/generate-comprehensive-listing
     Body: {
       userInput: string,
       photos: Array<{url: string}>,
       video?: {url, thumbnailUrl, frameUrls, duration},
       mobileItemMetadata?: {
         customItemId, height, width, depth, notes
       },
       mode: 'comprehensive'
     }
     Response: {
       title, description, price, condition,
       department, category, subCategory,
       brand, modelNumber, dimensions, etc.
     }
```

#### 5. Listing Creation API
```
POST /api/listings/create
     Body: {
       title, price, condition, department, category,
       description, dimensions, zipCode, deliveryCategory,
       photos: Array<{id, url, category}>,
       videos: Array<{id, url}>,
       mobileItemId?: string
     }
     Response: { success: true, listingId: string }
```

---

## 🗄️ Database Schema

### Required Models

```prisma
model PhotoGallery {
  id              String    @id @default(cuid())
  userId          String
  url             String    @db.Text
  thumbnailUrl    String?   @db.Text
  originalFilename String
  fileSize        Int?
  mimeType        String?
  status          String    @default("available")  // available | listed
  listingId       String?
  mobileItemId    String?
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  
  user            User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  listing         Listing?  @relation(fields: [listingId], references: [id], onDelete: SetNull)
  mobileItem      MobileItem? @relation(fields: [mobileItemId], references: [id], onDelete: SetNull)
  
  @@index([userId])
  @@index([status])
  @@index([listingId])
  @@index([mobileItemId])
}

model Video {
  id           String   @id @default(cuid())
  userId       String
  originalUrl  String   @db.Text
  processedUrl String?  @db.Text
  thumbnailUrl String?  @db.Text
  frameUrls    String[] @default([])
  duration     Int?
  resolution   String?
  status       String   @default("processing")  // processing | completed | failed
  listingId    String?
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
  
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  listing      Listing? @relation(fields: [listingId], references: [id], onDelete: SetNull)
  
  @@index([userId])
  @@index([status])
  @@index([listingId])
}

model MobileItem {
  id          String      @id @default(cuid())
  userId      String
  status      String      @default("pending")  // pending | used
  appSource   String      @default("selling-to-sold")
  createdAt   DateTime    @default(now())
  updatedAt   DateTime    @updatedAt
  
  user        User        @relation(fields: [userId], references: [id], onDelete: Cascade)
  media       PhotoGallery[]
  metadata    MobileItemMetadata?
  listings    Listing[]   // Items can be listed multiple times
  
  @@index([userId])
  @@index([status])
  @@index([createdAt])
}

model MobileItemMetadata {
  id           String     @id @default(cuid())
  mobileItemId String     @unique
  customItemId String?
  height       String?
  width        String?
  depth        String?
  notes        String?    @db.Text
  createdAt    DateTime   @default(now())
  updatedAt    DateTime   @updatedAt
  
  mobileItem   MobileItem @relation(fields: [mobileItemId], references: [id], onDelete: Cascade)
  
  @@index([mobileItemId])
}

model Listing {
  id                String    @id @default(cuid())
  userId            String
  title             String
  price             Float
  condition         String
  department        String?
  category          String?
  subCategory       String?
  description       String    @db.Text
  height            Float?
  width             Float?
  depth             Float?
  zipCode           String
  deliveryCategory  String
  status            String    @default("active")
  mobileItemId      String?
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt
  
  user              User      @relation(fields: [userId], references: [id])
  mobileItem        MobileItem? @relation(fields: [mobileItemId], references: [id])
  galleryPhotos     PhotoGallery[]
  videos            Video[]
  
  @@index([userId])
  @@index([status])
  @@index([mobileItemId])
}
```

---

## 👥 User Flows

### Flow A: Build from Scratch

```
1. User lands on /create-listing
   ↓
2. User sees two options:
   "Build from Scratch" | "Use iOS Item"
   ↓
3. User clicks "Build from Scratch"
   ↓
4. Unified Media Upload appears
   ↓
5. User clicks "Photos" tab
   ↓
6. User drags 5 photos into drop zone
   ↓
7. Photos upload to S3 with progress bars
   ↓
8. Thumbnails appear in grid
   ↓
9. User drags first photo to "Hero" position
   ↓
10. User clicks "Videos" tab
   ↓
11. User uploads 1 video
   ↓
12. Video processes in background
   ↓
13. User fills: Title, Price, Condition
   ↓
14. User clicks "Generate with AI"
   ↓
15. AI analyzes photos + video
   ↓
16. AI fills: Description, Dimensions, Category
   ↓
17. User reviews and edits AI output
   ↓
18. User clicks "Publish Listing"
   ↓
19. Listing created, user redirected to listing page
```

### Flow B: Use iOS Item

```
1. User lands on /create-listing
   ↓
2. User sees two options:
   "Build from Scratch" | "Use iOS Item"
   ↓
3. User clicks "Use iOS Item"
   ↓
4. Mobile Item Selector modal opens
   ↓
5. Grid shows 6 pending items from iOS
   ↓
6. Each item shows: Thumbnail, ID, Dimensions, Media count
   ↓
7. User searches "table" in search box
   ↓
8. Grid filters to 2 matching items
   ↓
9. User clicks first item
   ↓
10. Modal closes
   ↓
11. Item loads:
    - 4 photos appear in media grid
    - 1 video appears
    - Dimensions auto-fill: 48×24×18
    - Notes appear: "Oak dining table, minor scratches"
   ↓
12. User adds 1 more photo (optional)
   ↓
13. User fills: Title, Price, Condition
   ↓
14. User clicks "Generate with AI"
   ↓
15. AI uses:
    - Existing 5 photos
    - 1 video
    - Dimensions from metadata
    - Notes from metadata
   ↓
16. AI fills all remaining fields
   ↓
17. User reviews (dimensions already correct!)
   ↓
18. User clicks "Publish Listing"
   ↓
19. Listing created
   ↓
20. Mobile item marked as "used"
   ↓
21. User redirected to listing page
```

---

## 🚀 Implementation Guide

### Phase 1: Setup (Day 1)

**1. Create folder structure:**
```
app/
  create-listing/
    page.tsx
components/
  UnifiedMediaUpload.tsx
  MobileItemSelector.tsx
  PathwaySelector.tsx
  MediaPreview.tsx
```

**2. Copy necessary utilities:**
- `lib/s3-upload.ts` - S3 upload functions
- `lib/video-upload.ts` - Video validation
- `lib/ai-service.ts` - AI integration

**3. Verify API endpoints exist:**
- [ ] Photo gallery routes
- [ ] Video upload routes
- [ ] Mobile items routes
- [ ] AI generation route
- [ ] Listing creation route

### Phase 2: Components (Days 2-3)

**1. Build PathwaySelector:**
- Simple two-button UI
- Handles pathway selection
- Triggers appropriate flow

**2. Build MobileItemSelector:**
- Fetch mobile items API
- Grid display with thumbnails
- Search functionality
- Click to select

**3. Build UnifiedMediaUpload:**
- Tabbed interface (Photos/Videos)
- Upload method toggle (Upload/Gallery)
- Drag & drop zone
- Gallery modal integration
- Progress tracking
- Preview grid with reordering

**4. Build MediaPreview:**
- Display selected photos/videos
- Thumbnail grid
- Remove/reorder actions
- Category labels for photos

### Phase 3: Main Page (Day 4)

**1. Create page structure:**
- Pathway selection screen
- Media section
- AI generation section
- Form fields section
- Publish button

**2. Implement state management:**
- Pathway state
- Media state (photos, videos)
- Form field state
- Mobile item state
- Loading states

**3. Wire up workflows:**
- Pathway selection → show appropriate UI
- Mobile item selection → load media + metadata
- Media upload → update state
- AI generation → call API, fill fields
- Publish → create listing, redirect

### Phase 4: Integration (Day 5)

**1. Connect to APIs:**
- Photo upload to S3
- Video upload + processing
- Mobile items fetch
- AI generation
- Listing creation

**2. Handle edge cases:**
- Upload failures
- Network errors
- Validation errors
- Missing fields
- AI generation failures

**3. Add loading states:**
- Uploading photos
- Processing videos
- Generating AI
- Publishing listing

### Phase 5: Polish (Day 6)

**1. UI refinements:**
- Loading spinners
- Progress bars
- Success messages
- Error messages
- Empty states

**2. Validation:**
- Required fields
- Price format
- Dimensions format
- Photo requirements

**3. Testing:**
- Test Flow A (scratch)
- Test Flow B (iOS item)
- Test media upload
- Test AI generation
- Test publishing

---

## ✅ Success Criteria

### Must Have:
- [ ] Two pathways clearly presented
- [ ] Photos and videos in same interface (tabs)
- [ ] Bulk upload works for both
- [ ] Gallery selection works for both
- [ ] Mobile item selector displays items
- [ ] Selecting mobile item loads media + metadata
- [ ] Dimensions auto-fill from mobile item
- [ ] AI generation uses media + metadata
- [ ] Listing publishes successfully
- [ ] Mobile item marked as "used" after publish

### Nice to Have:
- [ ] Drag & drop reordering
- [ ] Real-time upload progress
- [ ] Video thumbnail preview
- [ ] Search in mobile item selector
- [ ] Photo categorization (hero, back, proof)
- [ ] Dimension validation
- [ ] Price validation
- [ ] Success animations

---

## 📚 Reference

### TreasureHub Files to Reference:
1. `app/(dashboard)/list-item/page.tsx` - Main listing logic (large file)
2. `app/components/PhotoGalleryModal.tsx` - Photo gallery
3. `app/components/VideoUpload.tsx` - Video upload
4. `app/api/mobile/items/route.ts` - Mobile items API
5. `app/api/ai/generate-comprehensive-listing/route.ts` - AI generation

### Key Concepts:
- **S3 Upload**: Use signed URLs for direct browser uploads
- **Video Processing**: Async with status polling
- **AI Integration**: GPT-4 Vision for image analysis
- **Mobile Metadata**: Trust dimensions from mobile app
- **Pathway Pattern**: Clear user choice at start

---

**Last Updated:** November 7, 2024  
**Version:** 1.0.0  
**For:** Selling To Sold Application

