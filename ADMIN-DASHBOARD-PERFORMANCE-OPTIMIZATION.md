# Admin Dashboard Performance Optimization

## Issues Identified

1. **MaxListenersExceededWarning**: Prisma client was registering multiple `beforeExit` event listeners
2. **Too Many API Calls**: Admin dashboard was loading ALL data on initial page load, regardless of which tab was being viewed
3. **Sequential API Calls**: All API calls were happening sequentially instead of in parallel where possible

## Changes Made

### 1. Fixed Prisma Event Listener Leak (`lib/prisma.ts`)

**Problem**: Every time the module was imported, it added a new `beforeExit` listener, causing the warning when 11+ listeners were registered.

**Solution**: Track whether the exit handler has been registered using a global flag:

```typescript
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
  prismaExitHandlerRegistered?: boolean
}

// Only register the handler once
if (process.env.NODE_ENV !== 'production' && !globalForPrisma.prismaExitHandlerRegistered) {
  globalForPrisma.prismaExitHandlerRegistered = true
  process.on('beforeExit', async () => {
    await prisma.$disconnect()
  })
}
```

### 2. Lazy-Load Data Per Tab (`app/admin/page.tsx`)

**Before**:
- All data loaded on page mount (users, orgs, invitations, zip codes, questions, AI config, inventory)
- 7+ API calls happening on every admin dashboard visit
- Data loaded even if user never visited that tab

**After**:
- Data loads only when switching to a tab that needs it
- Tabs cache their data (won't reload if already loaded)
- Multiple related endpoints load in parallel using `Promise.all()`

### 3. Tab-Specific Data Loading

| Tab | Data Loaded | API Calls |
|-----|-------------|-----------|
| Overview | Users, Organizations, Questions | 3 (parallel) |
| Users | Users only | 1 |
| Organizations | Organizations, Invitations | 2 (parallel) |
| Settings | Zip Codes, AI Config | 2 (parallel) |
| Inventory | Inventory Lists | 1 |
| Facebook | None (on-demand only) | 0 |
| Security | None (on-demand only) | 0 |

## Performance Impact

**Before**:
```
Initial Load: 7+ sequential API calls
Tab Switch: 0 calls (data already loaded)
Total calls on first visit: 7+
```

**After**:
```
Initial Load (Overview): 3 parallel API calls
Tab Switch to Users: 0 calls (already loaded in overview)
Tab Switch to Settings: 2 parallel API calls (first time)
Tab Switch to Settings again: 0 calls (cached)
Total calls on first visit: ~3-5 (depending on tabs visited)
```

**Reduction**: ~40-70% fewer API calls on initial admin dashboard visit

## Additional Benefits

1. **Faster initial page load** - Only loads what's needed for the current tab
2. **Better user experience** - Subsequent tab visits are instant (cached)
3. **Reduced database load** - Fewer concurrent queries to Neon
4. **No more MaxListenersExceededWarning** - Single Prisma exit handler

## Testing

To verify the optimization:
1. Open DevTools Network tab
2. Navigate to `/admin`
3. Check initial API calls (should see only 3-4 for overview)
4. Switch between tabs
5. Notice subsequent visits to same tab don't reload data
6. Check terminal - no more MaxListenersExceededWarning
























