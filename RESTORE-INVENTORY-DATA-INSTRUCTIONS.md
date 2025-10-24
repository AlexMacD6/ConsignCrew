# Instructions to Restore Inventory Data from Neon Backup

## Step 1: Access Neon Backup

1. Go to your Neon Console: https://console.neon.tech
2. Navigate to your project
3. Go to **Branches** tab
4. Click **"Create Branch"**
5. Select **"Point in time"** restore
6. Choose a timestamp **BEFORE** you ran the migration (before we ran `npx prisma db push`)
7. Name it something like `backup-before-disposition-migration`
8. Click **Create Branch**

## Step 2: Query the Backup Branch

1. In the Neon Console, select your new backup branch
2. Go to **SQL Editor**
3. Run the query from `scripts/export-old-inventory-data.sql`:

```sql
SELECT 
  id,
  itemNumber,
  description,
  quantity as totalQuantity,
  receiveStatus,
  receivedQuantity,
  disposition,
  dispositionQuantity,
  dispositionNotes,
  receivedAt,
  receivedBy,
  dispositionAt,
  dispositionBy
FROM "InventoryItem"
ORDER BY id;
```

4. Click **Export** → **JSON**
5. Save the file as `scripts/old-inventory-data.json` in your project directory

## Step 3: Run the Import Script

```bash
node scripts/import-old-inventory-data.js
```

This will:
- Read the exported data
- Create `InventoryDisposition` records for each item based on its old status
- Preserve the received/trashed/used quantities
- Maintain notes and user tracking information

## Step 4: Verify the Import

1. Refresh your Inventory Receiving page
2. Check that items show correct quantities for:
   - Manifested (not yet received)
   - Received (for resale)
   - Trashed (disposed)
   - Used (personal/business use)

## Step 5: Clean Up (Optional)

After verifying the data is correct, you can delete the backup branch in Neon to avoid extra charges.

---

## What the Script Does

The import script converts old data format to new:

**Old Format:**
- `receivedQuantity: 5`
- `disposition: 'TRASH'`
- `dispositionQuantity: 2`

**New Format (created records):**
1. `InventoryDisposition { status: 'RECEIVED', quantity: 3 }` (5 received - 2 dispositioned)
2. `InventoryDisposition { status: 'TRASH', quantity: 2 }`

This preserves all your original data in the new, more flexible format!







