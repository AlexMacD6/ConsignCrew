# File Inventory - My Listings Export

## Complete File Listing

This document provides a comprehensive inventory of all files included in this export, their purposes, dependencies, and relationships.

## Directory Structure

```
public/my-listings-export/
├── README.md
├── INTEGRATION_GUIDE.md
├── FILE_INVENTORY.md (this file)
├── EXPORT_SUMMARY.md
├── requirements/
│   └── user-profile-listing-management.txt
└── app/
    ├── profile/
    │   └── page.tsx
    ├── components/
    │   ├── ListingSummaryModal.tsx
    │   └── ui/
    │       └── button.tsx
    ├── hooks/
    │   └── useUserPermissions.ts
    ├── lib/
    │   └── price-calculator.ts
    └── api/
        ├── profile/
        │   ├── route.ts
        │   └── complete/
        │       └── route.ts
        └── listings/
            ├── route.ts
            └── [id]/
                └── summary/
                    └── route.ts
```

## Core Components

### 1. Profile Page Component

**File**: `app/profile/page.tsx`  
**Size**: ~1,527 lines  
**Type**: React Client Component

**Purpose**:
Main profile page with tabbed interface including My Listings tab.

**Key Features**:
- Tab navigation (Overview, My Listings, Purchases, Settings)
- Listing statistics dashboard
- Search and filter functionality
- Listing grid display
- Action buttons (View, Edit, Summary, Delete)
- Modal management

**Dependencies**:
- `react` - useState, useEffect hooks
- `next/link` - Navigation
- `next/navigation` - useRouter, useSearchParams
- `../components/ui/button` - Button component
- `lucide-react` - Icons (Users, Package, Calendar, etc.)
- `@/components/ListingSummaryModal` - Summary modal
- `../lib/auth-client` - Authentication
- `../hooks/useUserPermissions` - Permission checking
- `react-phone-input-2` - Phone number input
- `../lib/price-calculator` - Price calculation utilities

**State Management**:
```typescript
- tab: 'overview' | 'listings' | 'purchases' | 'settings'
- user: User | null
- listings: Array<Listing>
- listingsFilter: 'all' | 'active' | 'sold' | 'processing'
- listingsSearch: string
- showSummaryModal: boolean
- summaryListing: Listing | null
```

**API Calls**:
- GET `/api/profile/complete` - Fetch user, listings, and purchases
- GET `/api/listings?userOnly=true` - Refresh listings
- DELETE `/api/listings?id={id}` - Delete listing
- PATCH `/api/listings?id={id}` - Update listing status

---

### 2. Listing Summary Modal

**File**: `app/components/ListingSummaryModal.tsx`  
**Size**: ~504 lines  
**Type**: React Client Component

**Purpose**:
Modal dialog for viewing and updating detailed listing information, including transaction tracking and profit analysis.

**Key Features**:
- Listing information display
- Status management dropdown
- Transaction details form (price, payment, tax)
- Automatic tax calculation
- Profit analysis with margin calculation
- Date sold tracking
- Comments/notes field
- Fulfillment method selection

**Dependencies**:
- `react` - useState, useEffect hooks
- `lucide-react` - Icons (X, DollarSign, Package, Calendar, TrendingUp)

**Props Interface**:
```typescript
interface ListingSummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  listing: any;
  onUpdate: (updatedListing: any) => void;
}
```

**State Management**:
```typescript
- formData: {
    status: string;
    transactionPrice: string;
    paymentMethod: string;
    salesTax: string;
    taxRate: string;
    dateSold: string;
    comments: string;
    fulfillmentMethod: string;
  }
- isLoading: boolean
```

**API Calls**:
- PATCH `/api/listings/{itemId}/summary` - Update listing summary

**Calculations**:
- `getPurchasePrice()` - Extracts purchase price from inventory
- `calculateProfit()` - Net profit calculation
- `calculateProfitMargin()` - Percentage margin calculation
- Auto-calculate sales tax based on payment method

---

### 3. Button UI Component

**File**: `app/components/ui/button.tsx`  
**Size**: ~57 lines  
**Type**: React Component

**Purpose**:
Reusable button component with multiple variants and sizes.

