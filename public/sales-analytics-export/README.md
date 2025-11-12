# Sales Analytics Export - Comprehensive Business Intelligence Dashboard

## Overview

This export contains the complete **Sales Analytics** module from TreasureHub's Admin Dashboard. This is a comprehensive business intelligence system that provides deep insights into sales performance, revenue trends, profit analysis, and operational metrics.

## What This Export Includes

### Core Features

1. **Real-Time Analytics Dashboard** with 8+ key metrics
2. **Advanced Date Filtering** with 11 preset ranges + custom dates
3. **Interactive Charts** using Recharts library:
   - Monthly revenue trend (line chart)
   - Payment method distribution (pie chart)
   - Fulfillment method breakdown (bar chart)
4. **Top Performing Categories** ranked by revenue
5. **Complete Sales Transaction Table** with export to CSV
6. **Current Month Performance** highlighted summary
7. **Month-over-Month Growth** indicators

### Key Metrics Tracked

#### Summary Cards (4 Cards)
- **Total Revenue** - All-time or filtered revenue with MoM growth
- **Total Sales** - Count with average transaction value
- **Total Profit** - Calculated profit with margin percentage
- **Sales Tax Collected** - Tax collected for compliance

#### Detailed Analytics
- Monthly breakdown of revenue, sales count, profit, and tax
- Payment method distribution (Venmo, Zelle, Cash)
- Fulfillment method breakdown (Pickup, Delivery)
- Category performance with profitability
- Individual transaction details

### Date Filtering System

**11 Preset Ranges**:
- All Time (default)
- Today
- Yesterday
- This Week
- Last Week  
- This Month
- Last Month
- Last 3 Months
- Last 6 Months
- This Year
- Last Year
- Custom Range

**Custom Date Picker**:
- Start date selector
- End date selector
- Automatic preset switch when manually selecting dates
- Clear functionality to reset filters

## Technical Stack

### Frontend
- **React** with TypeScript
- **Next.js 14+** (App Router)
- **Recharts** - Chart library for data visualization
- **Lucide React** - Icon library
- **Tailwind CSS** - Styling

### Backend
- **Next.js API Routes**
- **Prisma ORM** - Database queries
- **Better Auth** - Authentication

## Key Components Breakdown

### 1. Sales Analytics Page (`app/admin/sales-analytics/page.tsx`)

**Purpose**: Main analytics dashboard page with all visualizations

**Key Features**:
- Date filter UI with presets and custom ranges
- Summary cards with key metrics
- Monthly revenue trend line chart
- Payment methods pie chart
- Fulfillment methods bar chart
- Top categories table
- All sales transactions table
- CSV export functionality
- Current month performance banner

**State Management**:
```typescript
- analytics: SalesAnalytics | null
- loading: boolean
- error: string
- startDate: string
- endDate: string
- datePreset: string
```

**Functions**:
- `fetchAnalytics()` - Fetches data from API
- `handlePresetChange()` - Calculates dates for presets
- `clearDateFilters()` - Resets to all-time view
- `exportToCSV()` - Downloads sales data as CSV
- `formatCurrency()` - Currency formatter
- `formatPercent()` - Percentage formatter
- `formatMonth()` - Month label formatter

### 2. Sales Analytics API (`app/api/admin/sales-analytics/route.ts`)

**Purpose**: Backend endpoint that calculates and returns analytics data

**Endpoint**: `GET /api/admin/sales-analytics`

**Query Parameters**:
- `startDate`: ISO date string (YYYY-MM-DD) - optional
- `endDate`: ISO date string (YYYY-MM-DD) - optional

**Returns**:
```typescript
{
  success: boolean;
  data: {
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
  };
}
```

**Key Logic**:
- Fetches all sold listings with transaction data
- Filters by date range if provided
- Aggregates revenue, tax, cost, profit
- Groups sales by month for time series
- Calculates payment/fulfillment distributions
- Ranks categories by revenue
- Calculates month-over-month growth

## Database Requirements

### Listing Model Fields Used

```prisma
model Listing {
  id                String   @id
  itemId            String   @unique
  title             String
  department        String?
  category          String?
  status            String
  
  // Transaction Fields (Required for Analytics)
  transactionPrice  Float?
  purchasePrice     Float?
  salesTax          Float?
  taxRate           Float?
  soldAt            DateTime?
  paymentMethod     String?
  fulfillmentMethod String?
  
  createdAt         DateTime @default(now())
}
```

