# TreasureHub Landing Page Export for Selling To Sold

This folder contains all the files needed to create a marketing landing page for the Selling To Sold app that showcases the TreasureHub integration.

## 📁 Folder Structure

```
selling-to-sold-export/
├── app/
│   ├── page.tsx                          # Main landing page
│   ├── layout.tsx                        # Root layout wrapper
│   ├── globals.css                       # Global styles (animations, treasure colors)
│   ├── components/
│   │   ├── ThreeScene.tsx                # 3D animated background
│   │   ├── HeroListingsCarousel.tsx      # Live TreasureHub listings carousel
│   │   ├── EarlyAccessTracker.tsx        # Early access counter
│   │   ├── ScrollSection.tsx             # Scroll-triggered animations
│   │   ├── BuyerPainPointsSection.tsx    # Interactive pain points
│   │   ├── TreasureMapCards.tsx          # Flippable treasure cards with 3D sand
│   │   ├── Roadmap.tsx                   # Launch timeline
│   │   ├── PriceSlider.tsx               # Interactive pricing calculator
│   │   ├── ServiceFeeBreakdown.tsx       # Fee breakdown chart
│   │   ├── NavBar.tsx                    # Navigation bar
│   │   ├── Footer.tsx                    # Footer with trust badges
│   │   └── ui/                           # Shadcn UI components
│   │       ├── button.tsx
│   │       ├── popover.tsx
│   │       ├── navigation-menu.tsx
│   │       └── ...other UI components
│   └── lib/
│       ├── price-calculator.ts           # Calculate discounted prices
│       ├── condition-utils.ts            # Standardize item conditions
│       └── meta-pixel-client.ts          # Meta Pixel tracking (optional)
├── config/
│   └── tailwind.config.ts                # Tailwind configuration with treasure colors
├── public/
│   ├── TreasureHub - Logo.png
│   ├── TreasureHub - Banner Black.png
│   ├── TreasureHub - Favicon Black.png
│   ├── built_in_houston_top_right.png
│   └── treasure clue.png
├── package.json                          # Dependencies
└── README.md                             # This file
```

## 🚀 Quick Start

### 1. Copy Files to Your Selling To Sold Project

```bash
# Copy the entire selling-to-sold-export folder to your Selling To Sold project root
cp -r selling-to-sold-export/* /path/to/your/selling-to-sold-project/
```

### 2. Install Dependencies

```bash
cd /path/to/your/selling-to-sold-project
npm install
```

### 3. Configure Tailwind CSS

Move the `tailwind.config.ts` from the `config/` folder to your project root:

```bash
mv config/tailwind.config.ts ./tailwind.config.ts
```

Create a `postcss.config.js` if you don't have one:

```javascript
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
```

### 4. Configure Next.js

Create a `next.config.js` if you don't have one:

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['www.treasurehubclub.com', 'treasurehub.club'],
  },
}

module.exports = nextConfig
```

Create a `tsconfig.json` if you don't have one:

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "forceConsistentCasingInFileNames": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [
      {
        "name": "next"
      }
    ],
    "paths": {
      "@/*": ["./*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

### 5. Update API Endpoints

The components are already configured to fetch from TreasureHub's production API, but you should verify these endpoints:

**`app/components/HeroListingsCarousel.tsx` (line ~73):**
```typescript
const response = await fetch('https://www.treasurehubclub.com/api/listings');
```

**`app/components/EarlyAccessTracker.tsx` (line ~37):**
```typescript
const response = await fetch('https://www.treasurehubclub.com/api/early-access-stats');
```

**`app/page.tsx` (line ~101):**
```typescript
const response = await fetch('https://www.treasurehubclub.com/api/subscribe', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email, source: 'selling-to-sold-marketing' })
});
```

> **Note**: If TreasureHub's API has CORS restrictions, you may need to create proxy routes in your Selling To Sold backend or request TreasureHub to whitelist your domain.

### 6. Customize for Selling To Sold

#### Update Branding

**In `app/page.tsx`:**
- Line ~293-297: Update hero headline
  ```tsx
  <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold text-gray-900 leading-tight mb-4">
    Upload with{" "}
    <span className="text-treasure-500">Selling To Sold</span>
  </h1>
  ```

- Line ~300-304: Update subheadline
  ```tsx
  <p className="text-xl sm:text-2xl lg:text-3xl text-gray-700 mb-8 leading-relaxed">
    Capture items on your phone. List them on TreasureHub. Get paid.
  </p>
  ```

- Line ~335: Update button text
  ```tsx
  {isSubmitting ? "Joining..." : "Download Selling To Sold"}
  ```

#### Simplify NavBar

**In `app/components/NavBar.tsx`:**

Remove authentication-related imports and hooks:
```typescript
// REMOVE THESE:
import { authClient } from "../lib/auth-client";
import { useUserPermissions } from "../hooks/useUserPermissions";
import { useEarlyAuth } from "../hooks/useEarlyAuth";
import { useCart } from "../contexts/CartContext";

