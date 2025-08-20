# Review-to-Tip Feature Implementation

## 🎯 Overview

The Review-to-Tip feature is a production-ready system that allows TreasureHub delivery drivers to earn bonuses through customer reviews. Each driver carries QR code cards that redirect customers to Google Reviews, and drivers earn $5 for every verified 5-star review.

## 🔗 Key URLs

- **Admin Dashboard**: `/admin/review-to-tip`
- **QR Code Generator**: `/admin/review-to-tip/qr-generator`
- **Driver QR Code**: `/review/[initials]` (e.g., `/review/arm`)
- **Confirmation Page**: `/review/[initials]/confirmation`

## 🗄️ Database Schema

### Driver
```sql
- id (String, Primary Key)
- initials (String, Unique) // e.g., "ARM"
- fullName (String)
- email (String, Optional)
- phone (String, Optional)
- isActive (Boolean, Default: true)
- totalReviews (Int, Default: 0)
- totalBonusEarned (Float, Default: 0)
- googleReviewsUrl (String, Optional)
- createdAt (DateTime)
- updatedAt (DateTime)
```

### ReviewScan
```sql
- id (String, Primary Key)
- driverId (String, Foreign Key)
- ipAddress (String, Optional)
- userAgent (String, Optional)
- scannedAt (DateTime, Default: now())
```

### GoogleReview
```sql
- id (String, Primary Key)
- reviewScanId (String, Foreign Key, Unique)
- googleReviewId (String, Optional, Unique)
- rating (Int) // 1-5 stars
- reviewText (String, Optional)
- reviewerName (String, Optional)
- confirmedAt (DateTime, Default: now())
- bonusAwarded (Boolean, Default: false)
```

### ReviewBonus
```sql
- id (String, Primary Key)
- driverId (String, Foreign Key)
- googleReviewId (String, Foreign Key)
- bonusAmount (Float, Default: 5.00)
- awardedAt (DateTime, Default: now())
- paymentStatus (String, Default: "pending") // pending, paid, cancelled
- paymentMethod (String, Optional)
- paymentDetails (Json, Optional)
```

## 🛠️ API Endpoints

### Driver Management
- `GET /api/admin/drivers` - List all drivers with pagination and filtering
- `POST /api/admin/drivers` - Create new driver
- `PUT /api/admin/drivers` - Update existing driver
- `DELETE /api/admin/drivers?id={id}` - Deactivate driver (soft delete)
- `POST /api/admin/drivers/seed` - Seed initial driver data

### Review Management
- `GET /api/admin/reviews` - List review scans and confirmed reviews
- `POST /api/admin/reviews` - Manually confirm a Google review
- `PUT /api/admin/reviews` - Update confirmed review details

### Bonus Management
- `GET /api/admin/bonuses` - List all bonuses with payment status
- `PUT /api/admin/bonuses` - Update single bonus payment status
- `POST /api/admin/bonuses` - Bulk update bonus payment statuses

## 📱 QR Code System

### URL Format
```
https://treasurehub.club/review/[DRIVER_INITIALS]
```

### Flow
1. Customer scans QR code on driver's card
2. System logs scan (IP, user agent, timestamp)
3. Customer redirected to Google Reviews
4. Admin manually confirms reviews in dashboard
5. System automatically awards $5 bonus for 5-star reviews

### Card Design
- Business card size (3.5" x 2")
- TreasureHub branding
- Driver message about review-to-tip system
- QR code linking to driver's unique URL
- Printable via admin dashboard

## 🔧 Setup Instructions

### 1. Database Migration
```bash
npx prisma db push
npx prisma generate
```

### 2. Seed Initial Data
```bash
node scripts/seed-review-to-tip.js
```

### 3. Environment Variables
Ensure your `.env` file has:
```env
DATABASE_URL="your_database_url"
ADMIN_SEED_KEY="your_admin_key" # Optional, for API security
```

### 4. Update Google Reviews URL
In the admin dashboard, set the actual Google Reviews URL for your TreasureHub business.

## 📊 Admin Dashboard Features

### Driver Management
- Add new drivers with initials and contact info
- View driver statistics (scans, reviews, bonuses earned)
- Activate/deactivate drivers
- Generate unique QR codes

