# TreasureHub Database Schema - Usage Guide

## Overview
This SQL script (`treasurehub-database-schema.sql`) contains the complete database schema for TreasureHub, including all tables, relationships, indexes, and enums.

## Database Statistics
- **Total Tables:** 49
- **Total Enums:** 4
- **Total Indexes:** 100+
- **Database:** PostgreSQL 14+

## Quick Start

### 1. Create a New PostgreSQL Database

```bash
# Using psql
createdb treasurehub_new

# Or using SQL
psql -U postgres
CREATE DATABASE treasurehub_new;
```

### 2. Run the Schema Script

```bash
# Execute the SQL file
psql -U postgres -d treasurehub_new -f treasurehub-database-schema.sql

# Or from within psql
\i treasurehub-database-schema.sql
```

### 3. Verify Creation

```sql
-- Check all tables were created
SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;

-- Check enums
SELECT typname FROM pg_type WHERE typtype = 'e' ORDER BY typname;

-- Check total table count
SELECT COUNT(*) FROM pg_tables WHERE schemaname = 'public';
```

## Tables by Category

### Core User & Authentication (7 tables)
- `user` - Main user table
- `account` - OAuth/password authentication
- `session` - User sessions
- `verificationToken` - Email verification tokens
- `verification` - General verification records

### Organization & Teams (5 tables)
- `Organization` - Company/organization entities
- `Member` - User-organization memberships
- `Invitation` - Pending organization invites
- `Team` - Teams within organizations
- `TeamMember` - Team memberships

### Listings & Marketplace (5 tables)
- `Listing` - Main product listings
- `price_history` - Price change tracking
- `listing_history` - Event history for listings
- `saved_listings` - User-saved items
- `hidden_listings` - User-hidden items

### Shopping & Orders (4 tables)
- `carts` - Shopping carts
- `cart_items` - Items in carts
- `orders` - Completed orders
- `delivery_time_slots` - Delivery scheduling

### Media (5 tables)
- `PhotoGallery` - Photo storage and management
- `Video` - Video storage and management
- `_ListingToVideo` - Listing-video relationships
- `MobileItem` - Mobile app uploads
- `MobileItemMetadata` - Mobile item details

### Inventory (4 tables)
- `InventoryList` - Inventory batches
- `InventoryItem` - Individual inventory items
- `InventoryDisposition` - Item disposition tracking
- Junction tables for listing relationships

### Treasure Hunt (3 tables)
- `TreasureCode` - QR codes for treasure hunt
- `TreasureDrop` - Physical treasure locations
- `TreasureRedemption` - Redemption submissions

### Delivery & Drivers (5 tables)
- `Driver` - Delivery driver profiles
- `ReviewScan` - Review QR scans
- `GoogleReview` - Google review tracking
- `ReviewBonus` - Driver bonuses
- `PreScreeningRating` - Pre-review ratings

### eBay Integration (3 tables)
- `EbayItem` - Tracked eBay items
- `EbayNotification` - eBay webhooks
- `EbayNotificationLog` - Processing logs

### Other (8 tables)
- `ZipCode` - Location reference data
- `ai_responses` - AI chatbot responses
- `Question` - Q&A system
- `early_access_signups` - Marketing signups
- `Contact` - Contact form submissions
- `promo_codes` - Promotional codes
- `FacebookApiKey` - Facebook API management

## Enum Types

### DeliveryCategory
- `NORMAL` - Standard delivery
- `BULK` - Large/bulky items

### OrderStatus
- `PENDING` - Order created
- `PAID` - Payment received
- `PROCESSING` - Being prepared
- `SHIPPED` - In transit
- `DELIVERED` - Delivered to customer
- `FINALIZED` - Transaction complete
- `DISPUTED` - Customer dispute
- `CANCELLED` - Order cancelled
- `REFUNDED` - Payment refunded
- `PENDING_SCHEDULING` - Awaiting delivery schedule
- `SCHEDULED` - Delivery scheduled
- `EN_ROUTE` - Driver en route
- `AWAITING_DELIVERY_SCHEDULING` - Needs scheduling

### DeliveryTimeSlotStatus
- `PENDING_SELECTION` - Awaiting buyer selection
- `CONFIRMED` - Time slot confirmed
- `CANCELLED` - Cancelled

### InventoryItemStatus
- `RECEIVED` - Item received
- `TRASH` - Marked for disposal
- `USE` - In use

## Important Notes

### ID Generation
All IDs use `cuid()` which generates:
- Collision-resistant IDs
- Sortable by creation time
- URL-safe strings

You'll need to implement this in your application or use a library like:
```bash
npm install @paralleldrive/cuid2
```

