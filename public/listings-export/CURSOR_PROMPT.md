# Cursor Prompt: Build Listings Page for Selling To Sold

## 🎯 Project Goal
Create a comprehensive marketplace listings page for **Selling To Sold** based on the TreasureHub listings implementation. This page should display all active property listings with advanced filtering, sorting, search, and user interaction capabilities.

## 📋 Prerequisites

Before starting, ensure you have:
1. ✅ Authentication system in place (for save/hide features)
2. ✅ Database schema with `listings` table
3. ✅ Shopping cart system (or remove cart features)
4. ✅ Image hosting solution (AWS S3, Cloudflare, etc.)
5. ✅ UI component library (shadcn/ui recommended)
6. ✅ Tailwind CSS configured
7. ✅ TypeScript setup

## 🗂️ Files Included in This Export

### Core Page
- `app/(dashboard)/listings/page.tsx` - Main listings page component (2,352 lines)

### API Endpoints
- `app/api/listings/route.ts` - Listings API (GET/POST/PATCH/DELETE)

### Components
- `app/components/ImageCarousel.tsx` - Image carousel with modal
- `app/components/QuestionsDisplay.tsx` - Q&A display component
- `app/components/CustomQRCode.tsx` - QR code generator
- `app/components/TreasureBadge.tsx` - Special item badge
- `app/components/AddToCartModal.tsx` - Cart confirmation modal

### Utilities
- `app/lib/price-calculator.ts` - Dynamic pricing with discount schedules
- `app/lib/condition-utils.ts` - Condition standardization utilities
- `app/lib/zipcodes.ts` - ZIP code and neighborhood utilities
- `app/lib/facebook-taxonomy.ts` - Category taxonomy structure
- `app/contexts/CartContext.tsx` - Shopping cart context

## 🚀 Implementation Steps

### Phase 1: Database Setup (15 minutes)

**1.1 Update your Prisma schema** to include these fields in your `Listing` model:

```prisma
model Listing {
  id                    String   @id @default(cuid())
  itemId                String   @unique // Display ID (e.g., "A1B2C3")
  userId                String
  user                  User     @relation(fields: [userId], references: [id])
  
  // Core fields
  title                 String
  description           String   @db.Text
  price                 Float
  reservePrice          Float?
  salePrice             Float?
  estimatedRetailPrice  Float?
  status                String   @default("active") // active, processing, sold
  
  // Photos
  photos                Json     // {hero, back, proof, additional[], staged}
  videoUrl              String?
  
  // Categories
  department            String
  category              String
  subCategory           String?
  
  // Product details
  brand                 String?
  modelNumber           String?
  serialNumber          String?
  dimensions            String?
  height                String?
  width                 String?
  depth                 String?
  facebookCondition     String   // new, used, refurbished, etc.
  
  // Pricing schedule
  discountSchedule      Json?    // {type: "Classic-60", ...}
  deliveryCategory      String   @default("NORMAL") // NORMAL, BULK
  
  // Location
  zipCode               String?
  neighborhood          String?
  
  // Treasure fields
  isTreasure            Boolean  @default(false)
  treasureReason        String?
  treasureFlaggedAt     DateTime?
  treasureFlaggedBy     String?
  
  // Facebook Shop integration (optional)
  facebookShopEnabled   Boolean  @default(false)
  facebookBrand         String?
  facebookCategory      String?
  facebookGtin          String?
  
  // Product specifications (optional)
  quantity              Int      @default(1)
  itemGroupId           String?
  gender                String?
  color                 String?
  size                  String?
  ageGroup              String?
  material              String?
  pattern               String?
  style                 String?
  tags                  String[]
  
  // Timestamps
  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt
  
  // Relations
  savedBy               SavedListing[]
  hiddenBy              HiddenListing[]
  cartItems             CartItem[]
  questions             Question[]
  priceHistory          PriceHistory[]
}

model SavedListing {
  id        String   @id @default(cuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id])
  listingId String
  listing   Listing  @relation(fields: [listingId], references: [id])
  savedAt   DateTime @default(now())
  
  @@unique([userId, listingId])
}

model HiddenListing {
  id        String   @id @default(cuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id])
  listingId String
  listing   Listing  @relation(fields: [listingId], references: [id])
  hiddenAt  DateTime @default(now())
  
  @@unique([userId, listingId])
}

model PriceHistory {
  id        String   @id @default(cuid())
  listingId String
  listing   Listing  @relation(fields: [listingId], references: [id])
  price     Float
  createdAt DateTime @default(now())
}
```

**1.2 Run migrations:**
```bash
npx prisma migrate dev --name add_listings_features
npx prisma generate
```

### Phase 2: Install Dependencies (5 minutes)

