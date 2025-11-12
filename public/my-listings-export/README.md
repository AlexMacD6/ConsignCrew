# My Listings Export - Complete User Listing Management System

## Overview

This export contains all scripts and components needed to implement the **My Listings** tab functionality from TreasureHub's user profile page. This comprehensive listing management system allows users to view, edit, track, and manage all their listings from a centralized dashboard.

## What This Export Includes

### Core Features

1. **My Listings Tab** - Complete profile page integration with listing management
2. **Listing Statistics Dashboard** - Visual cards showing:
   - Total Listings count
   - Active Listings
   - Sold Listings
   - Processing Listings

3. **Search and Filter System**:
   - Real-time search by title, description, or item ID
   - Filter by status (All, Active, Sold, Processing)
   - Quick access to create new listings

4. **Listing Cards Display**:
   - Grid layout with responsive design
   - Hero photo or placeholder
   - Status badges (color-coded)
   - Price display with discount handling
   - View counts and save counts
   - Creation date

5. **Action Buttons** for each listing:
   - **View** - Navigate to listing detail page
   - **Edit** - Navigate to listing edit page
   - **Summary** - Open detailed listing summary modal
   - **Delete** - Remove listing (with confirmation)

6. **Listing Summary Modal** - Comprehensive tracking interface:
   - Basic listing information
   - Status management
   - Transaction details (price, payment method, tax)
   - Profit calculation (auto-calculated from inventory)
   - Date sold tracking
   - Comments/notes
   - Fulfillment method

### Technical Highlights

- **Optimized API Calls**: Single combined API endpoint reduces profile page load from 6+ requests to 1
- **Real-time Price Calculation**: Automatic discount schedule application
- **Inventory Integration**: Auto-calculates purchase price from linked inventory items
- **Profit Analysis**: Real-time profit calculations with margin percentages
- **Tax Handling**: Smart tax calculations for cash vs digital payments
- **Role-Based Permissions**: Integration with user permissions system
- **Responsive Design**: Mobile-friendly interface
- **State Management**: Efficient React state management with real-time updates

## Key Components

### 1. Profile Page (`app/profile/page.tsx`)
- Main page component with tabs (Overview, My Listings, Purchases, Settings)
- Integrated listing management dashboard
- Search and filter controls
- Statistics cards
- Listing grid with action buttons

### 2. Listing Summary Modal (`app/components/ListingSummaryModal.tsx`)
- Modal for detailed listing management
- Transaction tracking
- Profit calculation
- Tax management
- Status updates

### 3. API Routes
- `/api/profile/complete` - Combined endpoint for profile, listings, and purchases
- `/api/profile` - User profile operations
- `/api/listings` - Listing CRUD operations (GET, POST, DELETE, PATCH)
- `/api/listings/[id]/summary` - Listing summary updates

### 4. Utilities
- `price-calculator.ts` - Discount schedule and price calculation logic
- `useUserPermissions.ts` - Permission checking hook

## Database Schema Requirements

### Listing Model Fields Used

```typescript
{
  id: string;                    // UUID
  itemId: string;                // Unique 6-character ID
  userId: string;                // Foreign key to User
  title: string;
  description: string;
  price: number;                 // List price
  salePrice: number;             // Current sale price
  reservePrice: number;          // Minimum price
  status: enum;                  // ACTIVE, SOLD, PROCESSING, DRAFT
  photos: json;                  // { hero, back, proof, additional }
  views: number;                 // View count
  saves: number;                 // Save count
  createdAt: DateTime;
  updatedAt: DateTime;
  
  // Transaction Tracking
  transactionPrice: number;      // Final sale price
  paymentMethod: string;         // venmo, zelle, cash
  salesTax: number;              // Tax amount
  taxRate: number;               // Tax percentage
  soldAt: DateTime;              // Date sold
  comments: string;              // Transaction notes
  fulfillmentMethod: string;     // pickup, delivery
  purchasePrice: number;         // Cost basis from inventory
  
  // Discount Schedule
  discountSchedule: json;        // { type, dropIntervals, dropPercentages }
  
  // Relationships
  inventoryItems: InventoryItem[];  // For purchase price calculation
}
```

## Features in Detail

### Listing Statistics Dashboard

The dashboard displays four key metrics in color-coded cards:

- **Total Listings** (Blue) - All listings across all statuses
- **Active Listings** (Green) - Currently listed items
- **Sold Listings** (Yellow) - Successfully sold items
- **Processing Listings** (Gray) - Items in processing state

### Search and Filter

- **Search**: Real-time filtering by title, description, or item ID
- **Filter Dropdown**: Quick filter by status
- **Create Button**: Direct access to list new items (permission-based)

### Listing Cards

Each listing displays:
- Hero image or placeholder icon
- Status badge (colored by status)
- Title (truncated to 2 lines)
- Price with discount indicator (strikethrough for original price)
- Item ID badge
- Statistics (views, saves, creation date)
- Four action buttons

### Summary Modal Features

#### Basic Information Section
- Item title, listed price, views, creation date

