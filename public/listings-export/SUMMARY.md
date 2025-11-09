# Listings Page - TreasureHub Export Summary

## Overview
The Listings page is a comprehensive marketplace interface for displaying, filtering, sorting, and purchasing items. It provides an advanced shopping experience with features like save/hide functionality, dynamic pricing, treasure badges, cart integration, and a robust filtering system.

## Page Location
- **Path:** `app/(dashboard)/listings/page.tsx` (2,352 lines)
- **Route:** `/listings`
- **Type:** Client-side component ("use client")

## Key Features

### 1. **Display Grid**
- Responsive grid layout (1-5 columns based on screen size)
- Card-based listing display with hover effects
- Image carousel for listings with multiple photos
- Status overlays (SOLD, PROCESSING, etc.)
- Time-based badges (Newly Listed, Price Drop, Next Price Drop)

### 2. **Advanced Filtering System**
- Side panel filter interface
- **Department/Category/Subcategory** hierarchy filtering
- **Search:** Multi-field search (title, item ID, brand, model number, serial number, description)
- **View Options:**
  - Show/Hide Sold items
  - Show/Hide Processing items
  - Show/Hide Hidden items
  - Saved items only
  - Treasures only

### 3. **Sorting Options**
- Newest First (default)
- Price: Low to High
- Price: High to Low
- Largest Discount ($)
- Largest Discount (%)

### 4. **Dynamic Pricing**
- **Discount schedules** (Turbo-30, Classic-60)
- Automatic price drops based on listing age
- Reserve price enforcement
- Display price calculations with sale indicators
- Comparison to estimated retail price
- "X% Off Retail" badges for new items

### 5. **User Interaction Features**
- **Save Listings:** Bookmark items for later (authenticated users)
- **Hide Listings:** Hide items from view (authenticated users)
- **Add to Cart:** Direct cart integration with modal confirmation
- **View Details Modal:** Full listing details in overlay
- **Questions & Answers:** Q&A display for each listing

### 6. **Listing Detail Modal**
Contains:
- Image carousel with full-screen modal
- Price display with discount indicators
- Treasure badge (if applicable)
- Add to Cart / View Cart buttons
- Item details (condition, status, listing date, brand, dimensions, serial/model numbers)
- Seller information (name, organization, location, rating)
- QR code
- Full description
- Questions display component

### 7. **Authentication Integration**
- Unauthenticated users see early access signup
- Authenticated users can:
  - Save/hide listings
  - Add items to cart
  - Ask questions
- Cart item count display in navbar

### 8. **Pagination**
- Client-side pagination after sorting
- Configurable items per page (25/50/100)
- Page navigation (First, Previous, Next, Last)
- Results count display

### 9. **Meta Pixel Tracking**
- AddToWishlist event when saving items
- CompleteRegistration event for early access signups
- Facebook catalog integration

## API Integration

### Primary Endpoint
**GET `/api/listings`**
- Fetches all active and processing listings by default
- Excludes sold items by default
- Supports pagination parameters
- Returns listing data with:
  - User information
  - Neighborhood data (from ZIP codes)
  - Calculated display prices
  - Photo URLs (CloudFront + S3 fallback)

### Response Structure
```javascript
{
  success: boolean,
  listings: Listing[],
  pagination: {
    page: number,
    limit: number,
    total: number,
    totalPages: number,
    hasNextPage: boolean,
    hasPreviousPage: boolean
  }
}
```

### Supporting APIs
- **POST `/api/cart`** - Add item to cart
- **GET `/api/user/saved-listings`** - Get user's saved listings
- **GET `/api/user/hidden-listings`** - Get user's hidden listings
- **POST `/api/listings/{id}/save`** - Save a listing
- **DELETE `/api/listings/{id}/save`** - Unsave a listing
- **POST `/api/listings/{id}/hide`** - Hide a listing
- **DELETE `/api/listings/{id}/hide`** - Unhide a listing

## State Management

### Core States
```typescript
- listings: any[] - All fetched listings
- searchTerm: string - Search query
- selectedCategory: string - Department filter
- selectedSubCategory: string - Category filter
- selectedSubSubCategory: string - Subcategory filter
- sortBy: string - Active sort option
- filterPanelOpen: boolean - Filter panel visibility
- showSold: boolean - Display sold items
- showProcessing: boolean - Display processing items
- showHidden: boolean - Display hidden items
- showSaved: boolean - Show only saved items
- showTreasures: boolean - Show only treasures
- savedListings: Set<string> - User's saved listing IDs
- hiddenListings: Set<string> - User's hidden listing IDs
- selectedListing: any - Currently viewed listing in modal
- isModalOpen: boolean - Detail modal visibility
- currentPage: number - Current pagination page
- itemsPerPage: number - Items per page (25/50/100)
```

