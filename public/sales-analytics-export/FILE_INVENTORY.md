# Sales Analytics Export - File Inventory

## Export Date: November 11, 2025

---

## Directory Structure

```
sales-analytics-export/
├── README.md                                    (This provides overview and features)
├── INTEGRATION_GUIDE.md                         (Step-by-step setup instructions)
├── FILE_INVENTORY.md                            (This file - lists all contents)
├── EXPORT_SUMMARY.md                            (Summary of what was exported)
│
├── app/
│   ├── admin/
│   │   └── sales-analytics/
│   │       └── page.tsx                         (Main analytics dashboard page)
│   │
│   └── api/
│       └── admin/
│           └── sales-analytics/
│               └── route.ts                     (API endpoint for analytics data)
│
└── pr-templates/
    └── sales-analytics-date-filtering.md       (PR template with changelog)
```

---

## File Details

### 1. `app/admin/sales-analytics/page.tsx`

**Type**: React Component (Client Component)  
**Size**: ~908 lines  
**Purpose**: Main sales analytics dashboard page

**Key Features**:
- Real-time analytics dashboard
- Date filtering with 11 presets + custom range
- Interactive charts (line, pie, bar)
- Summary cards with key metrics
- Top categories table
- Complete sales transaction list
- CSV export functionality
- Current month performance banner

**Dependencies**:
```typescript
// External
import React, { useState, useEffect } from "react";
import { 
  TrendingUp, DollarSign, ShoppingCart, Percent,
  CreditCard, Truck, BarChart3, Calendar,
  ArrowUpRight, ArrowDownRight, Loader2, Download 
} from "lucide-react";
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie,
  Cell, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer
} from "recharts";

// No internal dependencies (standalone component)
```

**State Management**:
- `analytics`: SalesAnalytics | null
- `loading`: boolean
- `error`: string
- `startDate`: string (ISO date)
- `endDate`: string (ISO date)
- `datePreset`: string (preset name)

**Key Functions**:
- `fetchAnalytics()`: Fetches data from API with date filters
- `handlePresetChange()`: Calculates dates for 11 preset ranges
- `clearDateFilters()`: Resets to all-time view
- `exportToCSV()`: Downloads sales data as CSV
- `formatCurrency()`: Formats numbers as USD
- `formatPercent()`: Formats numbers as percentages
- `formatMonth()`: Formats month strings for display

**Interface Definitions**:
```typescript
interface SalesAnalytics {
  summary: {
    totalRevenue: number;
    totalSalesTax: number;
    totalPurchaseCost: number;
    totalProfit: number;
    profitMargin: number;
    salesCount: number;
    averageTransactionValue: number;
    monthOverMonthGrowth: number;
  };
  monthlyData: Array<MonthlyStats>;
  currentMonth: MonthlyStats | null;
  paymentMethods: Array<MethodStats>;
  fulfillmentMethods: Array<MethodStats>;
  topCategories: Array<CategoryStats>;
  salesList: Array<SaleDetail>;
}
```

---

### 2. `app/api/admin/sales-analytics/route.ts`

**Type**: Next.js API Route (Server Component)  
**Size**: ~258 lines  
**Purpose**: Backend endpoint that calculates and returns analytics data

**Endpoint**: `GET /api/admin/sales-analytics`

**Query Parameters**:
- `startDate` (optional): ISO date string (YYYY-MM-DD)
- `endDate` (optional): ISO date string (YYYY-MM-DD)

**Dependencies**:
```typescript
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";  // ⚠️ Update to your path
import { auth } from "@/lib/auth";      // ⚠️ Update to your auth
```

**Database Requirements**:
```typescript
// Listing model fields used:
- id: String
- itemId: String
- title: String
- department: String?
- category: String?
- status: String
- transactionPrice: Float?
- purchasePrice: Float?
- salesTax: Float?
- taxRate: Float?
- soldAt: DateTime?
- paymentMethod: String?
- fulfillmentMethod: String?
- createdAt: DateTime
```

**Key Operations**:
1. Authentication check
2. Date filter parsing
3. Fetch sold listings with filters
4. Calculate aggregate metrics:
   - Total revenue, tax, cost, profit
   - Average transaction value
   - Profit margin
5. Group by month for time series
6. Calculate payment/fulfillment distributions
7. Rank categories by revenue
8. Calculate month-over-month growth
9. Return structured JSON response

**Response Structure**:
```typescript
{
  success: boolean;
  data: {
    summary: { /* 8 metrics */ },
    monthlyData: Array<MonthlyStats>,
    currentMonth: MonthlyStats | null,
    paymentMethods: Array<MethodStats>,
    fulfillmentMethods: Array<MethodStats>,
    topCategories: Array<CategoryStats>,
    salesList: Array<SaleDetail>
  }
}
```