**Dependencies**:
- `react` - forwardRef
- `@radix-ui/react-slot` - Slot component
- `class-variance-authority` - cva for variants
- `@/lib/utils` - cn utility function

**Variants**:
- default, destructive, outline, secondary, ghost, link

**Sizes**:
- default, sm, lg, icon

**Usage Example**:
```tsx
<Button variant="outline" size="sm">
  <Edit className="h-4 w-4 mr-1" />
  Edit
</Button>
```

---

## Hooks

### User Permissions Hook

**File**: `app/hooks/useUserPermissions.ts`  
**Size**: ~159 lines  
**Type**: React Custom Hook

**Purpose**:
Manages user permission checking based on organization memberships.

**Returns**:
```typescript
interface UserPermissions {
  canListItems: boolean;
  canBuyItems: boolean;
  isSeller: boolean;
  isBuyer: boolean;
  isLoading: boolean;
}
```

**Dependencies**:
- `react` - useState, useEffect, useRef
- `../lib/auth-client` - authClient for session

**Features**:
- Permission caching (5-minute TTL)
- Duplicate request prevention
- Role-based permission calculation
- Admin role inheritance
- Automatic retry on failure

**API Calls**:
- GET `/api/profile/organizations` - Fetch user organizations

**Cache Management**:
- Global cache map with timestamp
- `clearPermissionsCache()` function for manual cache clearing

---

## Utility Libraries

### Price Calculator

**File**: `app/lib/price-calculator.ts`  
**Size**: ~235 lines  
**Type**: TypeScript Utility Module

**Purpose**:
Calculates current prices based on discount schedules and listing duration.

**Exports**:

#### 1. Interfaces
```typescript
interface DiscountSchedule {
  type: string;
  dropIntervals: number[];
  dropPercentages: number[];
  totalDuration: number;
}
```

#### 2. Constants
```typescript
DISCOUNT_SCHEDULES = {
  "Turbo-30": { ... },
  "Classic-60": { ... }
}
```

#### 3. Functions

**`calculateCurrentSalesPrice(listing)`**
- Calculates current sale price based on discount schedule
- Returns: `number | null`

**`getDisplayPrice(listing)`**
- Gets display price and discount status
- Returns: `{ price: number; isDiscounted: boolean; originalPrice?: number }`

**`calculateNextDropPrice(listing)`**
- Calculates next scheduled price drop
- Returns: `number | null`

**`getTimeUntilNextDrop(listing)`**
- Gets time remaining until next price drop
- Returns: `{ timeString: string; nextDropTime: Date } | null`

**Dependencies**: None (pure utility functions)

---

## API Routes

### 1. Profile Route

**File**: `app/api/profile/route.ts`  
**Size**: ~133 lines  
**Type**: Next.js API Route

**Methods**: GET, PUT

**GET Endpoint**:
- Returns user profile data
- Requires authentication
- Returns: `{ success: boolean; user: User }`

**PUT Endpoint**:
- Updates user profile
- Requires authentication
- Accepts: name, mobilePhone, address fields
- Returns: `{ success: boolean; user: User }`

**Dependencies**:
- `next/server` - NextRequest, NextResponse
- `@/lib/auth` - Authentication
- `@/lib/prisma` - Database client

---

### 2. Complete Profile Route

**File**: `app/api/profile/complete/route.ts`  
**Size**: ~231 lines  
**Type**: Next.js API Route (Optimized)

**Methods**: GET

**Purpose**:
Combined endpoint that returns user profile, listings, purchases, and permissions in one call.

**GET Endpoint Returns**:
```typescript
{
  success: boolean;
  user: User;
  organizations: Organization[];
  permissions: {
    canListItems: boolean;
    canBuyItems: boolean;
    isSeller: boolean;
    isBuyer: boolean;
    isAdmin: boolean;
  };
  listings: Listing[];
  purchases: Purchase[];
  stats: {
    totalListings: number;
    activeListings: number;
    soldListings: number;
    totalPurchases: number;
    completedPurchases: number;
    totalSpent: number;
  };
}
```

**Optimizations**:
- Parallel database queries using `Promise.all()`
- Caching headers (30s max-age, 60s stale-while-revalidate)
- Single API call reduces round trips from 6+ to 1

