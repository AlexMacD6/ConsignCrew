## Changelog

- Added service fee breakdown chart to the landing page pricing section
  - Created new ServiceFeeBreakdown component with vertical stacked bar chart visualization
  - Implemented dynamic fee breakdown based on pricing tiers:
    - Under $100: 40% total fee with detailed component breakdown
    - $100-$500: 35% total fee with detailed component breakdown  
    - Over $500: 30% total fee with detailed component breakdown
  - Added color-coded vertical bar chart with hover interactions:
    - Logistics (pickup, delivery, temporary storage)
    - Prep & Quality (cleaning, photos, authentication)
    - Payment & Protection (card fees, fraud, damage pool)
    - Platform Ops & Support (servers, help line, compliance, marketing)
    - TreasureHub Re-invest / Profit (platform development and profit)
  - Integrated directly into the Service Fee box for better UX
  - Added hover tooltips showing component details and dollar amounts
  - Made chart responsive and mobile-friendly
  - Added smooth transitions when price changes

---

## Testing Instructions

1. Pull this branch.
2. Run `npm install` to ensure all dependencies are up to date.
3. Start the application with `npm run dev`.
4. Navigate to the landing page and scroll to the pricing section.
5. Test the price slider functionality:
   - Move slider to different price ranges ($50-$99, $100-$499, $500+)
   - Verify the vertical bar chart updates dynamically
   - Check that percentages and dollar amounts are accurate for each tier
   - Confirm the chart is integrated within the Service Fee box
6. Test hover interactions:
   - Hover over different sections of the vertical bar chart
   - Verify tooltips appear with component details and dollar amounts
   - Check that tooltips disappear when mouse leaves the chart
7. Test responsive design:
   - Resize browser window to mobile and tablet sizes
   - Verify chart and tooltips remain readable and properly formatted
8. Verify the total service fee percentage matches the breakdown components
9. Check that hover effects and transitions work smoothly 