```bash
npm install lucide-react
npm install qrcode @types/qrcode
npm install date-fns
```

### Phase 3: Copy Core Files (10 minutes)

**3.1 Copy utility files** (in order):

```bash
# Copy utilities first (no dependencies)
cp public/listings-export/app/lib/condition-utils.ts app/lib/
cp public/listings-export/app/lib/price-calculator.ts app/lib/
cp public/listings-export/app/lib/zipcodes.ts app/lib/
cp public/listings-export/app/lib/facebook-taxonomy.ts app/lib/
```

**3.2 Copy component files:**

```bash
# Copy components
cp public/listings-export/app/components/TreasureBadge.tsx app/components/
cp public/listings-export/app/components/AddToCartModal.tsx app/components/
cp public/listings-export/app/components/ImageCarousel.tsx app/components/
cp public/listings-export/app/components/QuestionsDisplay.tsx app/components/
cp public/listings-export/app/components/CustomQRCode.tsx app/components/
```

**3.3 Copy context files:**

```bash
# Copy cart context (or skip if you don't need cart functionality)
cp public/listings-export/app/contexts/CartContext.tsx app/contexts/
```

**3.4 Copy API routes:**

```bash
# Copy API endpoints
cp public/listings-export/app/api/listings/route.ts app/api/listings/
```

**3.5 Copy main page:**

```bash
# Copy the main listings page
cp public/listings-export/app/(dashboard)/listings/page.tsx app/(dashboard)/listings/
```

### Phase 4: Configuration & Customization (30 minutes)

**4.1 Update environment variables** in `.env`:

```env
# Image Storage
NEXT_PUBLIC_CDN_URL=https://your-cdn-domain.com
S3_BUCKET=your-bucket-name
AWS_REGION=us-east-1

# Optional: Facebook/Meta integration
META_PIXEL_ID=your-pixel-id
```

**4.2 Customize branding** in `app/(dashboard)/listings/page.tsx`:

Find and replace these values:
- `#D4AF3D` → Your brand color (gold accent)
- `#b8932f` → Your brand hover color
- `TreasureHub` → Your app name
- `/TreasureHub - Logo.png` → Your logo path

**4.3 Update authentication** (if using different auth system):

Find all instances of:
```typescript
const { data: session } = authClient.useSession();
```

Replace with your auth hook (e.g., `useSession()` from NextAuth, Clerk, etc.)

**4.4 Customize category taxonomy** in `app/lib/facebook-taxonomy.ts`:

Update the `FACEBOOK_TAXONOMY` object to match your categories:

```typescript
export const FACEBOOK_TAXONOMY: FacebookTaxonomy = {
  "Properties": {
    "Residential": ["Single Family", "Condo", "Townhouse", "Multi-Family"],
    "Commercial": ["Office", "Retail", "Industrial", "Mixed-Use"],
    "Land": ["Residential Land", "Commercial Land", "Agricultural"],
  },
  // Add your categories...
};
```

**4.5 Optional: Remove features you don't need**

**If you don't need cart functionality:**
1. Remove `AddToCartModal` component imports
2. Remove cart-related state and functions
3. Replace "Add to Cart" buttons with "Contact Seller" or similar

**If you don't need treasure badges:**
1. Remove `TreasureBadge` component import
2. Remove treasure-related fields from filtering
3. Remove treasure badge rendering

**If you don't need Q&A:**
1. Remove `QuestionsDisplay` component import
2. Remove questions section from detail modal

**If you don't need save/hide:**
1. Remove save/hide button rendering
2. Remove saved/hidden state management
3. Remove API calls for save/hide

### Phase 5: API Endpoints (20 minutes)

**5.1 Create supporting API routes:**

**`app/api/user/saved-listings/route.ts`:**
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth'; // Use your auth
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const savedListings = await prisma.savedListing.findMany({
      where: { userId: session.user.id },
      select: { listingId: true }
    });

    return NextResponse.json({
      success: true,
      savedListings: savedListings.map(sl => sl.listingId)
    });
  } catch (error) {
    console.error('Error fetching saved listings:', error);
    return NextResponse.json({ error: 'Failed to fetch saved listings' }, { status: 500 });
  }
}
```

**`app/api/user/hidden-listings/route.ts`:**
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const hiddenListings = await prisma.hiddenListing.findMany({
      where: { userId: session.user.id },
      select: { listingId: true }
    });

    return NextResponse.json({
      success: true,
      hiddenListings: hiddenListings.map(hl => hl.listingId)
    });
  } catch (error) {
    console.error('Error fetching hidden listings:', error);
    return NextResponse.json({ error: 'Failed to fetch hidden listings' }, { status: 500 });
  }
}
```