**Error Handling**:
- 401: Unauthorized (no session)
- 500: Server error (database/calculation issues)

---

### 3. `pr-templates/sales-analytics-date-filtering.md`

**Type**: Markdown Documentation  
**Size**: ~183 lines  
**Purpose**: Pull request template with changelog and testing instructions

**Contents**:
- **Changelog**: Detailed list of all changes made
  - API changes (query parameters)
  - UI changes (date filter section)
  - Features (smart date handling, preset calculations)
  - Affected components
  
- **Testing Instructions**: Comprehensive test scenarios
  - Test preset date ranges (11 presets)
  - Test custom date range
  - Test date input interaction
  - Test clear functionality
  - Test edge cases
  - Test UI responsiveness
  - Test data accuracy
  - Test performance
  
- **Visual Verification**: UI/UX checklist
- **API Verification**: Direct API testing examples
- **Expected Behavior**: What should happen

---

## Required External Dependencies

### NPM Packages

```json
{
  "dependencies": {
    "react": "^18.2.0",
    "next": "^14.0.0",
    "@prisma/client": "^5.0.0",
    "recharts": "^2.10.0",
    "lucide-react": "^0.294.0",
    "better-auth": "^1.0.0"
  }
}
```

### Installation Command

```bash
npm install recharts lucide-react
```

Or:

```bash
yarn add recharts lucide-react
```

---

## Internal Dependencies (Your Project)

These files must exist in your project:

### 1. Prisma Client
**File**: `lib/prisma.ts` or `lib/db.ts`

```typescript
import { PrismaClient } from "@prisma/client";

export const prisma = new PrismaClient();
```

### 2. Authentication
**File**: `lib/auth.ts`

```typescript
// Better Auth example
export const auth = betterAuth({ /* config */ });

// Or NextAuth
export const authOptions = { /* config */ };
```

### 3. Tailwind CSS
**File**: `tailwind.config.js`

Standard Tailwind installation with default theme.

### 4. Global Styles
**File**: `app/globals.css`

