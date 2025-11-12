# Integration Guide - My Listings Export

## Quick Start Guide

This guide will walk you through integrating the My Listings functionality into your Selling To Sold project.

## Prerequisites

Before starting, ensure you have:
- ✅ Next.js 14+ application set up
- ✅ Prisma ORM configured
- ✅ Authentication system (Better Auth or similar)
- ✅ User and Listing models in your database
- ✅ Tailwind CSS configured
- ✅ lucide-react icons installed

## Step 1: Copy Files to Your Project

### 1.1 Copy Main Components

```bash
# From the export directory, copy to your project:

# Profile page
cp app/profile/page.tsx <your-project>/app/profile/page.tsx

# Modal component
cp app/components/ListingSummaryModal.tsx <your-project>/app/components/ListingSummaryModal.tsx

# UI components
cp app/components/ui/button.tsx <your-project>/app/components/ui/button.tsx
```

### 1.2 Copy Hooks and Utilities

```bash
# Permissions hook
cp app/hooks/useUserPermissions.ts <your-project>/app/hooks/useUserPermissions.ts

# Price calculator
cp app/lib/price-calculator.ts <your-project>/app/lib/price-calculator.ts
```

### 1.3 Copy API Routes

```bash
# Profile endpoints
cp app/api/profile/route.ts <your-project>/app/api/profile/route.ts
cp app/api/profile/complete/route.ts <your-project>/app/api/profile/complete/route.ts

# Listings endpoints
cp app/api/listings/route.ts <your-project>/app/api/listings/route.ts
cp app/api/listings/[id]/summary/route.ts <your-project>/app/api/listings/[id]/summary/route.ts
```

## Step 2: Database Schema Updates

### 2.1 Add Transaction Tracking Fields to Listing Model

Update your `schema.prisma` file:

```prisma
model Listing {
  id                String   @id @default(cuid())
  itemId            String   @unique
  userId            String
  user              User     @relation(fields: [userId], references: [id])
  
  // Basic fields
  title             String
  description       String
  price             Float
  salePrice         Float?
  reservePrice      Float?
  status            ListingStatus @default(ACTIVE)
  photos            Json
  views             Int      @default(0)
  saves             Int      @default(0)
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
  
  // Transaction tracking (ADD THESE)
  transactionPrice  Float?
  paymentMethod     String?
  salesTax          Float?
  taxRate           Float?
  soldAt            DateTime?
  comments          String?
  fulfillmentMethod String?
  purchasePrice     Float?
  
  // Discount schedule
  discountSchedule  Json?
  
  // Relationships
  inventoryItems    InventoryItem[]
  
  @@index([userId])
  @@index([status])
  @@index([createdAt])
}

enum ListingStatus {
  ACTIVE
  SOLD
  PROCESSING
  DRAFT
}
```

### 2.2 Run Migration

```bash
npx prisma migrate dev --name add-transaction-tracking-fields
```

## Step 3: Install Required Dependencies

### 3.1 Check and Install Missing Packages

```bash
# Check if you have these installed
npm list react-phone-input-2 lucide-react @radix-ui/react-slot class-variance-authority

# Install if missing
npm install react-phone-input-2 lucide-react @radix-ui/react-slot class-variance-authority
```

### 3.2 Import Required CSS

In your root layout or global CSS file:

```css
/* For PhoneInput component */
@import 'react-phone-input-2/lib/style.css';
```

## Step 4: Set Up Authentication Requirements

### 4.1 Ensure Auth Client is Configured

Create or update `app/lib/auth-client.ts`:

```typescript
import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_APP_URL,
});
```

### 4.2 Verify Profile API Organization Endpoint

Ensure you have `/api/profile/organizations` endpoint that returns user organizations:

```typescript
// app/api/profile/organizations/route.ts
export async function GET(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers });
  
  const memberships = await prisma.member.findMany({
    where: { userId: session.user.id },
    include: { organization: true }
  });

  return NextResponse.json({
    organizations: memberships.map(m => ({
      id: m.id,
      organizationId: m.organization.id,
      organizationName: m.organization.name,
      organizationSlug: m.organization.slug,
      role: m.role,
    }))
  });
}
```

## Step 5: Configure Routing

### 5.1 Ensure Route Structure

Make sure these routes exist in your app:
- `/profile` - Profile page with My Listings tab
- `/list-item` - Create new listing page
- `/list-item/[id]` - View listing detail page
- `/list-item/[id]/edit` - Edit listing page

### 5.2 Update Navigation

Add a profile link to your navigation:

```tsx
<Link href="/profile">
  <UserIcon className="h-5 w-5" />
  Profile
</Link>
```

## Step 6: Customize for Your Project

### 6.1 Update Brand Colors

Find and replace in `profile/page.tsx`:
- `#D4AF3D` → Your primary brand color
- `#b8932f` → Your primary hover color

### 6.2 Adjust Styling

Update Tailwind classes to match your design system:
- Button styles
- Card styles
- Status badge colors
- Grid layouts

### 6.3 Modify Status Options

