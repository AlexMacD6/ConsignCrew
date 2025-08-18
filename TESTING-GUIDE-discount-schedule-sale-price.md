# 🧪 Testing Guide: Discount Schedule Sale Price Integration

## 🎯 Overview
This guide will help you test the new Facebook catalog sale price integration that uses discount schedules instead of constantly changing the main list price.

## 📋 Prerequisites
- Database connection configured
- Prisma client installed
- Facebook API credentials set up
- At least one user in the database

## 🚀 Step 1: Get a Valid User ID

Before running the seed script, you need a valid user ID:

```bash
cd scripts
node get-user-id.js
```

This will show you available users and suggest one to use. Copy the suggested user ID.

## 🗃️ Step 2: Update the Seed Script

Edit `scripts/seed-discount-schedule-test-listings.js` and replace `'test-user-id'` with the actual user ID you copied:

```javascript
// Change this line:
userId: 'test-user-id',

// To this (example):
userId: 'clx1234567890abcdef',
```

## 🌱 Step 3: Run the Seed Script

```bash
cd scripts
node seed-discount-schedule-test-listings.js
```

**Expected Output:**
```
🚀 Starting to create test listings for discount schedule testing...

✅ Created: iPhone 15 Pro Max - 256GB - Space Black
   Item ID: ABC12345
   Price: $1199.99 | Reserve: $899.99
   Schedule: Turbo-30
   Created: 0 days ago
   Sale Price: 100% of original (no sale price)
   Status: active

... (continues for all 16 listings)

🎉 Seed script completed!
✅ Created: 16 listings
❌ Errors: 0 listings

📊 Test Scenarios Created:
   • Turbo-30: 7 listings (various stages including expired)
   • Classic-60: 7 listings (various stages including expired)
   • No Schedule: 2 listings (for comparison)
```

## 🧪 Step 4: Test Scenarios

### **Scenario 1: Sale Price Activation**

**What to Test:** Verify sale prices activate after the first discount interval

**Test Cases:**
1. **Turbo-30 Schedule:**
   - Day 0-2: Should show no sale price (100% original)
   - Day 3+: Should show sale price (95% of original)

2. **Classic-60 Schedule:**
   - Day 0-6: Should show no sale price (100% original)
   - Day 7+: Should show sale price (90% of original)

**How to Test:**
1. Check the console logs for price calculation debugging
2. Look for messages like: `💰 Facebook Price Calculation:`
3. Verify `shouldUseSalePrice` is `false` for early days and `true` for later days

### **Scenario 2: Price Progression**

**What to Test:** Verify sale prices update at each discount interval

**Test Cases:**
- **Turbo-30:** 100% → 95% → 90% → 85% → 80% → 75% → 70% → 65% → 60%
- **Classic-60:** 100% → 90% → 80% → 75% → 70% → 65% → 60% → 55% → 50%

**How to Test:**
1. Monitor console logs for each discount stage
2. Check that main price always shows original listing price
3. Verify sale price changes at each interval

### **Scenario 3: Expiration Handling**

**What to Test:** Verify expired listings are not synced to Facebook

**Test Cases:**
- **Turbo-30:** Day 30+ listings should not sync
- **Classic-60:** Day 60+ listings should not sync

**How to Test:**
1. Look for console messages: `🚫 Listing [ID] has expired or is inactive - skipping Facebook sync`
2. Verify expired listings maintain reserve price instead of going to 0%
3. Check that Facebook API calls are not made for expired listings

### **Scenario 4: Facebook Catalog Sync**

**What to Test:** Verify proper Facebook API integration

**Test Cases:**
1. **Active Listings:** Should sync with sale prices
2. **Expired Listings:** Should not sync at all
3. **No Schedule:** Should work normally

**How to Test:**
1. Enable Facebook Shop for test listings
2. Monitor Facebook API requests in console logs
3. Check Facebook Commerce Manager for proper price display

## 📊 Expected Results

### **Console Log Examples**