**Dependencies**:
- `next/server` - NextRequest, NextResponse
- `@/lib/auth` - Authentication
- `@/lib/prisma` - Database client
- `@/lib/price-calculator` - getDisplayPrice

---

### 3. Listings Route

**File**: `app/api/listings/route.ts`  
**Size**: ~678 lines  
**Type**: Next.js API Route

**Methods**: GET, POST, DELETE, PATCH

**GET Endpoint**:
- Query Params: 
  - `status` - Filter by status (default: 'active')
  - `limit` - Items per page (default: 1000)
  - `page` - Page number (default: 1)
  - `userOnly` - Filter to user's listings only
- Returns paginated listings with neighborhood data
- Includes display price calculations
- Excludes sold items by default for public view

**POST Endpoint**:
- Creates new listing
- Generates unique 6-character item ID
- Validates required fields
- Links to inventory items if provided
- Creates initial price history entry
- Auto-syncs to Facebook catalog if enabled

**DELETE Endpoint**:
- Deletes listing by itemId
- Requires ownership verification
- Returns success confirmation

**PATCH Endpoint**:
- Updates listing fields
- Requires ownership verification
- Creates history events for changes
- Tracks status, price, and condition changes

**Dependencies**:
- `next/server` - NextRequest, NextResponse
- `@/lib/auth` - Authentication
- `@/lib/prisma` - Database client
- `@/lib/listing-history` - History event tracking
- `@/lib/product-specifications` - Validation
- `@/lib/meta-pixel-api` - Facebook pixel tracking
- `@/lib/auto-release-holds` - Hold management
- `@/lib/price-calculator` - getDisplayPrice

---

### 4. Listing Summary Route

**File**: `app/api/listings/[id]/summary/route.ts`  
**Size**: ~164 lines  
**Type**: Next.js API Route (Dynamic)

**Methods**: PATCH

**PATCH Endpoint**:
- Updates listing summary and transaction details
- Path Param: `id` (itemId)
- Accepts: status, transactionPrice, paymentMethod, salesTax, taxRate, dateSold, comments, fulfillmentMethod
- Auto-calculates purchase price from inventory if not set
- Creates history event for status changes
- Returns updated listing with inventory data

**Dependencies**:
- `next/server` - NextRequest, NextResponse
- `@/lib/auth` - Authentication
- `@/lib/prisma` - Database client

---

## Requirements Documentation

### User Profile Listing Management

**File**: `requirements/user-profile-listing-management.txt`  
**Size**: ~141 lines  
**Type**: Plain Text Documentation

**Purpose**:
Original requirements document outlining the problem, changes made, and testing instructions.

**Sections**:
1. Problem statement
2. Changes made (6 major sections)
3. API endpoint enhancements
4. User experience features
5. Listing card features
6. Security features
7. Performance optimizations
8. Future enhancements
9. Testing instructions (10 steps)
10. Dependencies

---

## File Dependencies Map

### Direct Dependencies

```
profile/page.tsx
├── ListingSummaryModal.tsx
├── ui/button.tsx
├── useUserPermissions.ts
├── price-calculator.ts
├── auth-client.ts (external)
└── API: /api/profile/complete

ListingSummaryModal.tsx
├── lucide-react (external)
└── API: /api/listings/[id]/summary

ui/button.tsx
├── @radix-ui/react-slot (external)
├── class-variance-authority (external)
└── utils.ts (external)

useUserPermissions.ts
├── auth-client.ts (external)
└── API: /api/profile/organizations

api/profile/complete/route.ts
├── auth.ts (external)
├── prisma.ts (external)
└── price-calculator.ts

api/listings/route.ts
├── auth.ts (external)
├── prisma.ts (external)
├── price-calculator.ts
├── listing-history.ts (external)
└── product-specifications.ts (external)

api/listings/[id]/summary/route.ts
├── auth.ts (external)
└── prisma.ts (external)
```

### External Dependencies (Not Included)

These files/libraries are required but not included in this export:

1. **Authentication**:
   - `app/lib/auth.ts` - Better Auth server instance
   - `app/lib/auth-client.ts` - Better Auth client instance