## Dependencies

### Components
1. **ImageCarousel** - Multi-image display with navigation
2. **QuestionsDisplay** - Q&A section for listings
3. **CustomQRCode** - QR code generation for listings
4. **TreasureBadge** - Special treasure indicator badge
5. **AddToCartModal** - Success modal after adding to cart
6. **Button** - UI button component

### Libraries/Utilities
1. **price-calculator.ts** - Dynamic pricing calculations
   - `getDisplayPrice()` - Calculate current display price
   - `getTimeUntilNextDrop()` - Time until next price drop
   - `calculateCurrentSalesPrice()` - Apply discount schedules

2. **condition-utils.ts** - Item condition utilities
   - `getStandardizedCondition()` - Format condition display
   - `getConditionColor()` - Get color class for condition
   - `isNewCondition()` - Check if item is new/like new

3. **zipcodes.ts** - ZIP code and neighborhood utilities
   - `getNeighborhoodName()` - Get neighborhood from ZIP

4. **facebook-taxonomy.ts** - Category taxonomy
   - Department > Category > Subcategory hierarchy
   - Used for filtering

5. **category-mapping.ts** - Category conversion utilities
   - `getFacebookCategories()` - Get Facebook categories
   - `mapToFacebookCategory()` - Map to Facebook category

6. **meta-pixel-client.ts** - Meta Pixel tracking
   - `trackAddToWishlist()` - Track wishlist adds
   - `trackCompleteRegistration()` - Track signups

### Contexts
1. **CartContext** - Shopping cart state management
   - `useCart()` - Cart hook
   - `addToCart()` - Add item to cart
   - `cartItemCount` - Number of items in cart

### Icons (lucide-react)
Search, Filter, Eye, MapPin, Star, QrCode, Tag, Clock, TrendingUp, TrendingDown, CheckCircle, AlertCircle, Bookmark, EyeOff, X, Calendar, DollarSign, User, Package, HelpCircle, ArrowDown, MessageCircle, Check, Shield, ExternalLink, Sparkles, ShoppingCart

## UI/UX Features

### Visual Indicators
1. **Status Badges:**
   - Available (green)
   - Sold (gray, with overlay)
   - Processing (gold, with overlay)
   - In Transit (blue)

2. **Time Badges:**
   - Newly Listed (green, < 72 hours)
   - Price Drop (red, within 48 hours)
   - Next Price Drop countdown (if within 24 hours)

3. **Price Display:**
   - Green price for discounted items
   - Strikethrough original price
   - "Sale" badge for active discounts
   - "Reserve Met" badge
   - "X% Off Retail" for new items

4. **Treasure Badge:**
   - Gradient gold badge for special items
   - Optional reason display

### Responsive Design
- Mobile: 1 column
- Tablet: 2 columns
- Desktop: 4 columns
- Large Desktop: 5 columns

### Loading States
- Spinner with "Loading listings..." message
- Smooth transitions
- Skeleton placeholders (could be added)

### Empty States
1. **No Authentication:**
   - Early access signup form
   - Benefits display (First Access, Quality Guaranteed, Easy Process)
   - TreasureHub logo

2. **No Results:**
   - Search icon
   - "No listings found" message
   - Suggestion to adjust filters

## Data Transformation

### Listing Transformation
The page transforms API data to match expected format:

```javascript
{
  id: listing.id, // Database ID (for cart operations)
  itemId: listing.itemId, // Display ID (e.g., "A1B2C3")
  seller_id: listing.userId,
  created_at: listing.createdAt,
  status: listing.status,
  qr_code_url: QR code URL,
  image_urls_staged: [hero photo],
  title: listing.title,
  description: listing.description,
  category_id: "dept_cat_subcat",
  facebookCondition: listing.facebookCondition,
  all_images: [hero, back, proof, ...additional],
  serial_number, model_number, brand, dimensions,
  discount_schedule: listing.discountSchedule,
  zip_code: listing.zipCode,
  list_price: listing.price,
  salePrice: listing.salePrice,
  estimated_retail_price: listing.estimatedRetailPrice,
  seller_name, seller_organization, location,
  rating, reviews,
  isTreasure, treasureReason
}
```