// REMOVE THESE:
useEarlyAuth();
const { data: session } = authClient.useSession();
const { canListItems } = useUserPermissions();
const { cartItemCount } = useCart();
```

Update navigation links to point to TreasureHub:
```typescript
<Link href="https://www.treasurehubclub.com">Home</Link>
<Link href="https://www.treasurehubclub.com/login">Sign In</Link>
```

#### Simplify Layout

**In `app/layout.tsx`:**

Remove contexts and authentication:
```typescript
// REMOVE:
import { CartProvider } from "./contexts/CartContext";
import { ModalProvider } from "./contexts/ModalContext";
import MetaPixelScript from "./components/MetaPixelScript";

// REMOVE from JSX:
<ModalProvider>
  <CartProvider>
    {/* ... */}
  </CartProvider>
</ModalProvider>
```

Update metadata:
```typescript
export const metadata: Metadata = {
  title: "Selling To Sold - Partner with TreasureHub",
  description: "Upload your items with Selling To Sold and list them on TreasureHub.",
  metadataBase: new URL("https://sellingtosold.com"), // Your domain
  // ... update other metadata fields
};
```

### 7. Run the Development Server

```bash
npm run dev
```

Visit `http://localhost:3000` to see your marketing page!

## 🎨 Brand Colors

The treasure color palette is already configured in `tailwind.config.ts`:

```typescript
treasure: {
  50: '#fefce8',
  100: '#fef9c3',
  200: '#fef08a',
  300: '#fde047',
  400: '#facc15',
  500: '#d4af3d', // Main brand color (gold)
  600: '#825e08', // Secondary brand color (dark gold)
  700: '#5d4a00', // Dark brand color
  800: '#3d2f00',
  900: '#1f1800',
}
```

Use these in your components:
- `text-treasure-500` - Gold text
- `bg-treasure-500` - Gold background
- `border-treasure-500` - Gold border

## 🔧 Troubleshooting

### CORS Issues

If you get CORS errors when fetching from TreasureHub:

**Option 1: Create a Proxy Route**

Create `app/api/treasurehub-proxy/route.ts`:
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

Then update your components:
```typescript
// Instead of:
fetch('https://www.treasurehubclub.com/api/listings')

// Use:
fetch('/api/treasurehub-proxy?endpoint=/api/listings')
```

**Option 2: Request Whitelisting**

Contact TreasureHub to whitelist your domain in their CORS policy.

### Missing Dependencies

If you encounter missing dependencies:

```bash
npm install @radix-ui/react-popover @radix-ui/react-slot @react-three/drei @react-three/fiber three
```

### Build Errors

If you get build errors related to Three.js:

Add this to `next.config.js`:
```javascript
const nextConfig = {
  webpack: (config) => {
    config.externals.push({
      'three': 'three'
    });
    return config;
  },
}
```

## 📦 Optional Enhancements

### Add Selling To Sold App Screenshots

Create a new section in `app/page.tsx`:

```tsx
<section className="py-20 px-4 bg-white">
  <div className="max-w-6xl mx-auto">
    <h2 className="text-4xl font-bold text-center mb-12">
      Upload with Selling To Sold
    </h2>
    <div className="grid md:grid-cols-3 gap-8">
      <div className="text-center">
        <img src="/app-screenshot-1.png" alt="Capture items" className="rounded-xl shadow-lg mb-4" />
        <h3 className="text-xl font-bold mb-2">1. Capture Items</h3>
        <p>Take photos and add dimensions on your phone</p>
      </div>
      {/* Add more screenshots */}
    </div>
  </div>
</section>
```

### Add Download Links

Add app store buttons to your hero section:

```tsx
<div className="flex gap-4">
  <a href="https://apps.apple.com/..." className="btn btn-primary">
    Download on App Store
  </a>
  <a href="https://play.google.com/..." className="btn btn-primary-outline">
    Get it on Google Play
  </a>
</div>
```

## 📝 Notes

- **Authentication**: All authentication-related code has been removed. The page is fully public.
- **API Calls**: All data is fetched from TreasureHub's production API at `https://www.treasurehubclub.com`.
- **Images**: All TreasureHub images are included in the `public/` folder.
- **Styling**: All custom styles and animations are preserved in `globals.css`.
- **Components**: All components are self-contained and ready to use.

## 🆘 Support

If you need help implementing this:

1. Check the original TreasureHub implementation at `https://www.treasurehubclub.com`
2. Review the component source code for implementation details
3. Check Next.js documentation: https://nextjs.org/docs
4. Check Tailwind CSS documentation: https://tailwindcss.com/docs

## 📄 License

This code is exported from TreasureHub for use in the Selling To Sold marketing page. Ensure you have proper authorization to use this code.

---

**Built with:**
- Next.js 15.4.4
- React 19.1.0
- Three.js (React Three Fiber)
- Framer Motion
- Tailwind CSS
- TypeScript

