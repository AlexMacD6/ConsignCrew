# Quick Reference Guide - Listings Page

## 🚀 5-Minute Setup

```bash
# 1. Copy files
cp -r public/listings-export/app/ ./app/

# 2. Install dependencies
npm install lucide-react qrcode @types/qrcode date-fns

# 3. Update .env
NEXT_PUBLIC_CDN_URL=https://your-cdn.com
S3_BUCKET=your-bucket

# 4. Run migrations
npx prisma migrate dev

# 5. Start dev server
npm run dev
```

## 📊 Key Components at a Glance

| Component | Purpose | Lines | Dependencies |
|-----------|---------|-------|--------------|
| `page.tsx` | Main listings page | 2,352 | All components |
| `ImageCarousel` | Image display | 372 | RobustImage |
| `QuestionsDisplay` | Q&A section | 277 | QuestionModal |
| `CustomQRCode` | QR generation | 776 | qrcode library |
| `price-calculator` | Dynamic pricing | 235 | None |
| `CartContext` | Cart state | 391 | Auth client |

## 🎯 Essential Imports

```typescript
// In your listings page
import { ImageCarousel } from "@/components/ImageCarousel";
import { QuestionsDisplay } from "@/components/QuestionsDisplay";
import { CustomQRCode } from "@/components/CustomQRCode";
import { TreasureBadge } from "@/components/TreasureBadge";
import { AddToCartModal } from "@/components/AddToCartModal";

// Utilities
import { getDisplayPrice } from "@/lib/price-calculator";
import { getStandardizedCondition } from "@/lib/condition-utils";
import { getNeighborhoodName } from "@/lib/zipcodes";
import { FACEBOOK_TAXONOMY } from "@/lib/facebook-taxonomy";

// Context
import { useCart } from "@/contexts/CartContext";
```

## 🔑 Key Functions

### Price Calculation
```typescript
// Get current display price with discounts
const { price, isDiscounted, originalPrice } = getDisplayPrice(listing);

// Calculate next drop price
const nextPrice = calculateNextDropPrice(listing);

// Get time until next drop
const timeInfo = getTimeUntilNextDrop(listing);
```

### Condition Handling
```typescript
// Get standardized condition
const condition = getStandardizedCondition(listing);

// Get condition color class
const colorClass = getConditionColor(condition);

// Check if new
const isNew = isNewCondition(condition);
```

### Filtering & Sorting
```typescript
// Filter by category
const filtered = listings.filter(listing => 
  listing.department === selectedDepartment
);

// Sort by price
const sorted = listings.sort((a, b) => 
  getDisplayPrice(a).price - getDisplayPrice(b).price
);

// Search across fields
const searched = listings.filter(listing =>
  listing.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
  listing.itemId.toLowerCase().includes(searchTerm.toLowerCase())
);
```

## 🎨 Styling Classes

### Brand Colors
```css
/* Primary brand color */
bg-[#D4AF3D]
hover:bg-[#b8932f]
text-[#D4AF3D]
border-[#D4AF3D]

/* Condition colors */
bg-green-100 text-green-800 /* New */
bg-blue-100 text-blue-800   /* Used */
bg-gray-100 text-gray-800   /* Unknown */

/* Status colors */
bg-green-600 /* Available */
bg-gray-600  /* Sold */
bg-red-600   /* Error/Alert */
```

### Layout Classes
```css
/* Grid layouts */
grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5

/* Card styling */
bg-white rounded-lg shadow-md hover:shadow-lg

/* Modal */
fixed inset-0 bg-black bg-opacity-50 z-50
```

## 📱 Responsive Breakpoints

```typescript
// Tailwind breakpoints used
sm:   640px  // 2 columns
md:   768px  // Still 2 columns
lg:  1024px  // 4 columns
xl:  1280px  // 5 columns
2xl: 1536px  // 5 columns
```

## 🔐 Auth Patterns

```typescript
// Check authentication
const { data: session } = authClient.useSession();
const isAuthenticated = !!session?.user;

// Require auth for actions
if (!isAuthenticated) {
  setAuthError(true);
  return;
}

// Get current user ID
const userId = session?.user?.id;
```

## 🛒 Cart Integration

```typescript
// Add to cart
const { addToCart, cartItemCount } = useCart();
const success = await addToCart(listingId, quantity);

// Show confirmation
if (success) {
  setAddToCartModalOpen(true);
}
```

## 🔍 Search Implementation

```typescript
const matchesSearch = 
  listing.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
  listing.itemId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
  listing.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
  listing.brand?.toLowerCase().includes(searchTerm.toLowerCase()) ||
  listing.modelNumber?.toLowerCase().includes(searchTerm.toLowerCase());
```

## 📊 State Management Pattern

```typescript
// Core states
const [listings, setListings] = useState<any[]>([]);
const [searchTerm, setSearchTerm] = useState("");
const [selectedCategory, setSelectedCategory] = useState("All");
const [sortBy, setSortBy] = useState("newest");
const [filterPanelOpen, setFilterPanelOpen] = useState(false);
const [currentPage, setCurrentPage] = useState(1);

// Computed values
const filteredListings = listings.filter(/* ... */);
const sortedListings = filteredListings.sort(/* ... */);
const paginatedListings = sortedListings.slice(start, end);
```

## 🌐 API Calls