### URL Handling
- CloudFront CDN URLs as primary
- S3 fallback URLs for images
- Helper functions: `getPhotoUrl()`, `getS3FallbackUrl()`

## Performance Considerations

1. **Client-side filtering/sorting:** All listings fetched at once (reasonable for ~100 items)
2. **Image optimization:** Uses CloudFront CDN with S3 fallback
3. **Lazy loading:** Time calculations update every 60 seconds
4. **Pagination:** Reduces DOM rendering load
5. **Modal lazy loading:** Detail modal only renders when open

## Security

1. **Authentication checks:** Save/hide features require login
2. **API authentication:** Session-based auth for mutations
3. **CSRF protection:** Credentials included in fetch calls

## Future Enhancement Opportunities

1. **Search improvements:**
   - Fuzzy search
   - Search history
   - Autocomplete

2. **Filters:**
   - Price range slider
   - Condition filter
   - Distance/location filter
   - Date range filter

3. **UI:**
   - List view option
   - Comparison view
   - Virtual scrolling for large datasets
   - Image lazy loading

4. **Features:**
   - Share listing functionality
   - Print listing option
   - Email alerts for price drops
   - Similar items suggestions

## Code Quality Notes

- Well-commented code
- Consistent naming conventions
- Separated concerns (components, utilities, contexts)
- Type safety with TypeScript interfaces
- Error handling for API calls
- Loading and empty states
- Responsive design with Tailwind CSS

## Testing Considerations

### Key Test Cases
1. Listing display and grid responsiveness
2. Filter combinations (department, category, subcategory)
3. Search functionality across multiple fields
4. Sort order accuracy
5. Save/hide functionality (authenticated vs. unauthenticated)
6. Cart integration
7. Modal interactions
8. Pagination navigation
9. Price calculation accuracy
10. Time-based badge display
11. API error handling
12. Empty states (no results, no authentication)

## Known Issues / Limitations

1. Fetches all listings at once (may not scale beyond ~1000 items)
2. Client-side pagination means all data is loaded initially
3. No real-time updates (requires manual refresh)
4. Filter panel overlaps content on smaller screens
5. Time calculations update every 60 seconds (could be more granular)

## Migration Notes for "Selling To Sold"

When adapting this page for another project:

1. **Replace authentication system:** Change from `authClient` to your auth system
2. **Update API endpoints:** Modify all `/api/*` endpoints to match your backend
3. **Adjust cart integration:** Update cart context and API calls
4. **Modify taxonomy:** Replace Facebook taxonomy with your category system
5. **Update styling:** Change color scheme (replace `#D4AF3D` gold accent)
6. **Remove Meta Pixel:** Remove Facebook tracking if not needed
7. **Simplify features:** Remove treasure badges, discount schedules if not applicable
8. **Update logo/branding:** Replace TreasureHub references
9. **Adjust filtering:** Customize filters for your use case
10. **Database schema:** Ensure your listing schema matches expected fields

## File Structure

```
app/
├── (dashboard)/
│   └── listings/
│       └── page.tsx (2,352 lines) - Main listings page
├── api/
│   └── listings/
│       └── route.ts (678 lines) - Listings API endpoint
├── components/
│   ├── ImageCarousel.tsx (372 lines)
│   ├── QuestionsDisplay.tsx (277 lines)
│   ├── CustomQRCode.tsx (776 lines)
│   ├── TreasureBadge.tsx (36 lines)
│   └── AddToCartModal.tsx (80 lines)
├── lib/
│   ├── price-calculator.ts (235 lines)
│   ├── condition-utils.ts (61 lines)
│   ├── zipcodes.ts (339 lines)
│   ├── facebook-taxonomy.ts (241 lines)
│   ├── category-mapping.ts
│   └── meta-pixel-client.ts
└── contexts/
    └── CartContext.tsx (391 lines)
```

## Summary Statistics

- **Total Lines:** ~5,000+ lines across all files
- **Main Component:** 2,352 lines (listings page)
- **Dependencies:** 15+ custom components/utilities
- **API Endpoints:** 8+ endpoints
- **State Variables:** 25+ state hooks
- **Features:** 20+ distinct features

This is a production-ready, enterprise-level marketplace listing page with comprehensive functionality for e-commerce applications.