**`app/api/listings/[id]/save/route.ts`:**
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const listingId = params.id;

    await prisma.savedListing.create({
      data: {
        userId: session.user.id,
        listingId: listingId
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error saving listing:', error);
    return NextResponse.json({ error: 'Failed to save listing' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const listingId = params.id;

    await prisma.savedListing.deleteMany({
      where: {
        userId: session.user.id,
        listingId: listingId
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error unsaving listing:', error);
    return NextResponse.json({ error: 'Failed to unsave listing' }, { status: 500 });
  }
}
```

**`app/api/listings/[id]/hide/route.ts`:**
```typescript
// Similar structure to save route, but using hiddenListing table
```

### Phase 6: Styling & UI Polish (15 minutes)

**6.1 Add custom colors** to `tailwind.config.js`:

```javascript
module.exports = {
  theme: {
    extend: {
      colors: {
        treasure: {
          400: '#f4d03f',
          500: '#D4AF3D',
        },
        brand: {
          primary: '#D4AF3D', // Replace with your color
          hover: '#b8932f',
        }
      }
    }
  }
}
```

**6.2 Add custom animations** (optional):

```javascript
// In tailwind.config.js
theme: {
  extend: {
    animation: {
      'fade-in': 'fadeIn 0.3s ease-in-out',
      'slide-in': 'slideIn 0.3s ease-out',
    },
    keyframes: {
      fadeIn: {
        '0%': { opacity: '0' },
        '100%': { opacity: '1' },
      },
      slideIn: {
        '0%': { transform: 'translateX(100%)' },
        '100%': { transform: 'translateX(0)' },
      },
    }
  }
}
```

### Phase 7: Testing (30 minutes)

**7.1 Test core functionality:**
- [ ] Listings display correctly in grid
- [ ] Search works across all fields
- [ ] Filters apply correctly (department, category, subcategory)
- [ ] Sort options work (newest, price, discount)
- [ ] Pagination works (first, previous, next, last)

**7.2 Test authentication:**
- [ ] Unauthenticated users see early access form
- [ ] Authenticated users can save/hide listings
- [ ] Save/hide state persists across page refreshes
- [ ] Cart integration works (if applicable)

**7.3 Test modal:**
- [ ] Detail modal opens with correct listing
- [ ] Image carousel works
- [ ] All listing details display correctly
- [ ] Modal closes properly
- [ ] Keyboard navigation works (ESC to close)

**7.4 Test responsiveness:**
- [ ] Mobile view (1 column)
- [ ] Tablet view (2 columns)
- [ ] Desktop view (4 columns)
- [ ] Large desktop view (5 columns)
- [ ] Filter panel works on all screen sizes

**7.5 Test pricing:**
- [ ] Display price calculates correctly
- [ ] Discount indicators show properly
- [ ] Sale badges appear for discounted items
- [ ] Reserve price enforced
- [ ] Time until next drop displays correctly

### Phase 8: Optional Enhancements

**8.1 Add real-time updates:**
```typescript
// Use React Query or SWR for automatic refetching
import { useQuery } from '@tanstack/react-query';

const { data, refetch } = useQuery({
  queryKey: ['listings'],
  queryFn: fetchListings,
  refetchInterval: 30000, // Refetch every 30 seconds
});
```

**8.2 Add image optimization:**
```typescript
// Use Next.js Image component
import Image from 'next/image';

<Image
  src={listing.image_urls_staged[0]}
  alt={listing.title}
  width={400}
  height={400}
  quality={85}
  placeholder="blur"
/>
```

**8.3 Add loading skeletons:**
```typescript
// Create skeleton component
const ListingSkeleton = () => (
  <div className="animate-pulse">
    <div className="bg-gray-300 h-64 rounded-lg mb-3" />
    <div className="bg-gray-300 h-4 rounded w-3/4 mb-2" />
    <div className="bg-gray-300 h-4 rounded w-1/2" />
  </div>
);
```

**8.4 Add error boundaries:**
```typescript
import { ErrorBoundary } from 'react-error-boundary';

<ErrorBoundary fallback={<ErrorFallback />}>
  <ListingsPage />
</ErrorBoundary>
```

## 🔧 Troubleshooting

### Issue: Images not displaying
**Solution:** Check CloudFront URL configuration and S3 fallback

### Issue: Filters not working
**Solution:** Verify `facebook-taxonomy.ts` structure matches your data

### Issue: Authentication errors
**Solution:** Update auth imports to match your auth system

### Issue: Cart errors
**Solution:** Ensure CartContext is properly set up or remove cart features

### Issue: Pricing calculations incorrect
**Solution:** Verify discount schedules in `price-calculator.ts`

### Issue: Slow performance
**Solution:** Implement pagination at API level for large datasets (>1000 items)

## 📊 Performance Optimization

### Current Implementation (Good for < 1000 items)
- Fetches all items at once
- Client-side filtering/sorting
- Client-side pagination

### Recommended for > 1000 items
1. **Server-side pagination:**
   ```typescript
   // In API route
   const listings = await prisma.listing.findMany({
     skip: (page - 1) * limit,
     take: limit,
     where: filterClause,
     orderBy: sortClause
   });
   ```

2. **Server-side filtering/sorting:**
   - Move filter logic to API
   - Build Prisma where clauses dynamically
   - Return pre-filtered results

3. **Virtual scrolling:**
   - Use `react-window` or `react-virtualized`
   - Only render visible items

4. **Image lazy loading:**
   - Use Next.js Image component
   - Implement blur placeholder

## 🎨 Customization Ideas

### For Real Estate (Selling To Sold)

**1. Replace categories:**
```typescript
"Properties": {
  "Residential": ["Single Family", "Condo", "Townhouse", "Multi-Family"],
  "Commercial": ["Office", "Retail", "Industrial", "Mixed-Use"],
  "Land": ["Residential Land", "Commercial Land", "Agricultural"]
}
```

**2. Add property-specific filters:**
- Bedrooms
- Bathrooms
- Square footage
- Price range
- Year built
- Lot size

**3. Update listing cards to show:**
- Address (if allowed)
- Bedrooms/bathrooms
- Square footage
- Price per square foot
- Days on market
- Open house dates

**4. Replace treasure badge with:**
- "Hot Property"
- "Price Reduced"
- "New Listing"
- "Open House"

**5. Replace discount schedule with:**
- Days on market
- Price history chart
- Comparable properties

### For E-Commerce

**1. Add product-specific features:**
- Size/color variants
- Stock quantity
- Shipping information
- Return policy

**2. Add quick view:**
- Hover to preview
- Quick add to cart
- Size selector

**3. Add comparison feature:**
- Select multiple items
- Compare side-by-side
- Highlight differences

## 🔐 Security Considerations

1. **Sanitize search input:** Prevent XSS attacks
2. **Rate limit API:** Prevent abuse
3. **Validate filters:** Check category exists
4. **Authenticate mutations:** Require auth for save/hide
5. **CSRF protection:** Use tokens for state-changing operations
6. **Input validation:** Validate all user inputs server-side

## 📱 Mobile Optimization

1. **Touch-friendly targets:** Minimum 44x44px buttons
2. **Swipe gestures:** Add for image carousel
3. **Bottom sheet filters:** Use drawer instead of side panel on mobile
4. **Infinite scroll:** Consider for mobile instead of pagination
5. **Sticky filters:** Keep filter button visible while scrolling

## 🚀 Deployment Checklist

Before deploying:
- [ ] All environment variables set
- [ ] Database migrations run
- [ ] Images uploaded to CDN
- [ ] Error tracking configured (Sentry, etc.)
- [ ] Analytics set up (if needed)
- [ ] Performance testing done
- [ ] Mobile testing done
- [ ] Cross-browser testing done
- [ ] SEO meta tags added
- [ ] Social sharing tags added
- [ ] Sitemap includes listing pages
- [ ] robots.txt configured

## 📚 Additional Resources

- [Prisma Documentation](https://www.prisma.io/docs/)
- [Next.js Documentation](https://nextjs.org/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [shadcn/ui Components](https://ui.shadcn.com/)
- [Lucide Icons](https://lucide.dev/)

## 🤝 Support

For issues specific to this implementation:
1. Check the SUMMARY.md for detailed feature documentation
2. Review the exported code files for implementation details
3. Check console for error messages
4. Verify all dependencies are installed
5. Ensure database schema matches requirements

## 🎉 Success Criteria

Your listings page is complete when:
- ✅ All listings display in a responsive grid
- ✅ Search, filter, and sort work correctly
- ✅ Detail modal shows full listing information
- ✅ Save/hide functionality works (if authenticated)
- ✅ Cart integration works (if applicable)
- ✅ Page is responsive on all screen sizes
- ✅ Performance is acceptable (< 3s load time)
- ✅ No console errors or warnings
- ✅ User testing confirms good UX

## 🏁 Next Steps

After completing the listings page:
1. Build individual listing detail page (`/listings/[id]`)
2. Add listing creation/editing interface
3. Implement seller dashboard
4. Add email notifications
5. Add advanced search with filters
6. Implement saved searches
7. Add listing analytics for sellers

---

**Estimated Total Time:** 2-3 hours for basic implementation
**Difficulty:** Intermediate

Good luck building your listings page! 🚀