Update status enums in:
1. Database schema (if different statuses needed)
2. Filter dropdown in profile page
3. Summary modal status dropdown

## Step 7: Additional Components Needed

You'll need these additional components (if not already in your project):

### 7.1 Address Modal

Create `app/components/AddressModal.tsx` or import from another export.

### 7.2 Houston Metro Map

Create `app/components/HoustonMetroMap.tsx` or remove this component from profile page if not needed.

### 7.3 Utility Functions

Create `app/lib/utils.ts` if it doesn't exist:

```typescript
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

## Step 8: Testing

### 8.1 Test Basic Functionality

1. **Navigate to Profile Page**
   ```
   http://localhost:3000/profile
   ```

2. **Test Tab Switching**
   - Click on "My Listings" tab
   - Verify listings load correctly

3. **Test Statistics Cards**
   - Verify counts are accurate
   - Check color coding

4. **Test Search**
   - Type in search box
   - Verify real-time filtering

5. **Test Filters**
   - Use status dropdown
   - Verify correct listings show

6. **Test Action Buttons**
   - Click View → Should navigate to detail page
   - Click Edit → Should navigate to edit page
   - Click Summary → Should open modal
   - Click Delete → Should show confirmation and delete

7. **Test Summary Modal**
   - Open for different listings
   - Change status
   - Add transaction details
   - Verify calculations
   - Save changes

### 8.2 Test Edge Cases

- Empty listings (no listings created yet)
- Listings without photos
- Listings without inventory links
- Different status types
- Mobile responsive design

### 8.3 Test Permissions

- Users with seller role can see "Create Listing" button
- Users without seller role cannot see create button
- Only listing owners can edit/delete their listings

## Step 9: Optional Enhancements

### 9.1 Add Confirmation for Delete

Wrap delete action in confirmation dialog:

```typescript
const handleDelete = async (itemId: string) => {
  if (window.confirm('Are you sure you want to delete this listing?')) {
    await handleListingAction(itemId, 'delete');
  }
};
```

### 9.2 Add Toast Notifications

Replace success/error state variables with toast notifications:

```typescript
import { toast } from 'sonner';

// On success
toast.success('Listing updated successfully!');

// On error
toast.error('Failed to update listing');
```

### 9.3 Add Loading Skeletons

Replace loading spinner with skeleton loaders for better UX.

### 9.4 Add Pagination

For users with many listings, add pagination:

```typescript
const itemsPerPage = 12;
const [currentPage, setCurrentPage] = useState(1);

const paginatedListings = getFilteredListings().slice(
  (currentPage - 1) * itemsPerPage,
  currentPage * itemsPerPage
);
```

## Step 10: Deployment Checklist

Before deploying to production:

- [ ] All database migrations run successfully
- [ ] Environment variables set correctly
- [ ] Authentication working properly
- [ ] API routes secured (authentication checks)
- [ ] Error handling implemented
- [ ] Mobile responsive testing complete
- [ ] Cross-browser testing done
- [ ] Performance optimized (lazy loading images, etc.)
- [ ] SEO metadata added to profile page
- [ ] Analytics tracking added (if applicable)

## Troubleshooting

### Issue: Profile page shows "Loading..." indefinitely

**Solution**: Check that:
1. `/api/profile/complete` endpoint is working
2. Authentication session is valid
3. Database connection is working
4. User ID exists in database

### Issue: Listings not showing

**Solution**: Verify that:
1. User has listings in database
2. `userOnly=true` parameter is being sent correctly
3. Listing status is not filtering out all items
4. Database query is working properly

### Issue: Summary modal not opening

**Solution**: Check:
1. `ListingSummaryModal` component is imported correctly
2. State management for modal is working
3. Browser console for React errors
4. Modal z-index is high enough

### Issue: Prices showing incorrectly

**Solution**: Verify:
1. `price-calculator.ts` is imported
2. Discount schedule format is correct
3. Creation date is valid
4. Price fields are numbers, not strings

### Issue: Delete not working

**Solution**: Check:
1. DELETE API route exists and works
2. User owns the listing (ownership check)
3. Authentication token is being sent
4. Database has proper foreign key setup

### Issue: Permissions not working

**Solution**: Verify:
1. `/api/profile/organizations` endpoint works
2. User has proper organization membership
3. Role enum matches expected values
4. `useUserPermissions` hook is called correctly

## Support

For issues specific to this integration:
1. Check the requirements document
2. Review the original TreasureHub implementation
3. Verify all files were copied correctly
4. Check database schema matches expected format

## Next Steps

After successful integration:
1. Review the FAQ section in README.md
2. Consider adding custom features
3. Optimize performance for your specific use case
4. Add analytics tracking
5. Implement user feedback collection

## Summary

You should now have a fully functional My Listings feature integrated into your project. Users can view all their listings, manage statuses, track transactions, and calculate profits - all from one centralized dashboard.

Key benefits:
- Single API call for profile data (optimized performance)
- Real-time search and filtering
- Comprehensive transaction tracking
- Automatic profit calculations
- Mobile-responsive design
- Role-based permissions


