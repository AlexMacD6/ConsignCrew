# 🚀 QUICK START GUIDE

**Get the Selling To Sold marketing page running in 5 minutes!**

---

## ⚡ TL;DR (Too Long; Didn't Read)

```bash
# 1. Copy files to your project
cp -r selling-to-sold-export/* /path/to/your/project/

# 2. Install dependencies
cd /path/to/your/project
npm install

# 3. Move config file
mv config/tailwind.config.ts ./tailwind.config.ts

# 4. Run it
npm run dev
```

Then make the required modifications (see below).

---

## 📋 5-Minute Setup

### Step 1: Copy Files (30 seconds)
Copy the entire `selling-to-sold-export` folder contents to your Selling To Sold project.

### Step 2: Install (2 minutes)
```bash
npm install
```

### Step 3: Move Config (10 seconds)
```bash
mv config/tailwind.config.ts ./tailwind.config.ts
```

### Step 4: Required Modifications (2 minutes)

#### A. Edit `app/layout.tsx`
**Remove these lines (~line 8-12):**
```typescript
import { ModalProvider } from "./contexts/ModalContext";
import { CartProvider } from "./contexts/CartContext";
import MetaPixelScript from "./components/MetaPixelScript";
import "../app/lib/console-filter";
```

**Remove these JSX wrappers (~line 247-254):**
```typescript
// DELETE:
<ModalProvider>
  <CartProvider>
    ...
  </CartProvider>
</ModalProvider>

// KEEP ONLY:
<ErrorBoundary>
  <NavBar />
  {children}
  <Footer />
</ErrorBoundary>
```

#### B. Edit `app/components/NavBar.tsx`
**Remove these imports (~line 4-6, 15-17):**
```typescript
import { authClient } from "../lib/auth-client";
import { useUserPermissions } from "../hooks/useUserPermissions";
import { useEarlyAuth } from "../hooks/useEarlyAuth";
import { useCart } from "../contexts/CartContext";
```

**Remove these hooks (~line 26-30):**
```typescript
useEarlyAuth();
const { data: session } = authClient.useSession();
const { canListItems } = useUserPermissions();
const { cartItemCount } = useCart();
```

### Step 5: Run It! (5 seconds)
```bash
npm run dev
```

Open `http://localhost:3000` 🎉

---

## 🎨 Quick Customization

### Change Hero Text
**File:** `app/page.tsx` (~line 293)
```typescript
<h1>
  Upload with{" "}
  <span className="text-treasure-500">Selling To Sold</span>
</h1>
```

### Change CTA Button
**File:** `app/page.tsx` (~line 335)
```typescript
{isSubmitting ? "Joining..." : "Download Selling To Sold"}
```

### Update API Source Tag
**File:** `app/page.tsx` (~line 106)
```typescript
body: JSON.stringify({ email, source: 'selling-to-sold-marketing' }),
```

---

## 🐛 Common Issues

### Error: "Cannot find module '../contexts/CartContext'"
**Fix:** You didn't remove all context imports. Re-check `app/layout.tsx` lines 8-12.

### Error: "Cannot find module '../lib/auth-client'"
**Fix:** You didn't remove auth imports. Re-check `app/components/NavBar.tsx` lines 4-6.

### CORS Error When Fetching Listings
**Fix:** Create a proxy route or request TreasureHub to whitelist your domain.

**Proxy Route Example** (`app/api/proxy/route.ts`):
```typescript
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const endpoint = searchParams.get('endpoint') || '/api/listings';
  
  const response = await fetch(`https://www.treasurehubclub.com${endpoint}`);
  const data = await response.json();
  
  return NextResponse.json(data);
}
```

Then update components to use `/api/proxy?endpoint=/api/listings`

### Images Not Loading
**Fix:** Ensure all files from `public/` are in your project's root-level `public/` directory.

---

## 📚 Full Documentation

- **README.md** - Complete setup guide with detailed instructions
- **MODIFICATIONS_REQUIRED.md** - Detailed modification checklist
- **FILE_INVENTORY.md** - Complete file listing and descriptions

---

## ✅ Final Checklist

Before deploying, verify:
- [ ] Page loads without errors
- [ ] Hero carousel shows TreasureHub listings
- [ ] 3D background renders
- [ ] All images load
- [ ] Email subscription works
- [ ] Mobile responsive
- [ ] No console errors
- [ ] Updated branding for Selling To Sold

---

## 🚀 Deploy

Once everything works locally:

### Vercel (Recommended)
```bash
npm install -g vercel
vercel
```

### Netlify
```bash
npm run build
# Upload .next folder to Netlify
```

### Other Platforms
Build the app and deploy the `.next` folder:
```bash
npm run build
```

---

## 🆘 Need Help?

1. Check `README.md` for detailed instructions
2. Check `MODIFICATIONS_REQUIRED.md` for step-by-step modifications
3. Check `FILE_INVENTORY.md` to understand what each file does
4. Review the TreasureHub live site: https://www.treasurehubclub.com

---

**Built by:** TreasureHub Team  
**For:** Selling To Sold Marketing Integration  
**Version:** 1.0  
**Date:** November 5, 2025