### Review Tracking
- View all QR code scans in real-time
- Manually confirm Google reviews
- Link reviews to specific drivers
- Track review ratings and text

### Bonus Management
- View all awarded bonuses
- Update payment status (pending → paid)
- Bulk payment operations
- Track payment methods (Venmo, CashApp, etc.)

### QR Code Generator
- Generate QR codes for all active drivers
- Download high-resolution PNG files
- Print business card templates
- Preview card designs

## 🎨 UI Components

The feature uses custom UI components:
- `Card`, `CardHeader`, `CardContent` - Layout containers
- `Button` - Action buttons with variants
- `Badge` - Status indicators
- `Input` - Form inputs
- `Tabs` - Dashboard navigation

## 🔒 Security Features

- IP address logging for scan tracking
- User agent tracking for analytics
- Admin authentication (can be enhanced)
- Soft delete for drivers (preserves history)
- Audit trail for all bonus awards

## 📈 Analytics & Reporting

The dashboard provides real-time statistics:
- Total drivers and active count
- QR code scan volume
- Review confirmation rate
- Pending and paid bonuses
- Total bonus amounts by driver

## 🚀 Production Deployment

### Pre-launch Checklist
- [ ] Update Google Reviews URL to actual business page
- [ ] Set up proper admin authentication
- [ ] Configure email notifications for new reviews
- [ ] Test QR codes on various devices
- [ ] Print initial batch of driver cards
- [ ] Train drivers on the system

### Monitoring
- Track QR scan rates by driver
- Monitor review confirmation timing
- Watch for fraudulent patterns
- Analyze bonus payout trends

## 💰 Bonus System

### Default Settings
- **Bonus Amount**: $5.00 per 5-star review
- **Eligible Ratings**: Only 5-star reviews earn bonuses
- **Payment Statuses**: pending, paid, cancelled
- **Verification**: Manual admin confirmation required

### Payment Integration (Future Enhancement)
Consider integrating with:
- Venmo API for automatic payments
- CashApp API for direct transfers
- Payroll system for bonus inclusion
- Stripe for payment processing

## 🔄 Workflow Example

1. **Driver Setup**: Admin adds Alexander Raymond MacDonald with initials "ARM"
2. **QR Generation**: System creates URL `treasurehub.club/review/arm`
3. **Card Printing**: Admin prints business cards with QR code
4. **Customer Scan**: Customer scans QR during delivery
5. **Review Submission**: Customer leaves 5-star Google review
6. **Admin Confirmation**: Admin confirms review in dashboard
7. **Bonus Award**: System automatically awards $5 bonus
8. **Payment Processing**: Admin marks bonus as paid

## 📝 Sample Data

The seed script creates:
- Alexander Raymond MacDonald (ARM)
- John Doe (JD)  
- Jane Smith (JS)
- Sample QR scans and reviews for testing

## 🔧 Customization Options

### Bonus Amounts
Modify default bonus amount in `/api/admin/reviews` route:
```typescript
bonusAmount: 10.00, // Change from $5 to $10
```

### Card Design
Update card template in `/admin/review-to-tip/qr-generator/page.tsx`

### Review Requirements
Adjust rating threshold for bonuses (currently 5 stars only)

### Payment Methods
Add new payment options in bonus management interface

## 🐛 Troubleshooting

### Common Issues
1. **QR Code Not Working**: Check driver initials are correct and active
2. **Reviews Not Confirmed**: Ensure admin manually confirms reviews
3. **Bonuses Not Awarded**: Check review rating is 5 stars
4. **Dashboard Access**: Verify admin authentication

### Database Issues
```bash
# Reset migrations if needed (data loss warning)
npx prisma migrate reset

# Push schema changes without migration
npx prisma db push
```

### API Testing
```bash
# Test driver creation
curl -X POST /api/admin/drivers -H "Content-Type: application/json" -d '{"initials":"TEST","fullName":"Test Driver"}'

# Test QR redirect
curl -I /review/arm
```

## 📞 Support

For technical issues:
1. Check logs in admin dashboard
2. Verify database connectivity
3. Test API endpoints manually
4. Review QR code formatting

The Review-to-Tip feature is now fully implemented and ready for production use! 🎉
