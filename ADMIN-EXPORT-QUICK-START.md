# Quick Start Guide: Export Data Module

## 🚀 3-Step Export Process

### Step 1: Navigate to Export Data
```
Admin Dashboard → Click "Export Data" card (cyan/blue with Database icon)
```

### Step 2: Select Table
```
Use dropdown menu → Choose from 25+ tables
Examples:
  - "Listings" for all listing data
  - "Users" for user information
  - "Orders" for order history
  - "Photo Gallery" for media files
  - etc.
```

### Step 3: Export
```
Click "Export to CSV" button → File downloads automatically
```

---

## 📸 UI Preview (Text Description)

```
┌─────────────────────────────────────────────────────────────┐
│  🗄️  Export Data                                             │
│  Export any database table to CSV format for analysis,      │
│  backup, or migration purposes.                             │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Select Table                                                │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ -- Choose a table to export --                     ▼  │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │         📥  Export to CSV                               │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│  ✅ Successfully exported 189 rows from Listings            │
│                                                              │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  Last Export                                                 │
├─────────────────────────────────────────────────────────────┤
│  Table             Rows Exported        Timestamp           │
│  Listings          189                  11/5/2025, 2:56 PM  │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  ℹ️  Export Information                                      │
│  • CSV files can be opened in Excel, Google Sheets, etc.   │
│  • Large tables may take a few moments to export           │
│  • All exports are logged for security purposes            │
│  • Files are automatically named with timestamps           │
│  • Complex data types are converted to strings             │
└─────────────────────────────────────────────────────────────┘

                    25 tables available for export
```

---

## 📋 Available Tables

### User & Authentication
- ✅ Users
- ✅ Sessions  
- ✅ Accounts
- ✅ Verification Tokens
- ✅ Verifications

### Listings & Products
- ✅ Listings
- ✅ Photo Gallery
- ✅ Videos
- ✅ Price History
- ✅ Listing History

### Orders & Commerce
- ✅ Orders
- ✅ Carts
- ✅ Cart Items
- ✅ Promo Codes

### Organizations
- ✅ Organizations
- ✅ Organization Members
- ✅ Invitations
- ✅ Teams
- ✅ Team Members

### Inventory
- ✅ Inventory Lists
- ✅ Inventory Items

### User Interactions
- ✅ Questions
- ✅ Saved Listings
- ✅ Hidden Listings

### Mobile App
- ✅ Mobile Items
- ✅ Mobile Item Metadata

---

## 🎯 Common Exports

### Export All Listings
**Use Case**: Analyze inventory, pricing, or sales data  
**Table**: Listings  
**Expected Rows**: ~200+ (depends on your data)  
**File Size**: ~500KB - 1MB

### Export All Users
**Use Case**: Email campaigns, user analysis  
**Table**: Users  
**Expected Rows**: Based on registration count  
**File Size**: ~50KB - 200KB

### Export Orders
**Use Case**: Accounting, revenue analysis  
**Table**: Orders  
**Expected Rows**: Based on sales volume  
**File Size**: Varies

### Export Inventory
**Use Case**: Stock checks, physical inventory  
**Table**: Inventory Items  
**Expected Rows**: Based on inventory size  
**File Size**: Varies

---

## ⚡ Pro Tips

1. **Large Exports**: Give large tables (1000+ rows) a few seconds to process
2. **Organize Files**: Exports are timestamped - keep them organized in folders
3. **Regular Backups**: Export critical tables regularly for backup purposes
4. **Excel Opening**: Open CSV in Excel → "Data" tab → "From Text/CSV" for best formatting
5. **Google Sheets**: Drag and drop CSV files or use "File" → "Import"

---

## 🔥 Example Workflow: Monthly Sales Report

```bash
1. Go to Admin Dashboard
2. Click "Export Data"
3. Select "Orders" from dropdown
4. Click "Export to CSV"
5. Open in Excel/Sheets
6. Filter by date range (last month)
7. Create pivot tables and charts
8. Generate report
```

---

## ❓ Troubleshooting

| Issue | Solution |
|-------|----------|
| Can't see Export Data card | Verify admin role |
| Dropdown is empty | Refresh page, check connection |
| Export button disabled | Select a table first |
| Download doesn't start | Check browser pop-up blocker |
| Empty CSV | Table has no data (expected) |

---

## 📞 Need Help?

1. See full documentation: `ADMIN-EXPORT-DATA-MODULE.md`
2. Check implementation details: `ADMIN-EXPORT-DATA-IMPLEMENTATION.md`
3. Run test script: `node scripts/test-export-api.js`
4. Review API at: `/api/admin/export-table`

---

**Quick Access**: `/admin/export-data`  
**Admin Only**: ✅  
**Format**: CSV  
**Status**: Ready to Use 🎉

