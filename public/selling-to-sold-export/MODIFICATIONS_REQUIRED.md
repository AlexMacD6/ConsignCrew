# MODIFICATIONS REQUIRED

This document outlines the specific modifications you need to make to the exported files to adapt them for Selling To Sold.

## 🔴 CRITICAL MODIFICATIONS (Required)

### 1. `app/layout.tsx`

**Remove these imports:**
```typescript
// DELETE THESE LINES:
import { ModalProvider } from "./contexts/ModalContext";
import { CartProvider } from "./contexts/CartContext";
import MetaPixelScript from "./components/MetaPixelScript";
import "../app/lib/console-filter"; // Import console filter
```

**Remove these JSX wrappers:**
```typescript
// BEFORE:
<ErrorBoundary>
  <ModalProvider>
    <CartProvider>
      <NavBar />
      {children}
      <Footer />
    </CartProvider>
  </ModalProvider>
</ErrorBoundary>

// AFTER:
<ErrorBoundary>
  <NavBar />
  {children}
  <Footer />
</ErrorBoundary>
```

**Update metadata:**
```typescript
export const metadata: Metadata = {
  title: {
    default: "Selling To Sold - Partner with TreasureHub",
    template: "%s | Selling To Sold",
  },
  description: "Upload your items with Selling To Sold and list them on TreasureHub - Houston's premier curated marketplace.",
  metadataBase: new URL("https://sellingtosold.com"), // YOUR DOMAIN
  // ... update other metadata fields to reflect Selling To Sold
};
```

---

### 2. `app/components/NavBar.tsx`

**Remove these imports:**
```typescript
// DELETE THESE LINES:
import { authClient } from "../lib/auth-client";
import { useUserPermissions } from "../hooks/useUserPermissions";
import { useEarlyAuth } from "../hooks/useEarlyAuth";
import { useCart } from "../contexts/CartContext";
```

**Remove these hooks/state:**
```typescript
// DELETE THESE LINES:
useEarlyAuth();
const { data: session } = authClient.useSession();
const { canListItems } = useUserPermissions();
const { cartItemCount } = useCart();
```

**Simplify the navigation:**
```typescript
// REMOVE: Sign In/Sign Out logic, Cart icon, User dropdown
// KEEP: Logo, "How It Works" scroll link

// UPDATE links to point to TreasureHub:
<Link href="https://www.treasurehubclub.com">Visit TreasureHub</Link>
<Link href="https://www.treasurehubclub.com/login">Sign In to TreasureHub</Link>
```

---

### 3. `app/page.tsx`

**Update hero section headline (around line 293):**
```typescript
<h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold text-gray-900 leading-tight mb-4">
  Upload with{" "}
  <span className="text-treasure-500">Selling To Sold</span>
</h1>
```

**Update subheadline (around line 301):**
```typescript
<p className="text-xl sm:text-2xl lg:text-3xl text-gray-700 mb-8 leading-relaxed">
  Capture items on your phone. List them on TreasureHub. Get paid.
</p>
```

**Update CTA button text (around line 335):**
```typescript
{isSubmitting ? "Joining..." : "Download Selling To Sold"}
```

**Update email subscription source (around line 106):**
```typescript
body: JSON.stringify({ email, source: 'selling-to-sold-marketing' }),
```

---

## 🟡 OPTIONAL MODIFICATIONS (Recommended)

### 4. `app/components/HeroListingsCarousel.tsx`

Already configured to fetch from TreasureHub production API, but verify:

```typescript
// Line ~73 - Should be:
const response = await fetch('https://www.treasurehubclub.com/api/listings');
```

---

### 5. `app/components/EarlyAccessTracker.tsx`

Already configured, but verify:

```typescript
// Line ~37 - Should be:
const response = await fetch('https://www.treasurehubclub.com/api/early-access-stats');
```

---

### 6. Add Selling To Sold Section

Add a new section to `app/page.tsx` showcasing the Selling To Sold app:

