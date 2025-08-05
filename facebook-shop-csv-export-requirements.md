# Facebook Shop CSV Export Requirements

## Overview
Create a CSV export link (`treasurehub.club/fbshop.csv`) that allows administrators to export all listings with Facebook Shop enabled to a CSV format suitable for upload to Facebook Shop.

## Requirements

### 1. URL Access
- **URL**: `treasurehub.club/fbshop.csv`
- **Method**: GET request
- **Authentication**: ✅ **IMPLEMENTED** - HTTP Basic Authentication required
- **Access Control**: ✅ **IMPLEMENTED** - Username and password required for access

### 2. CSV Format
The CSV should include the following Facebook Shop required fields:
- `id` - Listing ID
- `title` - Listing title
- `description` - Listing description
- `price` - Listing price
- `condition` - Item condition (new, used, refurbished)
- `brand` - Item brand
- `availability` - In stock status
- `category` - Main category
- `subcategory` - Sub category
- `gtin` - Global Trade Item Number (optional)
- `mpn` - Manufacturer Part Number (optional)
- `image_url` - Primary image URL
- `additional_image_url_1` through `additional_image_url_8` - Additional image URLs
- `video_url` - Video URL (if available)
- `shipping_weight` - Shipping weight in pounds
- `shipping_length` - Shipping length in inches
- `shipping_width` - Shipping width in inches
- `shipping_height` - Shipping height in inches
- `seller_name` - Seller name
- `seller_email` - Seller email
- `created_at` - Listing creation date
- `updated_at` - Listing last update date

### 3. Data Source
- **Database**: PostgreSQL via Prisma ORM
- **Table**: `Listing` model
- **Filter**: Only listings where `facebookShopEnabled = true` and `status = 'active'`
- **Include**: User data for seller information

### 4. Authentication & Security
- ✅ **IMPLEMENTED** - HTTP Basic Authentication using username/password
- ✅ **IMPLEMENTED** - Credentials stored in environment variables (`FACEBOOK_SHOP_USERNAME`, `FACEBOOK_SHOP_PASSWORD`)
- ✅ **IMPLEMENTED** - Proper WWW-Authenticate headers for browser authentication prompts
- ✅ **IMPLEMENTED** - Fallback session-based authentication for additional security
- **Session Management**: Uses BetterAuth for secure session handling

### 5. File Generation
- **Content Type**: `text/csv`
- **Headers**: Include CSV headers as first row
- **Encoding**: UTF-8
- **File Naming**: `treasurehub-facebook-shop-YYYY-MM-DD.csv`
- **Download**: Browser download with proper Content-Disposition header

### 6. Error Handling
- **Authentication Errors**: Return 401 with WWW-Authenticate header
- **Authorization Errors**: Return 401 for invalid credentials
- **Database Errors**: Log errors and show user-friendly message
- **Network Errors**: Handle connection issues gracefully

### 7. Performance
- **Pagination**: Handle large datasets efficiently
- **Streaming**: Stream CSV generation for large exports
- **Caching**: Consider caching for frequently accessed data
- **Timeout**: Handle long-running exports appropriately

### 8. Admin Integration
- ✅ **IMPLEMENTED** - Added to Admin Dashboard as "Facebook Shop Export" module
- **Location**: Admin Dashboard with other export tools
- **Icon**: External link icon
- **Description**: Clear explanation of the feature

## Implementation Status

### ✅ Completed
1. **HTTP Basic Authentication**: Implemented username/password protection
2. **Environment Variables**: Added credential configuration
3. **Admin Dashboard Integration**: Added export module to admin panel
4. **Error Handling**: Implemented proper HTTP authentication responses
5. **Requirements Documentation**: Created this requirements document

### 🔄 In Progress
1. **Database Connection**: Debugging persistent 500 errors on API endpoints
2. **CSV Generation**: Final implementation with real database data
3. **Export Endpoint**: Resolving authentication and database issues

