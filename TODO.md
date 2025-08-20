# TODO List

## Completed Tasks ✅

### Review-to-Tip System
- [x] Create database schema for drivers, review scans, and bonuses
- [x] Build QR code redirect endpoint (`/review/[initials]`)
- [x] Create admin dashboard component for Review-to-Tip management
- [x] Implement driver scan tracking and bonus confirmation
- [x] Add driver management interface
- [x] Fix driver page access issues
- [x] Update Google Reviews redirect URL
- [x] Tone down tip messaging for compliance

### SEO Optimization
- [x] Revert main landing page to original client component
- [x] Add comprehensive SEO metadata (meta tags, Open Graph, Twitter Cards)
- [x] Implement JSON-LD structured data
- [x] Add hidden `sr-only` content for search engines
- [x] Optimize for brand variations (TreasureHub, Treasure Hub, TreasureHub.Club)
- [x] Add location-based keywords (Houston, Texas)

### User Permission System
- [x] Create `useUserPermissions` hook for centralized permission checking
- [x] Restrict "List An Item" functionality for users with `userType "buyer"`
- [x] Update NavBar to conditionally show "List An Item" button
- [x] Update profile page to conditionally show "Create Listing" button
- [x] Update homepage to conditionally show "List Your Item" buttons
- [x] Add route protection for `/list-item` page

### Inventory Management Streamlining
- [x] Create combined API endpoint for inventory list creation and CSV upload
- [x] Replace simple "List Name" field with comprehensive fields (Lot Number, Date Purchased, Brief Description)
- [x] Auto-generate title based on input fields
- [x] Update frontend modal to handle one-step process
- [x] Update inventory list display to show total units alongside total items

### Zip Code Management Improvements
- [x] Fix zip code display issues in Admin Dashboard
- [x] Create dynamic API routes for zip code CRUD operations
- [x] Add missing "Edit Zip Code Modal" component
- [x] Separate zip code display into buyer and seller tables
- [x] Improve table readability with proper headers and counts

### Profile Page Updates
- [x] Change "Postal Code" to "Zip Code" in address section
- [x] Create comprehensive Houston Metro Area map component
- [x] Integrate map into profile page showing service areas
- [x] Display user location and service availability
- [x] Improve map visualization with highways, water bodies, and districts
- [x] Remove neighborhood/area labels for cleaner appearance
- [x] Add zoom and pan functionality for better map exploration
- [x] Simplify to show only service area status (remove complex map visualization)

### Checkout & Payment Security
- [x] Add zip code validation before Stripe processing
- [x] Create zip code validation API endpoint
- [x] Prevent checkout completion for invalid shipping addresses
- [x] Add address validation UI in checkout flow
- [x] Integrate user profile address data with checkout validation

### UI Cleanup & Simplification
- [x] Remove AI Image Quality Score section from listing detail page
- [x] Clean up unused similarity calculation code and state variables

## Pending Tasks 🚧

### Database Schema & Saves Functionality
- [x] Add `saves` column to Listing table in database
- [x] Re-enable saves API endpoint after database migration
- [x] Restore full saves functionality in listing detail page
- [x] Add saves count display to listing detail page and profile page
- [x] Test saves counting and persistence

### None currently pending

## Future Enhancements 💡

### Review-to-Tip System
- [ ] Add email notifications for review confirmations
- [ ] Implement automated bonus calculations
- [ ] Add reporting and analytics dashboard

### Inventory Management
- [ ] Add bulk editing capabilities
- [ ] Implement inventory forecasting
- [ ] Add barcode scanning support

### User Experience
- [ ] Add mobile app version
- [ ] Implement push notifications
- [ ] Add user onboarding flow

### Analytics & Reporting
- [ ] Add comprehensive analytics dashboard
- [ ] Implement user behavior tracking
- [ ] Add conversion rate optimization tools
