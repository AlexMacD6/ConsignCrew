## Changelog

- Updated pricing strategy across all tiers
  - Under $100: 40% → 50% fee
  - $100-$500: 35% → 40% fee
  - Over $500: 30% → 35% fee
- Updated service fee breakdown percentages for all components
  - Logistics: 14%→20%, 9%→11%, 5% (unchanged)
  - Prep & Quality: 3%→5%, 4%→5%, 5%→7%
  - Payment & Protection: 7%, 6%, 6% (unchanged)
  - Platform Ops & Support: 6%, 6%, 5% (unchanged)
  - TreasureHub Re-Investment: 10%→12%, 10%→12%, 9%→12%
- Updated component descriptions to be more detailed and accurate
  - Logistics: "Pickup, first/last-mile shipping, 14-day storage"
  - Prep & Quality: "Cleaning, pro photos, authentication"
  - Payment & Protection: "Card/ACH fees, fraud screening, damage/return pool"
  - Platform Ops & Support: "Servers, engineers, 30-sec help line, compliance, marketing"
  - TreasureHub Re-Investment: "Platform development"

---

## Testing Instructions

1. Pull this branch and start the development server with `npm run dev`
2. Navigate to the landing page and locate the pricing slider
3. Test the price slider at different value ranges:
   - Set price to $75 (should show 50% fee)
   - Set price to $300 (should show 40% fee)
   - Set price to $750 (should show 35% fee)
4. Hover over the service fee breakdown chart to verify:
   - Updated percentages are displayed correctly
   - New descriptions appear in tooltips
   - Total percentages add up to the correct fee percentage for each tier
5. Verify that the seller's cut calculations are accurate for each tier
6. Test the visual appearance of the updated chart with new percentages 