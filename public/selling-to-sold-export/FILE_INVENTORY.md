# FILE INVENTORY

Complete list of all files included in this export package.

## 📂 Directory Structure

```
selling-to-sold-export/
│
├── 📄 README.md                          # Main documentation with setup instructions
├── 📄 MODIFICATIONS_REQUIRED.md          # Detailed modification guide
├── 📄 FILE_INVENTORY.md                  # This file - complete file list
├── 📄 package.json                       # NPM dependencies
│
├── 📁 app/
│   ├── 📄 page.tsx                       # Main landing page (820 lines)
│   ├── 📄 layout.tsx                     # Root layout wrapper (260 lines)
│   ├── 📄 globals.css                    # Global styles, animations, colors (816 lines)
│   │
│   ├── 📁 components/                    # React components
│   │   ├── 📄 ThreeScene.tsx             # 3D animated background (415 lines)
│   │   ├── 📄 HeroListingsCarousel.tsx   # Live listings carousel (509 lines)
│   │   ├── 📄 EarlyAccessTracker.tsx     # Early access counter (125 lines)
│   │   ├── 📄 ScrollSection.tsx          # Scroll animations (74 lines)
│   │   ├── 📄 BuyerPainPointsSection.tsx # Interactive pain points (75 lines)
│   │   ├── 📄 TreasureMapCards.tsx       # Flippable cards with 3D sand (478 lines)
│   │   ├── 📄 Roadmap.tsx                # Launch timeline (157 lines)
│   │   ├── 📄 PriceSlider.tsx            # Pricing calculator (198 lines)
│   │   ├── 📄 ServiceFeeBreakdown.tsx    # Fee breakdown chart
│   │   ├── 📄 NavBar.tsx                 # Navigation bar (384 lines)
│   │   ├── 📄 Footer.tsx                 # Footer with trust badges (278 lines)
│   │   │
│   │   └── 📁 ui/                        # Shadcn UI components
│   │       ├── 📄 badge.tsx
│   │       ├── 📄 button.tsx
│   │       ├── 📄 card.tsx
│   │       ├── 📄 input.tsx
│   │       ├── 📄 navigation-menu.tsx
│   │       ├── 📄 popover.tsx
│   │       ├── 📄 select.tsx
│   │       └── 📄 tabs.tsx
│   │
│   └── 📁 lib/                           # Utility functions
│       ├── 📄 price-calculator.ts        # Calculate discounted prices
│       ├── 📄 condition-utils.ts         # Standardize item conditions
│       └── 📄 meta-pixel-client.ts       # Meta Pixel tracking (optional)
│
├── 📁 config/
│   └── 📄 tailwind.config.ts             # Tailwind configuration (104 lines)
│
└── 📁 public/                            # Static assets
    ├── 🖼️ TreasureHub - Logo.png
    ├── 🖼️ TreasureHub - Banner Black.png
    ├── 🖼️ TreasureHub - Favicon Black.png
    ├── 🖼️ built_in_houston_top_right.png
    └── 🖼️ treasure clue.png
```

---

## 📊 File Statistics

| Category | Files | Total Lines |
|----------|-------|-------------|
| Main Pages | 2 | ~1,080 |
| Components | 11 | ~2,693 |
| UI Components | 8 | ~500 |
| Utilities | 3 | ~300 |
| Config | 2 | ~920 |
| Documentation | 3 | N/A |
| Images | 5 | N/A |
| **TOTAL** | **34 files** | **~5,493 lines** |

---

## 🔍 Detailed File Descriptions

### Core Application Files

#### `app/page.tsx` (820 lines)
**Purpose:** Main landing page component  
**Features:**
- Hero section with listings carousel
- Email subscription form
- Early access tracker
- Buyer pain points section
- "How It Works" flow chart
- Treasure map cards
- Roadmap section
- Final CTA section
- SEO structured data

**Dependencies:**
- React, Next.js
- ScrollSection, HeroListingsCarousel, EarlyAccessTracker
- BuyerPainPointsSection, TreasureMapCards, Roadmap, PriceSlider
- ThreeScene (3D background)

---

#### `app/layout.tsx` (260 lines)
**Purpose:** Root layout wrapper for the entire app  
**Features:**
- Metadata configuration (SEO, Open Graph, Twitter Cards)
- Font imports (Poppins)
- Google Analytics integration
- Meta Pixel integration
- JSON-LD structured data
- NavBar and Footer

**Dependencies:**
- Next.js metadata API
- NavBar, Footer, ErrorBoundary components

---

#### `app/globals.css` (816 lines)
**Purpose:** Global styles, animations, and design system  
**Features:**
- Poppins font import
- Treasure brand colors (CSS variables)
- Scroll animations (fadeInUp, fadeInLeft, fadeInRight, scaleIn)
- Button system (primary, secondary, success, danger, ghost)
- 3D card flip styles
- Custom scrollbar
- Leaflet map styles (for Treasure Hunt)
- Print styles (for pick tickets)
- Responsive design utilities

