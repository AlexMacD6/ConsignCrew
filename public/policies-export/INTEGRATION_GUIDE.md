# Quick Integration Guide - Policy Pages

## ⚡ 5-Minute Setup

### Step 1: Copy Files (2 min)
```bash
xcopy /E /I public\policies-export\app\policies C:\path\to\SellingToSold\app\policies
```

### Step 2: Install Dependencies (1 min)
```bash
npm install framer-motion
```

### Step 3: Customize (15-30 min)

**Find and Replace:**
- `TreasureHub` → `Selling To Sold`
- `support@treasurehub.club` → `your@email.com`
- `(713) 899-3656` → `Your phone`
- `Alex MacDonald` → `Your name`
- `July 13, 2025` → Current date

### Step 4: Add Footer Links (2 min)
```typescript
<Link href="/policies/privacy-policy">Privacy Policy</Link>
<Link href="/policies/terms-of-service">Terms</Link>
<Link href="/policies/refund-policy">Refunds</Link>
```

### Step 5: Test
- Navigate to each `/policies/*` page
- Verify content displays correctly
- Check mobile responsive

---

## 📄 All Policy Pages

1. **Privacy Policy** - `/policies/privacy-policy`
2. **Terms of Service** - `/policies/terms-of-service`
3. **Refund Policy** - `/policies/refund-policy`
4. **Site Guidelines** - `/policies/site-guidelines`
5. **Information Security** - `/policies/information-security-policy`
6. **Incident Response** - `/policies/cyber-incident-response-plan`

---

## ⚠️ Important Customizations

### Terms of Service
Update commission rates:
```typescript
<li>Items under $100: 50% commission</li>  // Change these
<li>Items $100-$500: 40% commission</li>
<li>Items over $500: 35% commission</li>
```

### Refund Policy
Update return window:
```typescript
24 hours from delivery  // Change if different
```

### Site Guidelines
Update acceptable items list to match what you sell.

### Security Policy
Update security coordinator name throughout.

---

## ✅ Testing Checklist

- [ ] All 6 pages load without errors
- [ ] Animations work smoothly
- [ ] Mobile responsive on all pages
- [ ] All links work
- [ ] Contact info updated
- [ ] Company name updated
- [ ] Dates updated

---

## 🔧 Optional: Remove Animations

If you don't want animations:

1. Remove import: `import { motion } from "framer-motion";`
2. Change `<motion.div>` to `<div>`
3. Remove `initial`, `animate`, `transition` props

---

## 📞 Support

- See README.md for full details
- Review with legal counsel before going live
- Update policies as your business changes

---

**Time Required:** ~20 minutes setup + legal review  
**Dependencies:** framer-motion  
**Pages:** 6 complete policy pages  
**Total Lines:** 2,347 lines


