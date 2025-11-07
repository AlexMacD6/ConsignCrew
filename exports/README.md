# Listings Exports

This directory contains exported listing data from the TreasureHub database.

## Export Files

- **JSON files**: Complete listing data with all relationships (user, photos, videos, inventory items)
- **CSV files**: Simplified tabular format for spreadsheet applications (Excel, Google Sheets, etc.)

## How to Export Data

### Using the Export Script

```bash
# Export as JSON (default)
node scripts/export-listings.js json

# Export as CSV
node scripts/export-listings.js csv
```

### Using Prisma Studio (GUI)

```bash
npx prisma studio
```

Then:
1. Navigate to http://localhost:5555
2. Click on the `Listing` table
3. Select rows to export
4. Use the export functionality

## File Naming Convention

Files are automatically named with timestamps:
```
listings-export-YYYY-MM-DDTHH-MM-SS.[json|csv]
```

## Data Included

### JSON Export
Complete listing data including:
- All listing fields (id, itemId, title, description, price, etc.)
- User information (id, name, email)
- Gallery photos (with URLs and metadata)
- Videos (with URLs and processing status)
- Inventory items (linked inventory data)
- All custom fields and metadata

### CSV Export
Simplified tabular data including:
- ID, Item ID, Title, Description
- Price, Sale Price, Status, Condition
- Brand, Model Number, Serial Number
- Location, Seller Name, Seller Email
- Department, Category
- Dimensions (Height, Width, Depth, Weight)
- Photo/Video counts
- View count
- Timestamps (Created At, Updated At)
- Availability dates

## Tips

1. **Large Datasets**: JSON files can be quite large. Use CSV for quick analysis.
2. **Data Analysis**: Import CSV files into Excel or Google Sheets for filtering and analysis.
3. **Backup**: These exports serve as data backups - keep them safe!
4. **Automation**: You can set up cron jobs to run exports automatically.

## Database Direct Access

For more complex queries, you can use Prisma directly:

```javascript
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function customQuery() {
  const listings = await prisma.listing.findMany({
    where: {
      status: 'active',
      price: { gte: 100 }
    },
    include: {
      user: true,
      galleryPhotos: true
    }
  });
  console.log(listings);
}
```

## Questions?

Refer to:
- `scripts/export-listings.js` - Export script source code
- `prisma/schema.prisma` - Database schema
- Prisma documentation: https://www.prisma.io/docs