### Timestamps
- All timestamps are in UTC
- Use `CURRENT_TIMESTAMP` for automatic creation times
- `updatedAt` fields require application-level updates

### JSONB Fields
These fields store flexible data:
- `Listing.photos` - Photo URLs and metadata
- `Listing.discountSchedule` - Price drop schedules
- `Listing.flawData` - Item flaw information
- `Order.shippingAddress` - Full address details
- `Order.deliveryPhotos` - Delivery proof photos
- `Order.orderItems` - Multi-item order details
- And more...

## Migration from Existing Database

### Export Data
```bash
# Export data from existing database
pg_dump -U postgres -d treasurehub_old --data-only --inserts -f data_backup.sql
```

### Import Data
```bash
# 1. Create new database with schema
psql -U postgres -d treasurehub_new -f treasurehub-database-schema.sql

# 2. Import data
psql -U postgres -d treasurehub_new -f data_backup.sql
```

### Or Use Prisma
```bash
# 1. Update your DATABASE_URL in .env
DATABASE_URL="postgresql://user:password@localhost:5432/treasurehub_new"

# 2. Generate Prisma Client
npx prisma generate

# 3. Push schema (this will match your schema.prisma)
npx prisma db push
```

## Maintenance Commands

### Check Database Size
```sql
SELECT pg_size_pretty(pg_database_size('treasurehub_new'));
```

### Check Table Sizes
```sql
SELECT
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

### Check Index Usage
```sql
SELECT
  schemaname,
  tablename,
  indexname,
  idx_scan AS number_of_scans,
  idx_tup_read AS tuples_read,
  idx_tup_fetch AS tuples_fetched
FROM pg_stat_user_indexes
ORDER BY idx_scan DESC;
```

### Vacuum and Analyze
```sql
-- Regular maintenance
VACUUM ANALYZE;

-- For specific tables
VACUUM ANALYZE "Listing";
VACUUM ANALYZE "orders";
```

## Security Recommendations

1. **Create Application User**
```sql
CREATE USER treasurehub_app WITH PASSWORD 'secure_password_here';
GRANT CONNECT ON DATABASE treasurehub_new TO treasurehub_app;
GRANT USAGE ON SCHEMA public TO treasurehub_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO treasurehub_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO treasurehub_app;
```

2. **Enable Row-Level Security (Optional)**
```sql
ALTER TABLE "user" ENABLE ROW LEVEL SECURITY;
-- Add policies as needed
```

3. **Connection Pooling**
Use PgBouncer or a connection pooler for production:
```bash
DATABASE_URL="postgresql://user:password@localhost:6432/treasurehub_new?pgbouncer=true"
```

## Troubleshooting

### Issue: "relation already exists"
**Solution:** Drop existing tables first:
```sql
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
```

### Issue: "type already exists"
**Solution:** Drop existing enums:
```sql
DROP TYPE IF EXISTS "DeliveryCategory" CASCADE;
DROP TYPE IF EXISTS "OrderStatus" CASCADE;
DROP TYPE IF EXISTS "DeliveryTimeSlotStatus" CASCADE;
DROP TYPE IF EXISTS "InventoryItemStatus" CASCADE;
```

### Issue: Foreign key constraint errors during import
**Solution:** Disable triggers temporarily:
```sql
SET session_replication_role = replica;
-- Import data here
SET session_replication_role = DEFAULT;
```

## Performance Optimization

### Add Missing Indexes (if needed)
```sql
-- Example: Add composite index for common queries
CREATE INDEX idx_listing_status_department ON "Listing"(status, department);
CREATE INDEX idx_orders_buyer_status ON "orders"(buyerId, status);
```

### Configure PostgreSQL
```ini
# postgresql.conf recommendations
shared_buffers = 256MB
effective_cache_size = 1GB
maintenance_work_mem = 64MB
max_connections = 100
work_mem = 4MB
```

## Backup Strategy

### Daily Backups
```bash
#!/bin/bash
# backup_treasurehub.sh
DATE=$(date +%Y%m%d_%H%M%S)
pg_dump -U postgres -d treasurehub_new -F c -f backup_${DATE}.dump
```

### Point-in-Time Recovery
Enable WAL archiving in postgresql.conf:
```ini
wal_level = replica
archive_mode = on
archive_command = 'test ! -f /mnt/server/archivedir/%f && cp %p /mnt/server/archivedir/%f'
```

## Support

For questions or issues:
1. Check Prisma schema: `prisma/schema.prisma`
2. Review this documentation
3. Check PostgreSQL logs: `sudo tail -f /var/log/postgresql/postgresql-14-main.log`

---

**Generated:** November 5, 2025  
**Version:** 1.0  
**Compatible With:** PostgreSQL 14+, Prisma 6.14.0+

