## Changelog

- Fixed incorrect email address throughout the application
  - Updated contact page email display from `support@treasurehunt.club` to `support@treasurehub.club`
  - Updated contact API route email recipient to use correct domain
  - Ensured consistency across all email references

- Fixed navigation links that only worked on landing page
  - Enhanced NavBar component with `handleNavigation` function
  - Added cross-page navigation support with section targeting
  - Implemented hash navigation in landing page for smooth scrolling
  - Navigation now works from any page to landing page sections

---

## Testing Instructions

1. Pull this branch.
2. Test email address fix:
   - Visit `/contact` page and verify email shows `support@treasurehub.club`
   - Submit contact form and verify email is sent to correct address
3. Test navigation fix:
   - From landing page: Click "How It Works", "Pricing", etc. - should scroll to sections
   - From contact page: Click "How It Works", "Pricing", etc. - should navigate to landing page and scroll to sections
   - From FAQ page: Click navigation links - should navigate to landing page and scroll to sections
   - Verify smooth scrolling behavior in all cases
4. Test hash navigation:
   - Navigate to `/#how-it-works` directly - should scroll to correct section
   - Navigate to `/#pricing` directly - should scroll to correct section 