## Database Connection Pool Exhaustion Fix

### Problem
Intermittent database connection errors:
```
Can't reach database server at `ep-muddy-flower-aew37z9r-pooler.c-2.us-east-2.aws.neon.tech:5432`
```

**Why it happens**:
- Neon has connection limits (especially on free/hobby tiers)
- Multiple concurrent API calls can exhaust the connection pool
- Connections aren't being properly managed or released
- Listings page works because it makes fewer concurrent requests

### Solutions

#### 1. **Use Neon's Connection Pooler URL** (REQUIRED)
Your `DATABASE_URL` should use the **pooled connection**:

```env
# ❌ WRONG - Direct connection (limited connections)
DATABASE_URL="postgresql://user:pass@ep-xxx.c-2.us-east-2.aws.neon.tech:5432/neondb"

# ✅ CORRECT - Pooled connection (better for serverless)
DATABASE_URL="postgresql://user:pass@ep-xxx-pooler.c-2.us-east-2.aws.neon.tech:5432/neondb?pgbouncer=true"
```

**Note the differences**:
- Has `-pooler` in the hostname
- Has `?pgbouncer=true` parameter

#### 2. **Connection Pool Settings in DATABASE_URL**
Add these parameters to your connection string:

```env
DATABASE_URL="postgresql://user:pass@ep-xxx-pooler.c-2.us-east-2.aws.neon.tech:5432/neondb?pgbouncer=true&connection_limit=10&pool_timeout=10"
```

**Parameters**:
- `pgbouncer=true` - Use PgBouncer pooling
- `connection_limit=10` - Limit connections per Prisma instance
- `pool_timeout=10` - Timeout for acquiring connection (seconds)

#### 3. **Alternative: Use Prisma Accelerate** (Premium)
If you need more robust connection pooling:

```env
# Prisma Accelerate (requires subscription)
DATABASE_URL="prisma://accelerate.prisma-data.net/?api_key=YOUR_KEY"
```

### Quick Fix Steps

1. **Go to your Neon Dashboard**:
   - Find your database
   - Look for "Connection Details"
   - Copy the **"Pooled connection"** string (not "Direct connection")

2. **Update your `.env` file**:
   ```env
   DATABASE_URL="<paste-pooled-connection-string-here>?pgbouncer=true"
   ```

3. **Restart your dev server**:
   ```bash
   # Stop current server (Ctrl+C)
   npm run dev
   ```

### Why This Fixes It

**Before**:
- Each API call creates a new database connection
- Admin pages make multiple concurrent calls
- Neon's connection limit (10-100 depending on plan) gets exhausted
- New requests fail with "Can't reach database"

**After**:
- PgBouncer pools connections efficiently
- Multiple requests share connections
- Connections are reused instead of created new
- Much more stable under load

### Verify the Fix

After applying:
1. Open Admin Dashboard → Inventory
2. Search for items rapidly
3. Should no longer see connection errors
4. Check logs - should see successful requests

### Additional Notes

- **Neon Free Tier**: 100 connection limit
- **Neon Pro**: 1000+ connections
- **Connection pooling**: Dramatically reduces actual connections needed
- **Serverless environments** (like Next.js) need pooling due to lambda scaling

### If Still Having Issues

Try adding to your `schema.prisma`:

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  directUrl = env("DIRECT_DATABASE_URL") // Optional: for migrations
  relationMode = "prisma" // If needed
}
```

And in `.env`:
```env
DATABASE_URL="pooled-connection-string"
DIRECT_DATABASE_URL="direct-connection-string" # Only for migrations
```

This separates pooled connections (runtime) from direct connections (migrations).