**Key Colors:**
- Primary Gold: `#D4AF3D`
- Secondary Gold: `#825E08`
- Dark Gold: `#5D4A00`

---

### Component Files

#### `app/components/ThreeScene.tsx` (415 lines)
**Purpose:** 3D animated background with floating treasure chests  
**Features:**
- WebGL support detection
- Animated floating boxes/chests
- Stars field
- Optimized performance
- Fallback for unsupported devices

**Dependencies:**
- Three.js, React Three Fiber, React Three Drei

---

#### `app/components/HeroListingsCarousel.tsx` (509 lines)
**Purpose:** Display live TreasureHub listings in a carousel  
**Features:**
- Fetches from TreasureHub production API
- Auto-play with manual controls
- Displays 6 random listings
- Shows discounted prices
- Image fallbacks
- Responsive design
- Links to TreasureHub listing pages

**API Endpoint:** `https://www.treasurehubclub.com/api/listings`

**Dependencies:**
- React, Lucide React icons
- price-calculator, condition-utils

---

#### `app/components/EarlyAccessTracker.tsx` (125 lines)
**Purpose:** Display remaining early access spots  
**Features:**
- Fetches from TreasureHub API
- Auto-refreshes on signup
- Animated counter
- Error handling

**API Endpoint:** `https://www.treasurehubclub.com/api/early-access-stats`

**Dependencies:**
- React, Framer Motion

---