2. **Database**:
   - `app/lib/prisma.ts` - Prisma client instance
   - `prisma/schema.prisma` - Database schema

3. **Utilities**:
   - `app/lib/utils.ts` - Utility functions (cn)
   - `app/lib/listing-history.ts` - History event tracking
   - `app/lib/product-specifications.ts` - Product validation

4. **Components**:
   - `app/components/AddressModal.tsx` - Address entry modal
   - `app/components/HoustonMetroMap.tsx` - Service area map

5. **NPM Packages**:
   - `react`, `next` - Framework
   - `@prisma/client` - Database ORM
   - `lucide-react` - Icons
   - `react-phone-input-2` - Phone input
   - `@radix-ui/react-slot` - UI primitive
   - `class-variance-authority` - Variant management
   - `better-auth` - Authentication

---

## File Sizes

| File | Lines | Size (KB) | Type |
|------|-------|-----------|------|
| profile/page.tsx | 1,527 | ~65 | Component |
| ListingSummaryModal.tsx | 504 | ~20 | Component |
| button.tsx | 57 | ~2 | Component |
| useUserPermissions.ts | 159 | ~6 | Hook |
| price-calculator.ts | 235 | ~8 | Utility |
| api/profile/route.ts | 133 | ~5 | API |
| api/profile/complete/route.ts | 231 | ~9 | API |
| api/listings/route.ts | 678 | ~28 | API |
| api/listings/[id]/summary/route.ts | 164 | ~6 | API |
| user-profile-listing-management.txt | 141 | ~6 | Docs |

**Total**: ~155 KB (excluding documentation)

---

## Import Paths

### Absolute Imports Used
- `@/components/*` - Components directory
- `@/lib/*` - Library/utility functions
- `@/hooks/*` - Custom hooks

### Relative Imports Used
- `../components/*` - Parent component directory
- `../lib/*` - Parent library directory
- `../hooks/*` - Parent hooks directory

**Note**: You may need to update import paths based on your project structure.

---

## Database Models Referenced

### User Model
```typescript
{
  id: string;
  name: string;
  email: string;
  mobilePhone?: string;
  emailVerified?: boolean;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
  createdAt: DateTime;
  updatedAt: DateTime;
}
```

### Listing Model
```typescript
{
  id: string;
  itemId: string;
  userId: string;
  title: string;
  description: string;
  price: number;
  salePrice?: number;
  reservePrice?: number;
  status: enum;
  photos: json;
  views: number;
  saves: number;
  createdAt: DateTime;
  updatedAt: DateTime;
  transactionPrice?: number;
  paymentMethod?: string;
  salesTax?: number;
  taxRate?: number;
  soldAt?: DateTime;
  comments?: string;
  fulfillmentMethod?: string;
  purchasePrice?: number;
  discountSchedule?: json;
  inventoryItems?: InventoryItem[];
}
```

### Member Model (for permissions)
```typescript
{
  id: string;
  userId: string;
  organizationId: string;
  role: enum;
  createdAt: DateTime;
}
```

### Organization Model (for permissions)
```typescript
{
  id: string;
  name: string;
  slug: string;
}
```

### Order Model (for purchases)
```typescript
{
  id: string;
  buyerId: string;
  amount: number;
  status: enum;
  createdAt: DateTime;
  deliveredAt?: DateTime;
  trackingNumber?: string;
  listing: Listing;
}
```

---

## Configuration Files Needed

### 1. TypeScript Config (`tsconfig.json`)
```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./app/*"]
    }
  }
}
```

### 2. Tailwind Config (`tailwind.config.ts`)
```javascript
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#D4AF3D',
        // ... your colors
      }
    }
  }
}
```

### 3. Environment Variables (`.env`)
```env
DATABASE_URL="your-database-url"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

---

## Summary

This export contains **10 files** organized in a structured format:

- **3 Core Components** (Profile page, Summary modal, Button)
- **1 Custom Hook** (User permissions)
- **1 Utility Library** (Price calculator)
- **4 API Routes** (Profile, Complete profile, Listings, Summary)
- **1 Requirements Document** (Original specifications)

All files work together to provide a complete listing management system with transaction tracking, profit analysis, and role-based permissions.


