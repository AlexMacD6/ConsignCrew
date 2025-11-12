# Sales Analytics Integration Guide

## Step-by-Step Setup for Selling To Sold

This guide will walk you through integrating the Sales Analytics module into your Selling To Sold project.

---

## Prerequisites

Before starting, ensure you have:

- [ ] Next.js 14+ with App Router
- [ ] Prisma ORM configured
- [ ] Better Auth (or similar authentication)
- [ ] Recharts library installed
- [ ] Lucide React icons installed
- [ ] Tailwind CSS configured
- [ ] Admin authentication/authorization system

---

## Step 1: Install Required Dependencies

```bash
npm install recharts lucide-react
```

**Or with yarn:**

```bash
yarn add recharts lucide-react
```

**Verify versions:**
```json
{
  "recharts": "^2.10.0",
  "lucide-react": "^0.294.0"
}
```

---

## Step 2: Update Database Schema

### Add Required Fields to Listing Model

Your Listing/Item model needs these fields for analytics to work:

```prisma
model Listing {
  id                String   @id @default(cuid())
  itemId            String   @unique
  title             String
  department        String?
  category          String?
  status            String   @default("active")
  
  // Required for Analytics
  transactionPrice  Float?
  purchasePrice     Float?
  salesTax          Float?
  taxRate           Float?
  soldAt            DateTime?
  paymentMethod     String?
  fulfillmentMethod String?
  
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
  
  // ... other fields
}
```

### Run Migration

```bash
npx prisma migrate dev --name add_sales_analytics_fields
```

### Create Indexes for Performance

```bash
npx prisma migrate dev --name add_analytics_indexes
```

Add to your schema:

```prisma
model Listing {
  // ... fields above
  
  @@index([status])
  @@index([soldAt])
  @@index([status, soldAt])
}
```

---

## Step 3: Copy Files to Your Project

### Directory Structure

```
your-project/
├── app/
│   ├── admin/
│   │   └── sales-analytics/
│   │       └── page.tsx              <- Copy this
│   └── api/
│       └── admin/
│           └── sales-analytics/
│               └── route.ts          <- Copy this
```

### Copy Commands

**On Windows (PowerShell):**

```powershell
# Copy the page
Copy-Item "public\sales-analytics-export\app\admin\sales-analytics\page.tsx" `
  -Destination "app\admin\sales-analytics\page.tsx"

# Copy the API route
Copy-Item "public\sales-analytics-export\app\api\admin\sales-analytics\route.ts" `
  -Destination "app\api\admin\sales-analytics\route.ts"
```

**On Mac/Linux:**

```bash
# Copy the page
cp public/sales-analytics-export/app/admin/sales-analytics/page.tsx \
  app/admin/sales-analytics/page.tsx

# Copy the API route
cp public/sales-analytics-export/app/api/admin/sales-analytics/route.ts \
  app/api/admin/sales-analytics/route.ts
```

---

## Step 4: Update Import Paths

### In `app/admin/sales-analytics/page.tsx`

No import changes needed - all imports are from standard libraries.

### In `app/api/admin/sales-analytics/route.ts`

Update these imports to match your project structure:

```typescript
// Change from:
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

// To match your project (example):
import { prisma } from "@/lib/db";  // or wherever your Prisma client is
import { auth } from "@/lib/auth";  // or your auth solution
```

---

## Step 5: Verify Prisma Client

Make sure your Prisma client is exported correctly:

**File: `lib/prisma.ts` (or `lib/db.ts`)**

```typescript
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
```

---

## Step 6: Update Authentication

### Option A: Using Better Auth (Same as TreasureHub)

No changes needed if you're using Better Auth the same way.

### Option B: Using NextAuth

Replace in `route.ts`:

```typescript
// Change from:
const session = await auth.api.getSession({ headers: request.headers });
if (!session?.user?.id) {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

// To:
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const session = await getServerSession(authOptions);
if (!session?.user) {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}
```

### Option C: Using Custom Auth

Replace with your auth check:

```typescript
// Your custom auth check
const user = await getCurrentUser(request);
if (!user || !user.isAdmin) {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}
```

---

## Step 7: Add Admin Permission Check (Recommended)

Wrap the page with admin-only access:

