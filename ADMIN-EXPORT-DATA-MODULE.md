# Admin Data Export Module

## Overview

The Admin Data Export module provides administrators with a flexible tool to export any database table to CSV format directly from the Admin Dashboard. This feature is useful for:

- **Data Analysis**: Export data for analysis in Excel, Google Sheets, or other tools
- **Backups**: Create quick backups of specific tables
- **Migration**: Export data for migration to other systems
- **Reporting**: Generate reports from any table
- **Auditing**: Export audit logs and historical data

## Features

✅ **Dynamic Table Selection**: Choose from 25+ database tables via dropdown  
✅ **One-Click Export**: Export entire tables with a single click  
✅ **CSV Format**: Industry-standard format compatible with all spreadsheet applications  
✅ **Automatic Filename**: Files are timestamped for easy organization  
✅ **Real-time Statistics**: See row counts and export status  
✅ **Admin-Only Access**: Secured with role-based authentication  
✅ **Audit Logging**: All exports are logged with user information  

## How to Use

### 1. Access the Module

From the Admin Dashboard:
1. Navigate to the Admin Dashboard (`/admin`)
2. Click on the **"Export Data"** card (cyan/blue color with Database icon)
3. You'll be taken to `/admin/export-data`

### 2. Select a Table

From the dropdown menu, select the table you want to export:

**Available Tables:**
- Users
- Listings
- Orders
- Cart Items
- Photo Gallery
- Videos
- Organizations
- Teams & Members
- Inventory Items
- Questions
- Promo Codes
- Mobile Items & Metadata
- Price History
- Sessions & Accounts
- And more...

### 3. Export

1. Click the **"Export to CSV"** button
2. The file will automatically download to your browser's download folder
3. Success message will show the number of rows exported

### 4. File Details

**Filename Format:**
```
[table-name]-export-YYYY-MM-DDTHH-MM-SS.csv
```

**Example:**
```
listing-export-2025-11-05T20-56-36.csv
```

## Technical Details

### API Endpoints

#### GET `/api/admin/export-table`
Returns list of available tables for export.

**Response:**
```json
{
  "tables": [
    { "key": "user", "name": "Users" },
    { "key": "listing", "name": "Listings" },
    ...
  ]
}
```

#### POST `/api/admin/export-table`
Exports the specified table to CSV format.

**Request:**
```json
{
  "table": "listing"
}
```

**Response:**
- Content-Type: `text/csv`
- Content-Disposition: `attachment; filename="..."`
- X-Row-Count: Number of rows exported
- Body: CSV data

### Security

- **Authentication Required**: Must be logged in
- **Admin Role Required**: User role must be `ADMIN`
- **Audit Logging**: All exports are logged with:
  - User ID and name
  - Table exported
  - Timestamp
  - Row count

### Data Handling

**CSV Conversion:**
- All table fields are included as columns
- Complex data types (JSON, arrays) are stringified
- Null/undefined values are converted to empty strings
- Quotes are properly escaped for CSV compliance
- Commas and newlines in data are handled correctly

## Example Use Cases

### 1. Export All Listings for Analysis
```
Select: Listings
Export: 189 rows
Use Case: Analyze pricing trends, popular categories, or inventory levels
```

### 2. Export Users for Email Campaign
```
Select: Users
Export: All user records
Use Case: Create targeted email campaigns or customer analysis
```

### 3. Export Orders for Accounting
```
Select: Orders
Export: All completed orders
Use Case: Import into accounting software or create financial reports
```

### 4. Export Inventory for Stock Check
```
Select: Inventory Items
Export: Current inventory
Use Case: Physical inventory reconciliation or stock audits
```

### 5. Backup Critical Data
```
Select: Any table
Export: Complete table backup
Use Case: Regular backups before major changes or migrations
```

## File Structure

```
app/
├── api/admin/export-table/
│   └── route.ts              # API endpoint for exports
├── (dashboard)/admin/export-data/
│   └── page.tsx              # UI page for export module
└── admin/
    └── page.tsx              # Admin dashboard (updated with Export Data card)
```

## Troubleshooting

### Issue: "Failed to fetch tables"
**Solution**: Check that you're logged in as an admin user

### Issue: "No data found in this table"
**Solution**: The table is empty - this is expected for some tables

### Issue: Export button disabled
**Solution**: Make sure you've selected a table from the dropdown

### Issue: Download doesn't start
**Solution**: Check browser pop-up blocker settings

## Future Enhancements

Potential future improvements:
- [ ] Filter/query builder for selective exports
- [ ] Schedule automatic exports
- [ ] Export with relationships included
- [ ] Multiple table export at once
- [ ] JSON export format option
- [ ] Compression for large exports
- [ ] Email export results
- [ ] Export history/logs viewer

## Testing Checklist

✅ Authentication check (non-admin users blocked)  
✅ Table list loads correctly  
✅ All 25+ tables are selectable  
✅ CSV download triggers on export  
✅ Filenames are properly formatted with timestamps  
✅ Empty tables handle gracefully  
✅ Large tables export successfully  
✅ CSV format is valid and opens in Excel/Sheets  
✅ Special characters in data are escaped properly  
✅ Audit logging captures export events  

## Support

For issues or questions:
1. Check the browser console for error messages
2. Verify admin role permissions
3. Review server logs for backend errors
4. Contact system administrator if issues persist

---

**Created**: November 5, 2025  
**Version**: 1.0  
**Module Location**: `/admin/export-data`  
**Admin Access**: Required

