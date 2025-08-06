# BetterAuth Name Field Fix

## Changelog

- Fixed user registration failure with OAuth providers
  - Added `name` field to BetterAuth `additionalFields` configuration
  - Updated custom Prisma adapter to handle name field mapping
  - Improved name parsing logic to prioritize existing firstName/lastName values
  - Enhanced debugging with better console logs

- Resolved "Unknown argument `name`" error
  - BetterAuth now accepts the `name` field from OAuth providers
  - Custom adapter properly maps `name` to `firstName` and `lastName`
  - Removes `name` field before database insertion
  - Maintains clean Prisma schema with only firstName/lastName fields

- Enhanced OAuth registration compatibility
  - Handles various data scenarios (name only, mixed data, email/password)
  - Prioritizes existing firstName/lastName values when available
  - Provides clear console logging for debugging
  - No breaking changes to existing functionality

---

## Testing Instructions

1. Pull this branch and run `npm install`
2. Start the application with `npm run dev`
3. Test OAuth registration:
   - Try registering with Google OAuth
   - Check console logs for "Custom createUser called with:" message
   - Verify that the user's name is properly mapped to firstName and lastName
   - Check that the user is created successfully without errors
4. Test email/password registration:
   - Try registering with email and password
   - Verify that firstName and lastName are used directly
   - Ensure no name mapping is applied
5. Test edge cases:
   - Test with single names (e.g., "John")
   - Test with multiple word names (e.g., "John Michael Doe")
   - Test with names containing extra spaces
6. Verify database:
   - Check that users are created with correct firstName and lastName
   - Confirm that no `name` field is present in the database

## Name Mapping Examples

- **"John Doe"** → firstName: "John", lastName: "Doe"
- **"John Michael Doe"** → firstName: "John", lastName: "Michael Doe"
- **"John"** → firstName: "John", lastName: ""
- **Mixed data** → Prioritizes existing firstName/lastName values

## Files Changed

- `app/lib/auth.ts` - Added name field to BetterAuth additionalFields
- `app/lib/custom-prisma-adapter.ts` - Updated name mapping logic
- `requirements/betterauth-name-field-fix.txt` - Requirements documentation
- `pr-templates/betterauth-name-field-fix.md` - This PR template

## Technical Details

### BetterAuth Configuration
```typescript
additionalFields: {
  name: { type: "string", required: false }, // Allow BetterAuth to pass name field
  firstName: { type: "string", required: true },
  lastName: { type: "string", required: true },
  // ... other fields
}
```

### Custom Adapter Logic
```typescript
// Handle OAuth providers that send 'name' instead of firstName/lastName
if (data.name && (!data.firstName || !data.lastName)) {
  const nameParts = data.name.trim().split(' ')
  data.firstName = data.firstName || nameParts[0] || ''
  data.lastName = data.lastName || nameParts.slice(1).join(' ') || ''
  console.log('Processed name mapping:', { firstName: data.firstName, lastName: data.lastName })
}

// Always remove the name field since we don't have it in our Prisma schema
delete data.name
```

## Benefits

- **✅ Fixed OAuth Registration**: Users can now register with any OAuth provider
- **✅ Clean Schema**: Maintains consistent firstName/lastName structure
- **✅ BetterAuth Compatibility**: Properly handles BetterAuth's automatic field mapping
- **✅ Robust Logic**: Handles various data scenarios gracefully
- **✅ No Schema Changes**: Database structure remains unchanged
- **✅ Better Debugging**: Clear console logs show the mapping process
- **✅ No Breaking Changes**: Existing functionality preserved 