### ❌ Pending
1. **Full CSV Export**: Complete the actual CSV generation with real data
2. **Export Logging**: Add audit trail for export activities
3. **Performance Optimization**: Implement streaming for large datasets
4. **Testing**: Comprehensive testing with real data

## Next Steps

### Immediate (High Priority)
1. **Set Environment Variables**: Configure Facebook Shop credentials
   ```bash
   FACEBOOK_SHOP_USERNAME=your_chosen_username
   FACEBOOK_SHOP_PASSWORD=your_chosen_password
   ```

2. **Debug Database Issues**: Resolve the persistent 500 errors on API endpoints
   - Check Prisma client configuration
   - Verify database connection and environment variables
   - Test with simplified endpoints

3. **Complete CSV Export**: Finish the actual CSV generation
   - Implement proper CSV formatting
   - Add all required Facebook Shop fields
   - Test with real listing data

4. **Authentication Testing**: Verify the HTTP Basic Authentication works correctly
   - Test with correct credentials
   - Test with incorrect credentials
   - Test without credentials

### Medium Priority
1. **Export Logging**: Add audit trail for security and compliance
2. **Performance Testing**: Test with large datasets
3. **Error Recovery**: Implement retry mechanisms for failed exports

### Low Priority
1. **Export Scheduling**: Allow scheduled exports
2. **Export History**: Show previous export results
3. **Custom Filters**: Allow filtering by date range, category, etc.

## Technical Notes

### HTTP Basic Authentication Flow
1. Facebook requests `/api/facebook-shop/export`
2. Server checks for `Authorization: Basic <base64-encoded-credentials>` header
3. If missing, returns 401 with `WWW-Authenticate: Basic realm="Facebook Shop CSV Export"`
4. If present, decodes credentials and validates against environment variables
5. If valid, generates and returns CSV file
6. If invalid, returns 401 with authentication prompt

### Security Considerations
- Credentials stored securely in environment variables
- Base64 encoding for credential transmission
- Proper HTTP authentication headers
- Fallback session-based authentication for additional security
- No sensitive data exposed in error messages

### Environment Variables Required
```bash
# Facebook Shop CSV Export Credentials
FACEBOOK_SHOP_USERNAME=your_facebook_shop_username
FACEBOOK_SHOP_PASSWORD=your_facebook_shop_password
```

### File Structure
```
app/
├── fbshop.csv/
│   └── page.tsx                    # ✅ Password protected redirect page
├── api/
│   ├── facebook-shop/
│   │   └── export/
│   │       └── route.ts            # ✅ HTTP Basic Auth + CSV generation endpoint
│   └── admin/
│       └── check-status/
│           └── route.ts            # ✅ Admin verification endpoint
└── admin/
    └── page.tsx                    # ✅ Admin dashboard integration
```

## Testing Checklist

- [ ] HTTP Basic Authentication prompts for credentials
- [ ] Correct credentials allow access to CSV
- [ ] Incorrect credentials return 401 error
- [ ] Missing credentials return 401 with WWW-Authenticate header
- [ ] CSV file downloads correctly
- [ ] CSV contains all required fields
- [ ] CSV data is accurate and complete
- [ ] Error handling works for various scenarios
- [ ] Performance is acceptable with large datasets

## Facebook Integration Instructions

### For Facebook Shop Setup:
1. **URL**: `https://treasurehub.club/api/facebook-shop/export`
2. **Authentication**: HTTP Basic Authentication
3. **Username**: Set in `FACEBOOK_SHOP_USERNAME` environment variable
4. **Password**: Set in `FACEBOOK_SHOP_PASSWORD` environment variable
5. **Method**: GET
6. **Content Type**: `text/csv`

### Example cURL Command:
```bash
curl -u "your_username:your_password" \
     -H "Accept: text/csv" \
     -o "facebook-shop-export.csv" \
     "https://treasurehub.club/api/facebook-shop/export"
``` 