**Critical Fields**:
- `status` must be "sold" for sales
- `soldAt` must not be null
- `transactionPrice` must not be null
- `purchasePrice` for profit calculations
- `salesTax` for tax reporting
- `paymentMethod` and `fulfillmentMethod` for distribution analysis

## Charts and Visualizations

### 1. Monthly Revenue Trend (Line Chart)

**Data**: Monthly aggregated revenue and profit
**X-Axis**: Month (formatted as "Jan 2025")
**Y-Axis**: Dollar amount (formatted as "$50k")
**Lines**: 
- Revenue (gold #D4AF3D)
- Profit (green #10B981)

### 2. Payment Methods (Pie Chart)

**Data**: Count of transactions by payment method
**Labels**: Method name with percentage
**Colors**: Brand color palette
**Legend**: Method breakdown with counts

### 3. Fulfillment Methods (Bar Chart)

**Data**: Count of orders by fulfillment method
**X-Axis**: Method name
**Y-Axis**: Count
**Bars**: Gold (#D4AF3D) with rounded tops

### 4. Top Categories Table

**Columns**:
- Rank (numbered 1-10)
- Category name
- Sales count
- Total revenue
- Total profit
- Average sale price

**Sorting**: By revenue (descending)
**Limit**: Top 10 categories

### 5. All Sales Table

**Columns**:
- Date sold
- Item title & ID
- Department & category
- Sale price
- Purchase cost
- Profit (color-coded: green/red)
- Sales tax
- Payment method (badge)
- Fulfillment method (badge)

**Sorting**: Most recent first
**Export**: CSV download button

## CSV Export Feature

**Export Function**: `exportToCSV()`

**File Name**: `sales-report-YYYY-MM-DD.csv`

**Columns Exported**:
1. Date
2. Item ID
3. Item Title
4. Department
5. Category
6. Sale Price
7. Purchase Cost
8. Profit
9. Sales Tax
10. Payment Method
11. Fulfillment Method

**Formatting**:
- Dates formatted as locale string
- Prices formatted to 2 decimals
- Titles escaped for CSV compatibility
- Automatic download in browser

## Color Scheme

**Brand Colors**:
- Primary: `#D4AF3D` (gold)
- Secondary: `#825E08` (dark gold)
- Accent: `#F4D03F` (light gold)

**Chart Colors**:
- Gold `#D4AF3D`
- Dark Gold `#825E08`
- Light Gold `#F4D03F`
- Indigo `#4F46E5`
- Green `#10B981`
- Amber `#F59E0B`
- Red `#EF4444`
- Purple `#8B5CF6`

**Semantic Colors**:
- Success: Green shades
- Error: Red shades
- Warning: Amber shades
- Info: Blue shades

## Date Handling

### Preset Calculations

**Today**: Start and end = today's date

**Yesterday**: Start and end = yesterday's date

**This Week**: Sunday to today

**Last Week**: Previous Sunday to Saturday

**This Month**: 1st of current month to today

**Last Month**: 1st to last day of previous month

**Last 3/6 Months**: 3 or 6 months ago to today

**This Year**: January 1st to today

**Last Year**: Jan 1 to Dec 31 of previous year

### Smart Date Boundaries

**Start Date**: Sets time to 00:00:00.000 (beginning of day)

**End Date**: Sets time to 23:59:59.999 (end of day)

**Benefit**: Ensures no sales are missed at day boundaries

## Performance Considerations

### Optimization Strategies

1. **Single Query**: All sold listings fetched in one query
2. **Client-Side Aggregation**: Reduces database load
3. **Indexed Fields**: Ensure `status` and `soldAt` are indexed
4. **Lazy Loading**: Charts render after data loads
5. **Responsive Charts**: Auto-resize with container

### Recommended Indexes

```sql
CREATE INDEX idx_listing_status ON Listing(status);
CREATE INDEX idx_listing_sold_at ON Listing(soldAt);
CREATE INDEX idx_listing_status_sold ON Listing(status, soldAt);
```

## Use Cases

### 1. Daily Sales Review
- Select "Today" preset
- Review revenue and sales count
- Check payment method mix
- Export CSV for accounting

### 2. Monthly Performance Report
- Select "This Month" preset
- Analyze month-over-month growth
- Review category performance
- Share with stakeholders

### 3. Quarterly Business Review
- Select "Last 3 Months" preset
- Analyze revenue trends
- Identify top categories
- Plan inventory based on data

### 4. Year-End Reporting
- Select "This Year" preset
- Calculate total revenue and profit
- Generate tax reports from sales tax data
- Export full transaction list

### 5. Custom Analysis
- Use custom date range
- Compare specific periods
- Analyze seasonal patterns
- Track promotional campaign results

## Customization Guide

### Change Brand Colors

Find and replace in `page.tsx`:
- `#D4AF3D` → Your primary color
- `#825E08` → Your secondary color
- `#F4D03F` → Your accent color

### Add More Presets

Add to `handlePresetChange()` switch statement:

```typescript
case "last30Days":
  const thirtyDaysAgo = new Date(today);
  thirtyDaysAgo.setDate(today.getDate() - 30);
  start = thirtyDaysAgo.toISOString().split("T")[0];
  end = today.toISOString().split("T")[0];
  break;
```

### Modify Chart Colors

Update `COLORS` array at top of file:

```typescript
const COLORS = [
  "#YourColor1",
  "#YourColor2",
  // ... more colors
];
```

### Add More Metrics

In API route, add calculations:

```typescript
const customMetric = soldListings.reduce((sum, listing) => {
  // Your calculation
  return sum;
}, 0);
```

Then return in response and display in UI.

### Change Date Format

Modify `formatMonth()` function:

```typescript
const formatMonth = (monthStr: string) => {
  // Your custom formatting
  return formattedString;
};
```

## Error Handling

### API Errors
- **401 Unauthorized**: User not authenticated
- **500 Server Error**: Database or calculation error

### UI Error States
- Loading spinner during data fetch
- Error message with retry button
- Empty state when no data available

### Data Validation
- Checks for null values in critical fields
- Handles missing payment/fulfillment methods
- Prevents division by zero in calculations

## Testing Checklist

- [ ] Date presets calculate correctly
- [ ] Custom date range filters properly
- [ ] Clear button resets to all-time
- [ ] Charts render without errors
- [ ] CSV export downloads correctly
- [ ] Mobile responsive layout works
- [ ] Loading states show appropriately
- [ ] Error handling works
- [ ] Empty states display correctly
- [ ] Month-over-month growth calculates accurately
- [ ] Profit calculations are correct
- [ ] Sales tax totals match individual entries

## FAQ

### Q: Why are some sales missing from the analytics?

**A**: The API only includes listings where:
- `status` = "sold"
- `soldAt` is not null
- `transactionPrice` is not null

Ensure these fields are set when marking items as sold.

### Q: How is profit calculated?

**A**: Profit = `transactionPrice` - `purchasePrice`

If `purchasePrice` is null, profit will be equal to revenue (no cost basis).

### Q: What's the difference between revenue and profit?

**A**: 
- **Revenue**: Total sales price (`transactionPrice`)
- **Profit**: Revenue minus cost (`transactionPrice - purchasePrice`)

### Q: How is month-over-month growth calculated?

**A**: `((Current Month Revenue - Previous Month Revenue) / Previous Month Revenue) * 100`

### Q: Can I export filtered data?

**A**: Yes! The CSV export button exports only the sales currently shown based on your date filters.

### Q: What if I don't have purchase prices?

**A**: The system will still show revenue and other metrics. Profit will show as equal to revenue where purchase price is missing.

### Q: How do I add more payment methods?

**A**: Just add them to listings - the system automatically aggregates all unique payment methods from the database.

### Q: Can I see individual transaction details?

**A**: Yes, scroll to the bottom "All Sales Transactions" table for complete details of every sale.

## Dependencies

### NPM Packages

```json
{
  "dependencies": {
    "react": "^18.x",
    "next": "^14.x",
    "@prisma/client": "^5.x",
    "recharts": "^2.x",
    "lucide-react": "^0.x",
    "better-auth": "^1.x"
  }
}
```

### External Files Required

- `@/lib/prisma` - Prisma client instance
- `@/lib/auth` - Better Auth instance
- Global CSS with Tailwind

## Security

- **Authentication Required**: All API calls check for valid session
- **Admin-Only Access**: Should be wrapped in admin permission check
- **No User Data Exposure**: Only shows business metrics
- **Date Filter Validation**: Prevents injection attacks

## Future Enhancement Ideas

- Add year-over-year comparison
- Add hourly/daily breakdown for recent sales
- Add customer segmentation analysis
- Add product-level profitability
- Add forecasting based on trends
- Add email report scheduling
- Add PDF export option
- Add sharing/collaboration features

## Support

This is a production-ready module from TreasureHub. All code has been tested in a live environment with real transaction data.

---

**Export Date**: November 11, 2025  
**For Project**: Selling To Sold  
**From Project**: TreasureHub