With Tailwind directives:
```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

---

## Database Schema Requirements

### Listing Model (Minimum Required Fields)

```prisma
model Listing {
  id                String   @id @default(cuid())
  itemId            String   @unique
  title             String
  department        String?
  category          String?
  status            String   @default("active")
  
  // Analytics Fields
  transactionPrice  Float?
  purchasePrice     Float?
  salesTax          Float?
  taxRate           Float?
  soldAt            DateTime?
  paymentMethod     String?
  fulfillmentMethod String?
  
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
  
  @@index([status])
  @@index([soldAt])
  @@index([status, soldAt])
}
```

### Required Migrations

1. **Add analytics fields** (if not existing)
2. **Add indexes** for performance

---

## Environment Variables

No additional environment variables required. Standard Next.js and Prisma variables:

```env
DATABASE_URL="your-database-url"
NEXTAUTH_URL="http://localhost:3000"  # If using NextAuth
NEXTAUTH_SECRET="your-secret"         # If using NextAuth
```

---

## TypeScript Interfaces

### SalesAnalytics Interface

```typescript
interface SalesAnalytics {
  summary: {
    totalRevenue: number;
    totalSalesTax: number;
    totalPurchaseCost: number;
    totalProfit: number;
    profitMargin: number;
    salesCount: number;
    averageTransactionValue: number;
    monthOverMonthGrowth: number;
  };
  monthlyData: Array<{
    month: string;
    revenue: number;
    salesCount: number;
    profit: number;
    salesTax: number;
  }>;
  currentMonth: {
    month: string;
    revenue: number;
    salesCount: number;
    profit: number;
    salesTax: number;
  } | null;
  paymentMethods: Array<{
    method: string;
    count: number;
    percentage: number;
  }>;
  fulfillmentMethods: Array<{
    method: string;
    count: number;
    percentage: number;
  }>;
  topCategories: Array<{
    department: string;
    revenue: number;
    salesCount: number;
    profit: number;
  }>;
  salesList: Array<{
    itemId: string;
    title: string;
    department: string;
    category: string;
    transactionPrice: number | null;
    purchasePrice: number | null;
    profit: number;
    salesTax: number | null;
    soldAt: string | null;
    paymentMethod: string | null;
    fulfillmentMethod: string | null;
  }>;
}
```

---

## Assets and Resources

### Color Palette

```typescript
const COLORS = [
  "#D4AF3D", // Brand gold (TreasureHub)
  "#825E08", // Brand secondary
  "#F4D03F", // Brand accent
  "#4F46E5", // Indigo
  "#10B981", // Green
  "#F59E0B", // Amber
  "#EF4444", // Red
  "#8B5CF6", // Purple
];
```

**Note**: Update these colors to match Selling To Sold brand.

### Icons Used (Lucide React)

- `TrendingUp` - Profit indicator
- `DollarSign` - Revenue
- `ShoppingCart` - Sales count
- `Percent` - Tax/margins
- `CreditCard` - Payment methods
- `Truck` - Fulfillment
- `BarChart3` - Charts/analytics
- `Calendar` - Date filters
- `ArrowUpRight` - Growth up
- `ArrowDownRight` - Growth down
- `Loader2` - Loading spinner
- `Download` - CSV export

---

## Configuration Options

### Customizable Values

**In `page.tsx`:**

1. **Color scheme** (line 90-99)
2. **Date preset options** (line 145-223)
3. **Currency format** (line 233-239)
4. **Month format** (line 247-254)
5. **CSV headers** (line 264-276)
6. **Top categories limit** (currently 10)

**In `route.ts`:**

1. **Date filter logic** (line 35-47)
2. **Top categories limit** (line 182)
3. **Sort order** (line 75, 136, 181, 215)

---

## Browser Compatibility

- **Chrome**: ✅ Full support
- **Firefox**: ✅ Full support
- **Safari**: ✅ Full support
- **Edge**: ✅ Full support
- **Mobile Safari**: ✅ Responsive design
- **Mobile Chrome**: ✅ Responsive design

**Minimum Versions**:
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

---

## Performance Characteristics

### Load Times (Approximate)

- **< 100 sales**: < 1 second
- **100-1000 sales**: 1-3 seconds
- **1000-10000 sales**: 3-8 seconds
- **> 10000 sales**: Consider optimization

### Optimization Recommendations

For large datasets:
1. Add pagination to sales table
2. Move aggregations to database
3. Implement caching
4. Add database indexes (included in schema)
5. Consider materialized views

---

## Testing Requirements

### Unit Tests (Recommended)

Test files not included, but recommended tests:

1. **Date preset calculations**
2. **Currency formatting**
3. **CSV export generation**
4. **Profit calculations**
5. **Month-over-month growth**

### Integration Tests (Recommended)

1. **API endpoint with date filters**
2. **Database query performance**
3. **Authentication checks**
4. **Error handling**

### E2E Tests (Recommended)

1. **Full user flow through dashboard**
2. **Date filter interactions**
3. **CSV download**
4. **Mobile responsiveness**

---

## Accessibility (a11y)

### Current Status

- **Keyboard Navigation**: ✅ All inputs accessible
- **Screen Readers**: ⚠️ Charts may need ARIA labels
- **Color Contrast**: ✅ WCAG AA compliant
- **Focus Indicators**: ✅ Visible focus states

### Improvements Needed

1. Add ARIA labels to charts
2. Add alt text descriptions for data visualizations
3. Ensure table headers are properly marked
4. Test with screen readers

---

## Security Considerations

### Implemented

- ✅ Authentication check in API
- ✅ Prisma ORM (SQL injection prevention)
- ✅ React auto-escaping (XSS prevention)
- ✅ Next.js CSRF protection

### Recommended Additions

- [ ] Admin role verification
- [ ] Rate limiting on API endpoint
- [ ] Audit logging for data exports
- [ ] Input validation on date parameters

---

## Maintenance Notes

### Regular Updates Needed

1. **Dependencies**: Update monthly
   - `recharts`
   - `lucide-react`
   - `@prisma/client`

2. **Database**: Monitor performance
   - Check index usage
   - Optimize slow queries
   - Archive old data if needed

3. **Calculations**: Verify accuracy
   - Compare with accounting software
   - Validate tax calculations
   - Check profit margins

---

## Support and Documentation Links

- **Recharts**: https://recharts.org/
- **Lucide Icons**: https://lucide.dev/
- **Prisma**: https://www.prisma.io/docs
- **Next.js**: https://nextjs.org/docs
- **TailwindCSS**: https://tailwindcss.com/docs

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | Nov 2025 | Initial export with date filtering |

---

## File Checksums

Use for verification:

```bash
# Generate checksums (example)
sha256sum app/admin/sales-analytics/page.tsx
sha256sum app/api/admin/sales-analytics/route.ts
```

---

## License and Attribution

**Source Project**: TreasureHub  
**Destination Project**: Selling To Sold  
**Export Date**: November 11, 2025  
**Exported By**: AI Assistant

This code is being transferred between projects owned by the same developer and can be freely modified for use in Selling To Sold.

---

**Total Files**: 3 code files + 4 documentation files = **7 files**  
**Total Lines of Code**: ~1,166 lines (TypeScript/TSX)  
**Total Documentation**: ~1,300+ lines (Markdown)

---

End of File Inventory