```typescript
// Fetch listings
const response = await fetch('/api/listings?page=1&limit=100');
const data = await response.json();
setListings(data.listings);

// Save listing
await fetch(`/api/listings/${id}/save`, { method: 'POST' });

// Hide listing
await fetch(`/api/listings/${id}/hide`, { method: 'POST' });

// Add to cart
await fetch('/api/cart', {
  method: 'POST',
  body: JSON.stringify({ listingId, quantity })
});
```

## 🎭 Modal Pattern

```typescript
// Open modal with listing
const openModal = (listing) => {
  setSelectedListing(listing);
  setIsModalOpen(true);
};

// Close modal
const closeModal = () => {
  setIsModalOpen(false);
  setSelectedListing(null);
};

// Render modal
{isModalOpen && selectedListing && (
  <div className="fixed inset-0 bg-black bg-opacity-50 z-50">
    {/* Modal content */}
  </div>
)}
```

## ⏱️ Time Calculations

```typescript
// Get time until next drop
const timeLeft = getTimeUntilNextDrop(
  listing.discount_schedule,
  listing.created_at
);

// Check if within 24 hours
const isWithin24Hours = isPriceDropWithin24Hours(
  listing.discount_schedule,
  listing.created_at
);

// Display countdown
{timeLeft && (
  <div className="text-xs">
    <Clock className="h-3 w-3" />
    {timeLeft}
  </div>
)}
```

## 🎯 Common Patterns

### Status Badge
```typescript
const getStatusBadge = (status: string) => {
  switch (status?.toLowerCase()) {
    case "sold":
      return { text: "Sold", className: "bg-gray-600 text-white" };
    case "active":
      return { text: "Available", className: "bg-green-600 text-white" };
    case "processing":
      return { text: "Processing", className: "bg-yellow-600 text-white" };
  }
};
```

### Price Display
```typescript
const { price, isDiscounted, originalPrice } = getDisplayPrice(listing);

{isDiscounted ? (
  <>
    <span className="text-lg font-bold text-green-600">
      ${price.toFixed(2)}
    </span>
    <span className="text-sm text-gray-500 line-through">
      ${originalPrice?.toFixed(2)}
    </span>
    <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded">
      Sale
    </span>
  </>
) : (
  <span className="text-lg font-bold text-gray-900">
    ${price.toFixed(2)}
  </span>
)}
```

### Image URLs
```typescript
// Convert S3 keys to CDN URLs
const getPhotoUrl = (photoData: any): string | null => {
  if (!photoData) return null;
  
  if (typeof photoData === "string" && photoData.startsWith("http")) {
    return photoData;
  }
  
  if (photoData?.url) return photoData.url;
  
  const cfDomain = process.env.NEXT_PUBLIC_CDN_URL;
  return `${cfDomain}/${photoData}`;
};
```

## 🐛 Common Debugging

```typescript
// Check if listing has required fields
console.log('Listing data:', {
  hasId: !!listing.id,
  hasItemId: !!listing.itemId,
  hasPrice: !!listing.price,
  hasPhotos: !!listing.photos
});

// Check filter state
console.log('Filter states:', {
  searchTerm,
  selectedCategory,
  showSold,
  showProcessing,
  totalListings: listings.length,
  filteredCount: filteredListings.length
});

// Check authentication
console.log('Auth state:', {
  isAuthenticated,
  userId: session?.user?.id,
  hasSession: !!session
});
```

## 📝 Quick Customizations

### Change Brand Color
```typescript
// Find and replace globally
"#D4AF3D" → "#YOUR_COLOR"
"#b8932f" → "#YOUR_HOVER_COLOR"
```

### Remove Features
```typescript
// Remove cart integration
// 1. Delete AddToCartModal import
// 2. Delete useCart() hook
// 3. Remove cart-related buttons
// 4. Remove cart state

// Remove save/hide
// 1. Remove savedListings/hiddenListings state
// 2. Remove save/hide buttons
// 3. Remove API calls

// Remove treasure badges
// 1. Delete TreasureBadge import
// 2. Remove treasure filtering
// 3. Remove badge rendering
```

### Update Categories
```typescript
// In facebook-taxonomy.ts
export const FACEBOOK_TAXONOMY: FacebookTaxonomy = {
  "Your Department": {
    "Your Category": ["Sub 1", "Sub 2", "Sub 3"],
  },
};
```

## 🔥 Performance Tips

```typescript
// Lazy load images
<img loading="lazy" src={image} alt={alt} />

// Debounce search
const debouncedSearch = useMemo(
  () => debounce(setSearchTerm, 300),
  []
);

// Memoize filtered results
const filteredListings = useMemo(
  () => listings.filter(/* ... */),
  [listings, searchTerm, filters]
);

// Virtual scrolling for large lists
import { useVirtual } from 'react-virtual';
```

## 📦 Production Checklist

- [ ] Environment variables set
- [ ] Images uploaded to CDN
- [ ] Database migrations run
- [ ] Error tracking configured
- [ ] Analytics added
- [ ] Performance tested
- [ ] Mobile tested
- [ ] SEO optimized
- [ ] Security reviewed
- [ ] Backup strategy in place

---

**Need more details?** Check the full documentation:
- **SUMMARY.md** - Technical deep dive
- **CURSOR_PROMPT.md** - Step-by-step guide
- **README.md** - Package overview