**Sale Price Activation:**
```
💰 Facebook Price Calculation: {
  originalPrice: 1199.99,
  currentPrice: 1199.99,
  facebookPrice: 1199.99,
  facebookSalePrice: null,
  shouldUseSalePrice: false,
  scheduleType: 'Turbo-30',
  daysSinceCreation: 0,
  isActive: true
}
```

**Sale Price Active:**
```
💰 Facebook Price Calculation: {
  originalPrice: 1199.99,
  currentPrice: 1199.99,
  facebookPrice: 1199.99,
  facebookSalePrice: 1139.99,
  shouldUseSalePrice: true,
  scheduleType: 'Turbo-30',
  daysSinceCreation: 3,
  isActive: true
}
```

**Expired Listing:**
```
🚫 Listing ABC12345 has expired or is inactive - skipping Facebook sync
```

**Facebook API Request:**
```
🎥 Adding sale price to Facebook product: $1139.99
```

### **Facebook Catalog Behavior**

**Before First Discount (100% Original Price):**
- Main Price: Shows original listing price
- Sale Price: Not set (checkbox unchecked)
- Display: Shows original price without discount indication

**After First Discount (e.g., 95% for Turbo-30):**
- Main Price: Shows original listing price
- Sale Price: Shows discounted price (checkbox checked)
- Display: Shows original price crossed out with sale price highlighted

**At Expiration (Past Schedule Duration):**
- Main Price: Shows original listing price
- Sale Price: Not set (checkbox unchecked)
- Display: Shows original price (item effectively expired)
- **Not synced to Facebook**

## 🔍 Debugging Tips

### **Common Issues**

1. **"User not found" error:**
   - Make sure you replaced `'test-user-id'` with a real user ID
   - Run `get-user-id.js` to find valid user IDs

2. **Database connection errors:**
   - Check your `.env` file has correct database URL
   - Ensure database is running and accessible

3. **Prisma errors:**
   - Run `npx prisma generate` to ensure Prisma client is up to date
   - Check that all required database tables exist

4. **Facebook sync not working:**
   - Verify Facebook API credentials are set in `.env`
   - Check console logs for Facebook API errors
   - Ensure listings have `facebookShopEnabled: true`

### **Debug Commands**

```bash
# Check database connection
npx prisma db pull

# Generate Prisma client
npx prisma generate

# View database in Prisma Studio
npx prisma studio

# Check environment variables
echo $META_ACCESS_TOKEN
echo $META_CATALOG_ID
```

## 🧹 Cleanup

After testing, you may want to remove the test listings:

```sql
-- Remove test listings (be careful!)
DELETE FROM "PriceHistory" WHERE "listingId" IN (
  SELECT id FROM "Listing" WHERE "userId" = 'your-test-user-id'
);
DELETE FROM "Listing" WHERE "userId" = 'your-test-user-id';
```

## 📝 Test Checklist

- [ ] Seed script runs without errors
- [ ] All 16 test listings are created
- [ ] Sale prices activate after first discount interval
- [ ] Price progression works correctly for each schedule
- [ ] Expired listings are not synced to Facebook
- [ ] Console logs show comprehensive debugging information
- [ ] Facebook API requests include correct sale prices
- [ ] Reserve prices are maintained for expired listings

## 🎉 Success Criteria

The test is successful when:
1. **Sale prices activate** automatically after first discount interval
2. **Main prices remain constant** showing original listing price
3. **Expired listings are excluded** from Facebook sync
4. **Reserve prices are protected** instead of going to 0%
5. **Console logs provide clear debugging** information
6. **Facebook catalog shows** proper discount presentation

## 🆘 Getting Help

If you encounter issues:
1. Check console logs for error messages
2. Verify database connection and user ID
3. Ensure Facebook API credentials are correct
4. Check that all required fields are populated
5. Review the requirements document for implementation details

---

**Happy Testing! 🚀**

This comprehensive test setup will help you verify that the discount schedule sale price integration is working correctly across all scenarios.