#### Status Management
- Dropdown to change listing status
- Triggers appropriate workflows

#### Purchase Price Display
- Auto-calculated from linked inventory items
- Shows source inventory item description
- Read-only for data integrity

#### Transaction Details (When Status = Sold)
- **Transaction Price**: Final sale amount
- **Payment Method**: Venmo, Zelle, or Cash
- **Tax Rate**: Default 8.25% (customizable)
- **Sales Tax**: Auto-calculated based on payment method
  - Cash: Tax-inclusive (backs out tax from total)
  - Digital: Pre-tax (adds tax to total)
- **Date Sold**: Date picker
- **Fulfillment Method**: Pickup or Delivery
- **Comments**: Free-form notes

#### Profit Analysis
- **Net Profit**: Calculated as `(Transaction Price - Tax) - Purchase Price`
- **Profit Margin**: Percentage return on cost basis
- **Revenue Breakdown**: For cash payments, shows tax allocation

## Integration Requirements

### Required Dependencies

```json
{
  "dependencies": {
    "react": "^18.x",
    "next": "^14.x",
    "@prisma/client": "^5.x",
    "lucide-react": "^0.x",
    "react-phone-input-2": "^2.x"
  }
}
```

### Environment Variables

```env
DATABASE_URL="your-database-connection-string"
```

### Authentication Setup

This export assumes you have:
1. Better Auth (or similar) for session management
2. User authentication system
3. Organization/permission system

## Performance Optimization

### API Optimization
- **Before**: 6+ separate API calls on profile page load
- **After**: 1 combined API call via `/api/profile/complete`
- **Result**: Faster page loads, reduced server load

### Caching Strategy
- Permission caching (5-minute TTL)
- Client-side state management
- Optimistic UI updates

## Customization Guide

### Styling
The export uses Tailwind CSS classes. Key color scheme:
- Primary: `#D4AF3D` (gold)
- Hover: `#b8932f` (darker gold)
- Success: Green shades
- Error: Red shades
- Neutral: Gray scale

### Discount Schedules
Two built-in schedules in `price-calculator.ts`:
1. **Turbo-30**: 30-day aggressive schedule
2. **Classic-60**: 60-day moderate schedule

Add custom schedules in `DISCOUNT_SCHEDULES` object.

### Status Options
Current statuses: ACTIVE, SOLD, PROCESSING, DRAFT

Modify in:
- Database enum
- Profile page filter dropdown
- Summary modal status dropdown

## Testing Checklist

- [ ] User can view all their listings
- [ ] Statistics cards show correct counts
- [ ] Search filters listings in real-time
- [ ] Status filter works correctly
- [ ] View button navigates to listing detail
- [ ] Edit button navigates to listing edit form
- [ ] Summary button opens modal with correct data
- [ ] Delete button removes listing (with confirmation)
- [ ] Summary modal updates listing status
- [ ] Transaction details calculate correctly
- [ ] Profit analysis shows accurate numbers
- [ ] Tax calculations work for both payment methods
- [ ] Mobile responsive design works
- [ ] Empty state shows when no listings
- [ ] Permissions prevent unauthorized actions

## FAQ

### Q: Can users edit listings directly from the profile page?
A: No, the Edit button navigates to the full edit page. The profile page is for viewing and quick actions only.

### Q: How are discounts applied?
A: Discounts are automatically calculated based on the listing's discount schedule and creation date using `getDisplayPrice()` from `price-calculator.ts`.

### Q: Where does the purchase price come from?
A: Purchase price is automatically calculated from linked inventory items (cost per unit). If no inventory link exists, it shows as "Not available."

### Q: Can I customize the tax rate?
A: Yes, the tax rate field in the summary modal is editable. Default is 8.25% (Texas sales tax).

### Q: What's the difference between cash and digital payments?
A: 
- **Cash**: Transaction price includes tax (tax-inclusive)
- **Digital** (Venmo/Zelle): Transaction price excludes tax (buyer pays tax separately)

### Q: How do I add more listing statuses?
A: Update the database enum, then add options in both the filter dropdown and summary modal status dropdown.

## Support and Updates

This export is based on TreasureHub's production code as of November 2025. For updates or questions about implementation, refer to the original requirements document.

## File Structure

```
public/my-listings-export/
├── README.md (this file)
├── INTEGRATION_GUIDE.md
├── FILE_INVENTORY.md
├── EXPORT_SUMMARY.md
├── requirements/
│   └── user-profile-listing-management.txt
├── app/
│   ├── profile/
│   │   └── page.tsx
│   ├── components/
│   │   ├── ListingSummaryModal.tsx
│   │   └── ui/
│   │       └── button.tsx
│   ├── hooks/
│   │   └── useUserPermissions.ts
│   ├── lib/
│   │   └── price-calculator.ts
│   └── api/
│       ├── profile/
│       │   ├── route.ts
│       │   └── complete/
│       │       └── route.ts
│       └── listings/
│           ├── route.ts
│           └── [id]/
│               └── summary/
│                   └── route.ts
```

## License

This code is exported from TreasureHub for use in the Selling To Sold project.


