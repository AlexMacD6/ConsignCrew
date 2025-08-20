# Profile Page Performance Optimizations

## Overview
The profile page was experiencing slow load times due to multiple sequential API calls and redundant requests. This document outlines the optimizations implemented to improve performance.

## Issues Identified
1. **Multiple Sequential API Calls**: 6+ separate API calls loading in waterfall fashion
2. **Redundant API Calls**: Same endpoints called multiple times
3. **No Caching**: API responses had no cache headers
4. **Duplicate Permission Checks**: `useUserPermissions` hook making multiple identical requests
5. **Slow Compilation**: Heavy Next.js route compilation on first load

## Optimizations Implemented

### 1. Combined API Endpoint (`/api/profile/complete`)
- **Before**: 6+ separate API calls (profile, organizations, admin-check, listings, purchases, etc.)
- **After**: Single API call returning all profile data
- **Performance Gain**: ~70% reduction in network requests

#### Features:
- Returns user profile, permissions, admin status, listings, purchases, and stats in one response
- Uses `Promise.all()` for parallel database queries
- Transforms data for frontend consumption
- Includes computed statistics

### 2. Optimized `useUserPermissions` Hook
- **Before**: Made fresh API calls on every component render
- **After**: Implements caching and deduplication

#### Features:
- **Global Cache**: 5-minute cache across all components
- **Request Deduplication**: Prevents multiple simultaneous requests
- **Cache Management**: Export function to clear cache when roles change

### 3. HTTP Caching Headers
Added appropriate caching headers to API responses:

| Endpoint | Cache Duration | Rationale |
|----------|---------------|-----------|
| `/api/profile/complete` | 30s | Profile data changes moderately |
| `/api/profile/organizations` | 5 minutes | User roles change infrequently |
| `/api/admin/check-status` | 5 minutes | Admin status rarely changes |

### 4. Data Prefetching Strategy
- **Before**: Sequential loading (profile → admin check → listings → purchases)
- **After**: Parallel loading of all data in combined endpoint
- **Admin Data**: Only loaded if user is confirmed admin

### 5. Reduced Authentication Overhead
- **Before**: Multiple session validation calls per page load
- **After**: Single session validation in combined endpoint

## Performance Metrics Expected

### Before Optimization:
```
Total API Calls: 6+
Total Time: ~12-15 seconds
- /api/profile: 5449ms + 138ms (duplicate)
- /api/profile/organizations: 3627ms + 2639ms (duplicate)
- /api/admin/check-status: 3298ms
- /api/listings?userOnly=true: 1942ms
- /api/profile/purchases: 1323ms
- /api/admin/zipcodes: 919ms + 78ms (duplicate)
```

### After Optimization:
```
Total API Calls: 1-2
Expected Total Time: ~3-5 seconds
- /api/profile/complete: ~2-3 seconds (parallel queries)
- /api/admin/* (only if admin): ~1-2 seconds
```

## Implementation Details

### Combined API Response Structure:
```typescript
{
  success: true,
  user: UserProfile,
  organizations: UserOrganization[],
  permissions: {
    canListItems: boolean,
    canBuyItems: boolean,
    isSeller: boolean,
    isBuyer: boolean,
    isAdmin: boolean,
  },
  listings: Listing[],
  purchases: Purchase[],
  stats: {
    totalListings: number,
    activeListings: number,
    soldListings: number,
    totalPurchases: number,
    completedPurchases: number,
    totalSpent: number,
  }
}
```

### Caching Strategy:
- **Short Cache (30s)**: Dynamic data like listings/purchases
- **Medium Cache (5 min)**: User permissions and admin status
- **Stale-while-revalidate**: Provides immediate response while updating in background

## Migration Notes
- Old individual endpoints still exist for backward compatibility
- Profile page now uses `/api/profile/complete` primarily
- Admin data still loads separately but only when needed
- Cache can be cleared via `clearPermissionsCache()` function

## Future Considerations
1. **Database Query Optimization**: Consider adding database indexes for better query performance
2. **CDN Caching**: For static data, consider implementing CDN-level caching
3. **Background Refresh**: Implement background data refresh for cached responses
4. **Pagination**: For users with many listings/purchases, implement pagination

## Testing
To verify optimizations:
1. Monitor Network tab in browser dev tools
2. Check for reduced number of API calls
3. Verify caching headers in response
4. Measure total page load time
5. Test with different user types (buyer, seller, admin)