**Create: `app/admin/layout.tsx`** (if you don't have one)

```typescript
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth.api.getSession({ headers: headers() });
  
  // Check if user is admin
  if (!session?.user || !session.user.isAdmin) {
    redirect("/");
  }

  return <>{children}</>;
}
```

---

## Step 8: Add Navigation Link

Add a link to the analytics page in your admin navigation:

**Example: `app/admin/page.tsx` or admin sidebar**

```typescript
<Link
  href="/admin/sales-analytics"
  className="flex items-center gap-2 p-4 rounded-lg hover:bg-gray-100"
>
  <BarChart3 className="h-5 w-5" />
  <span>Sales Analytics</span>
</Link>
```

---

## Step 9: Test the Integration

### 1. Create Test Data

First, ensure you have some sold listings in your database:

```typescript
// Example: Mark an item as sold
await prisma.listing.update({
  where: { itemId: "TEST-001" },
  data: {
    status: "sold",
    transactionPrice: 150.00,
    purchasePrice: 100.00,
    salesTax: 12.00,
    taxRate: 0.08,
    soldAt: new Date(),
    paymentMethod: "Venmo",
    fulfillmentMethod: "Pickup",
  },
});
```

### 2. Access the Analytics Page

Navigate to: `http://localhost:3000/admin/sales-analytics`

### 3. Verify Data Loads

- [ ] Summary cards show correct numbers
- [ ] Monthly chart displays
- [ ] Payment methods pie chart shows
- [ ] Fulfillment methods bar chart shows
- [ ] Top categories table has data
- [ ] Sales transactions table displays

### 4. Test Date Filters

- [ ] Select "This Month" - data updates
- [ ] Select "Last Month" - data changes
- [ ] Custom date range works
- [ ] Clear button resets to all-time

### 5. Test CSV Export

- [ ] Click "Export to CSV" button
- [ ] CSV file downloads
- [ ] Open CSV and verify data

---

## Step 10: Customize for Your Brand

### Update Colors

Find and replace in `page.tsx`:

```typescript
// TreasureHub gold
const COLORS = [
  "#D4AF3D",  // <- Change to your primary color
  "#825E08",  // <- Change to your secondary color
  "#F4D03F",  // <- Change to your accent color
  // ... more colors
];
```

Search and replace throughout file:
- `#D4AF3D` → Your primary color
- `#825E08` → Your secondary color

### Update Branding Text

Change the header:

```typescript
<h1 className="text-4xl font-bold text-gray-900 mb-2">
  Sales Analytics  // <- Change to your preferred title
</h1>
<p className="text-gray-600">
  Comprehensive overview of your sales performance  // <- Change subtitle
</p>
```

---

## Step 11: Add to Admin Dashboard

If you have an admin dashboard overview page, add a card:

```typescript
{
  title: "Sales Analytics",
  description: "Track sales performance, revenue trends, and business metrics",
  icon: BarChart3,
  href: "/admin/sales-analytics",
  color: "bg-green-500",
  stats: "View Reports",
}
```

---

## Common Issues and Solutions

### Issue: "prisma is not defined"

**Solution**: Check your Prisma import path in `route.ts`

```typescript
import { prisma } from "@/lib/prisma"; // Update to match your project
```

### Issue: "auth is not defined"

**Solution**: Update authentication import and usage to match your auth system.

### Issue: Charts not rendering

**Solution**: Ensure Recharts is installed and ResponsiveContainer has proper dimensions:

```bash
npm install recharts
```

### Issue: No data showing

**Solution**: Check that you have listings with:
- `status: "sold"`
- `soldAt` not null
- `transactionPrice` not null

### Issue: Date filters not working

**Solution**: Verify your database has `soldAt` dates in the correct format (DateTime/Timestamp).

### Issue: CSV export not downloading

**Solution**: Check browser console for errors. Ensure CSV export function has proper permissions.

---

## Performance Optimization

### For Large Datasets (1000+ sales)

#### 1. Add Pagination to Sales Table

```typescript
const [page, setPage] = useState(1);
const itemsPerPage = 50;
const paginatedSales = salesList.slice(
  (page - 1) * itemsPerPage,
  page * itemsPerPage
);
```

#### 2. Move Aggregation to Database

Instead of client-side calculations, create database views or use Prisma aggregations:

```typescript
const totalRevenue = await prisma.listing.aggregate({
  where: { status: "sold" },
  _sum: { transactionPrice: true },
});
```

#### 3. Cache Results

Add caching for frequently accessed data:

```typescript
import { unstable_cache } from "next/cache";

const getCachedAnalytics = unstable_cache(
  async () => {
    // Your analytics logic
  },
  ["sales-analytics"],
  { revalidate: 3600 } // 1 hour
);
```

---

## Extending the Analytics

### Add New Metrics

**Example: Average Days to Sell**

1. Add to interface:

```typescript
interface SalesAnalytics {
  summary: {
    // ... existing fields
    averageDaysToSell: number;
  };
}
```

2. Calculate in API:

```typescript
const averageDaysToSell = soldListings.reduce((sum, listing) => {
  const days = Math.floor(
    (new Date(listing.soldAt).getTime() - new Date(listing.createdAt).getTime()) 
    / (1000 * 60 * 60 * 24)
  );
  return sum + days;
}, 0) / soldListings.length;
```

3. Display in UI:

```typescript
<div className="bg-white rounded-lg shadow p-6">
  <h3 className="text-gray-500 text-sm font-medium mb-1">
    Avg Days to Sell
  </h3>
  <p className="text-2xl font-bold text-gray-900">
    {summary.averageDaysToSell.toFixed(1)} days
  </p>
</div>
```

### Add New Charts

**Example: Sales by Day of Week**

1. Calculate data:

```typescript
const dayOfWeekStats: Record<string, number> = {};
soldListings.forEach((listing) => {
  const day = new Date(listing.soldAt).toLocaleDateString('en-US', { weekday: 'long' });
  dayOfWeekStats[day] = (dayOfWeekStats[day] || 0) + 1;
});
```

2. Add chart:

```typescript
<ResponsiveContainer width="100%" height={300}>
  <BarChart data={Object.entries(dayOfWeekStats).map(([day, count]) => ({ day, count }))}>
    <CartesianGrid strokeDasharray="3 3" />
    <XAxis dataKey="day" />
    <YAxis />
    <Tooltip />
    <Bar dataKey="count" fill="#D4AF3D" />
  </BarChart>
</ResponsiveContainer>
```

---

## Security Checklist

- [ ] Authentication check in API route
- [ ] Admin-only access on page
- [ ] SQL injection prevented (using Prisma)
- [ ] XSS prevented (React auto-escaping)
- [ ] CSRF protection (Next.js built-in)
- [ ] Rate limiting considered (if needed)
- [ ] Sensitive data not exposed to frontend

---

## Maintenance

### Regular Tasks

1. **Monitor Performance**: Check query times as data grows
2. **Review Indexes**: Ensure database indexes are effective
3. **Update Dependencies**: Keep Recharts and other libs current
4. **Backup Data**: Regular database backups
5. **Test Calculations**: Verify metrics match accounting records

### Quarterly Review

- Compare analytics totals to accounting software
- Verify tax calculations are accurate
- Update color scheme if brand changes
- Review and optimize slow queries
- Test with different date ranges

---

## Support Resources

### Recharts Documentation
https://recharts.org/en-US/

### Prisma Documentation
https://www.prisma.io/docs

### Next.js App Router
https://nextjs.org/docs/app

### Lucide Icons
https://lucide.dev/

---

## Complete Checklist

Before going live, verify:

- [ ] All dependencies installed
- [ ] Database schema updated with migrations
- [ ] Files copied to correct locations
- [ ] Import paths updated
- [ ] Authentication working
- [ ] Admin permissions enforced
- [ ] Test data created
- [ ] Page loads without errors
- [ ] All charts render correctly
- [ ] Date filters work
- [ ] CSV export downloads
- [ ] Mobile responsive
- [ ] Colors match brand
- [ ] Navigation link added
- [ ] Performance acceptable

---

**Integration Complete! 🎉**

Your Sales Analytics module is now ready to provide valuable insights into your Selling To Sold business performance.

---

**Last Updated**: November 11, 2025  
**Compatibility**: Next.js 14+, React 18+, Prisma 5+