```typescript
{/* Add this AFTER the BuyerPainPointsSection and BEFORE How It Works */}
<section className="py-20 px-4 bg-gradient-to-br from-gray-50 to-white">
  <div className="max-w-6xl mx-auto">
    <div className="text-center mb-12">
      <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
        How Selling To Sold Works
      </h2>
      <p className="text-xl text-gray-700 max-w-3xl mx-auto">
        Upload items from your phone and seamlessly list them on TreasureHub
      </p>
    </div>
    
    <div className="grid md:grid-cols-3 gap-8">
      <div className="bg-white rounded-xl p-8 shadow-lg text-center">
        <div className="text-5xl mb-4">📸</div>
        <h3 className="text-2xl font-bold text-gray-900 mb-4">Capture</h3>
        <p className="text-gray-700">
          Take photos and add dimensions, notes, and custom IDs right from your phone
        </p>
      </div>
      
      <div className="bg-white rounded-xl p-8 shadow-lg text-center">
        <div className="text-5xl mb-4">🤖</div>
        <h3 className="text-2xl font-bold text-gray-900 mb-4">AI Creates</h3>
        <p className="text-gray-700">
          TreasureHub's AI automatically generates detailed listings from your uploads
        </p>
      </div>
      
      <div className="bg-white rounded-xl p-8 shadow-lg text-center">
        <div className="text-5xl mb-4">💰</div>
        <h3 className="text-2xl font-bold text-gray-900 mb-4">Get Paid</h3>
        <p className="text-gray-700">
          Items are listed on TreasureHub and you get paid when they sell
        </p>
      </div>
    </div>
    
    {/* App Download Buttons */}
    <div className="flex justify-center gap-4 mt-12">
      <a href="YOUR_APP_STORE_LINK" className="btn btn-primary btn-lg">
        📱 Download on App Store
      </a>
      <a href="YOUR_PLAY_STORE_LINK" className="btn btn-primary-outline btn-lg">
        📱 Get it on Google Play
      </a>
    </div>
  </div>
</section>
```

---

## 🟢 FILES THAT NEED NO CHANGES

These files work as-is:
- ✅ `app/globals.css`
- ✅ `config/tailwind.config.ts`
- ✅ `app/components/ThreeScene.tsx`
- ✅ `app/components/ScrollSection.tsx`
- ✅ `app/components/BuyerPainPointsSection.tsx`
- ✅ `app/components/TreasureMapCards.tsx`
- ✅ `app/components/Roadmap.tsx`
- ✅ `app/components/PriceSlider.tsx`
- ✅ `app/components/ServiceFeeBreakdown.tsx`
- ✅ `app/lib/price-calculator.ts`
- ✅ `app/lib/condition-utils.ts`
- ✅ All files in `app/components/ui/`
- ✅ All images in `public/`

---

## 📋 Modification Checklist

Use this checklist to ensure you've made all necessary changes:

- [ ] Updated `app/layout.tsx` metadata
- [ ] Removed ModalProvider and CartProvider from `app/layout.tsx`
- [ ] Removed MetaPixelScript from `app/layout.tsx`
- [ ] Removed auth imports from `app/components/NavBar.tsx`
- [ ] Removed auth hooks from `app/components/NavBar.tsx`
- [ ] Simplified navigation in `app/components/NavBar.tsx`
- [ ] Updated hero headline in `app/page.tsx`
- [ ] Updated hero subheadline in `app/page.tsx`
- [ ] Updated CTA button text in `app/page.tsx`
- [ ] Updated email subscription source in `app/page.tsx`
- [ ] Verified API endpoints point to TreasureHub production
- [ ] Added Selling To Sold app section (optional)
- [ ] Added app download buttons (optional)
- [ ] Created proxy route for CORS if needed (optional)
- [ ] Updated footer links in `app/components/Footer.tsx` (optional)
- [ ] Tested the page locally with `npm run dev`
- [ ] Verified no console errors
- [ ] Verified all images load correctly
- [ ] Verified carousel shows TreasureHub listings
- [ ] Verified email subscription works

---

## 🚀 Quick Start After Modifications

```bash
# 1. Install dependencies
npm install

# 2. Run development server
npm run dev

# 3. Open browser
# Visit http://localhost:3000

# 4. Test everything:
# - Check hero section shows correct branding
# - Verify carousel loads TreasureHub listings
# - Test email subscription
# - Check all images load
# - Verify animations work
# - Test on mobile
```

---

## 🆘 Common Issues After Modifications

### Issue: "Cannot find module '../contexts/CartContext'"

**Solution:** You forgot to remove the CartProvider import from `app/layout.tsx`. Delete the import line.

### Issue: "Cannot find module '../lib/auth-client'"

**Solution:** You forgot to remove the auth imports from `app/components/NavBar.tsx`. Delete all auth-related imports.

### Issue: CORS error when fetching listings

**Solution:** Create a proxy route (see README.md) or request TreasureHub to whitelist your domain.

### Issue: Images not loading

**Solution:** Ensure all images from the `public/` folder are in your project's `public/` directory at the root level.

---

**Ready to deploy?** After making all modifications and testing locally, you can deploy to Vercel, Netlify, or any hosting platform that supports Next.js.