#### `app/components/ScrollSection.tsx` (74 lines)
**Purpose:** Wrapper component for scroll-triggered animations  
**Features:**
- Intersection Observer API
- Multiple animation types (fadeInUp, fadeInLeft, fadeInRight, scaleIn)
- Configurable threshold and delay
- Stagger support for grid items
- One-time animation (doesn't repeat)

**Dependencies:**
- React, react-intersection-observer

---

#### `app/components/BuyerPainPointsSection.tsx` (75 lines)
**Purpose:** Interactive section showing buyer pain points  
**Features:**
- 8 clickable pain point cards
- Big X overlay on click
- Animated transitions
- Black background with red cards
- Responsive grid layout

**Pain Points:**
- Seller never responds
- Item already sold
- Won't accept my offer
- Can't meet when I'm free
- Photos don't show damage
- Price keeps changing
- Meeting location is sketchy
- Item not as described

---

#### `app/components/TreasureMapCards.tsx` (478 lines)
**Purpose:** Flippable cards with treasure map design and 3D sand animation  
**Features:**
- 3 flippable cards (Vetted Quality, Safe Transactions, Faster Buying)
- 3D sand waves with WebGL shaders
- Wind and tide effects
- Scroll-based animation
- Treasure map background image

**Dependencies:**
- React, Framer Motion
- Three.js, React Three Fiber, React Three Drei

---

#### `app/components/Roadmap.tsx` (157 lines)
**Purpose:** Display TreasureHub's launch timeline  
**Features:**
- 3 phases (Private Beta, Public Launch, Scale & Expand)
- Animated timeline with connecting line
- Icon for each phase
- Hover effects
- Responsive design

**Timeline:**
- August 2025: Private Beta
- September 2025: Public Launch
- November 2025: Scale & Expand

---

#### `app/components/PriceSlider.tsx` (198 lines)
**Purpose:** Interactive pricing calculator  
**Features:**
- Drag slider to adjust item price ($50-$550)
- Calculates seller's cut and service fee
- 3 pricing tiers (50%, 40%, 35% fees)
- Visual fee breakdown chart
- Animated transitions

**Dependencies:**
- React, ServiceFeeBreakdown component

---

#### `app/components/NavBar.tsx` (384 lines)
**Purpose:** Navigation bar with links and dropdowns  
**Features:**
- Logo
- Navigation links (How It Works, Why TreasureHub, Roadmap)
- Mobile menu
- Smooth scroll to sections
- Responsive design

**⚠️ Requires Modification:** Remove authentication logic for Selling To Sold

**Dependencies:**
- React, Next.js Link
- Lucide React icons
- UI components (Button, Popover, NavigationMenu)

---

#### `app/components/Footer.tsx` (278 lines)
**Purpose:** Footer with trust badges, links, and legal info  
**Features:**
- Trust seals (AWS, SSL, Neon, Stripe, Better Auth)
- Social media links
- Navigation links
- Collapsible policies section
- Copyright info

**Dependencies:**
- React, Next.js Link
- Lucide React icons

---

### Utility Files

#### `app/lib/price-calculator.ts`
**Purpose:** Calculate discounted prices based on discount schedules  
**Features:**
- Calculates time-based discounts
- Respects reserve prices
- Returns display price, original price, and discount status

---

#### `app/lib/condition-utils.ts`
**Purpose:** Standardize item condition labels  
**Features:**
- Maps Facebook condition codes to readable labels
- Fallback to custom conditions

---

#### `app/lib/meta-pixel-client.ts`
**Purpose:** Client-side Meta Pixel event tracking  
**Features:**
- Track CompleteRegistration events
- Track custom events
- Error handling

---

### UI Components (`app/components/ui/`)

#### `badge.tsx`
**Purpose:** Badge component for labels and tags  
**Variants:** default, secondary, destructive, outline

#### `button.tsx`
**Purpose:** Button component with variants  
**Variants:** default, destructive, outline, secondary, ghost, link

#### `card.tsx`
**Purpose:** Card container components  
**Components:** Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent

#### `input.tsx`
**Purpose:** Input field component  
**Features:** Styled input with focus states

#### `navigation-menu.tsx`
**Purpose:** Navigation menu components  
**Components:** NavigationMenu, NavigationMenuItem, NavigationMenuLink

#### `popover.tsx`
**Purpose:** Popover/dropdown components  
**Components:** Popover, PopoverTrigger, PopoverContent

#### `select.tsx`
**Purpose:** Select dropdown components  
**Components:** Select, SelectGroup, SelectValue, SelectTrigger, SelectContent, SelectLabel, SelectItem

#### `tabs.tsx`
**Purpose:** Tab navigation components  
**Components:** Tabs, TabsList, TabsTrigger, TabsContent

---

### Configuration Files

#### `config/tailwind.config.ts` (104 lines)
**Purpose:** Tailwind CSS configuration  
**Features:**
- Treasure color palette
- Custom animations (scroll)
- Shadcn UI theme variables
- Border radius utilities
- Color variables for CSS

---

#### `package.json`
**Purpose:** NPM dependencies and scripts  
**Key Dependencies:**
- Next.js 15.4.4
- React 19.1.0
- Three.js 0.178.0
- Framer Motion 12.23.9
- Tailwind CSS 3.4.1
- TypeScript 5.8.3

**Scripts:**
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

---

### Public Assets

#### Images

1. **`TreasureHub - Logo.png`**
   - Main TreasureHub logo
   - Used in NavBar and metadata

2. **`TreasureHub - Banner Black.png`**
   - Social media banner
   - Used in Open Graph and Twitter Card metadata
   - Dimensions: 1200x630px

3. **`TreasureHub - Favicon Black.png`**
   - Favicon for browser tabs
   - Sizes: 16x16, 32x32

4. **`built_in_houston_top_right.png`**
   - Houston stamp badge
   - Used in hero section
   - Position: Top right corner

5. **`treasure clue.png`**
   - Treasure map background texture
   - Used in TreasureMapCards (flippable cards)
   - Style: Aged paper with decorative borders

---

## 🔗 File Dependencies Graph

```
app/page.tsx
├── app/components/ThreeScene.tsx
│   └── three, @react-three/fiber, @react-three/drei
├── app/components/HeroListingsCarousel.tsx
│   ├── app/lib/price-calculator.ts
│   └── app/lib/condition-utils.ts
├── app/components/EarlyAccessTracker.tsx
│   └── framer-motion
├── app/components/ScrollSection.tsx
│   └── react-intersection-observer
├── app/components/BuyerPainPointsSection.tsx
├── app/components/TreasureMapCards.tsx
│   └── three, @react-three/fiber, framer-motion
├── app/components/Roadmap.tsx
│   └── framer-motion
└── app/components/PriceSlider.tsx
    └── app/components/ServiceFeeBreakdown.tsx

app/layout.tsx
├── app/components/NavBar.tsx
│   └── app/components/ui/*
└── app/components/Footer.tsx

app/globals.css
└── tailwind.config.ts
```

---

## 📝 Notes

### Files That Work As-Is (No Modifications)
✅ All files in `app/components/` except NavBar.tsx  
✅ All files in `app/components/ui/`  
✅ All files in `app/lib/`  
✅ `app/globals.css`  
✅ `config/tailwind.config.ts`  
✅ All images in `public/`

### Files That Require Modifications
⚠️ `app/layout.tsx` - Remove contexts, update metadata  
⚠️ `app/components/NavBar.tsx` - Remove auth, simplify links  
⚠️ `app/page.tsx` - Update branding and hero text

---

## 🎯 What's Included vs. What's Not

### ✅ Included
- Complete landing page
- All visual components
- 3D animations
- Interactive elements
- Styling and design system
- Image assets
- API integration examples
- Documentation

### ❌ Not Included (These are TreasureHub-specific)
- Authentication system (Better Auth)
- Database models (Prisma)
- Backend API routes
- Cart functionality
- Checkout flow
- Admin dashboard
- User profiles
- Listing management
- Photo upload system
- Video processing
- Payment processing (Stripe)
- Email services (AWS SES, Mailchimp)

---

## 💾 Export Size

Approximate sizes:
- **Source Code:** ~5,500 lines across 34 files
- **Dependencies:** ~300MB (after `npm install`)
- **Images:** ~5MB total
- **Documentation:** ~15KB

**Total Export Size:** ~305MB (with node_modules)  
**Compressed Size:** ~10MB (without node_modules)

---

**Last Updated:** November 5, 2025  
**TreasureHub Version:** Production (treasurehubclub.com)  
**Export Version:** 1.0

