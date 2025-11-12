# Quick Integration Guide - FAQ Page System

This is a step-by-step guide to integrate the FAQ page into Selling To Sold.

---

## ⚡ Quick Start (5 Steps)

### Step 1: Copy Files (2 minutes)

Copy these files to your Selling To Sold project:

```bash
# From TreasureHub/public/faq-export/

# FAQ pages (required)
cp app/faq/page.tsx              → SellingToSold/app/faq/
cp app/faq/faq-data.tsx          → SellingToSold/app/faq/
cp app/faq/privacy-policy.tsx    → SellingToSold/app/faq/

# Components (required)
cp app/components/FAQSchema.tsx  → SellingToSold/app/components/
```

---

### Step 2: Install Dependencies (1 minute)

```bash
npm install lucide-react
```

---

### Step 3: Add Navigation Link (2 minutes)

In your navigation component (e.g., `NavBar.tsx`):

```typescript
import Link from "next/link";

// Add to your navigation:
<Link href="/faq" className="hover:text-primary">
  FAQ
</Link>
```

---

### Step 4: Customize FAQ Content (10 minutes)

Open `app/faq/faq-data.tsx` and customize:

1. **Update company name:**
   - Find "TreasureHub" and replace with "Selling To Sold"
   
2. **Update email addresses:**
   - Replace `support@treasurehub.club` with your support email
   - Replace `privacy@treasurehub.club` with your privacy email

3. **Update FAQ content:**
   - Modify questions to match your services
   - Update answers with your specific information
   - Add/remove categories as needed

4. **Update discount schedules:**
   - Modify or remove if not applicable
   - Update pricing information

---

### Step 5: Test (2 minutes)

1. Start your dev server: `npm run dev`
2. Navigate to `/faq`
3. Test search functionality
4. Click categories and expand questions
5. Verify everything displays correctly

✅ Done! You now have a fully functional FAQ page.

---

## 🔧 Detailed Integration Steps

### Customizing FAQ Data

#### Example: Adding a New Category

```typescript
// In app/faq/faq-data.tsx

{
  id: "returns-refunds",
  name: "Returns & Refunds",
  description: "Our return and refund policies.",
  items: [
    {
      id: "return-window",
      question: "What is your return window?",
      answer: "We accept returns within 30 days of delivery.",
      category: "returns-refunds"
    },
    {
      id: "refund-process",
      question: "How long do refunds take?",
      answer: "Refunds are processed within 5-7 business days.",
      category: "returns-refunds"
    }
  ]
}
```

#### Example: Using Rich Formatted Answers

```typescript
{
  id: "how-to-order",
  question: "How do I place an order?",
  answer: (
    <div className="space-y-3">
      <p>Follow these simple steps:</p>
      <ol className="list-decimal list-inside space-y-2">
        <li>Browse our listings</li>
        <li>Add items to your cart</li>
        <li>Proceed to checkout</li>
        <li>Enter shipping information</li>
        <li>Complete payment</li>
      </ol>
      <div className="bg-blue-50 p-3 rounded-lg">
        <strong>Tip:</strong> Create an account to save your favorites!
      </div>
    </div>
  )
}
```

---

### Removing Features You Don't Need

#### Remove Feedback System

If you don't want the "Was this helpful?" buttons:

1. **In `app/faq/page.tsx`**, remove these sections:

```typescript
// Remove state
const [feedback, setFeedback] = useState<FeedbackResponse>({});
const [userFeedback, setUserFeedback] = useState<Record<string, boolean>>({});

// Remove the fetchFeedback useEffect

// Remove the handleFeedback function

// In the JSX, remove this section:
<div className="mt-4 flex items-center gap-4">
  <span className="text-sm text-gray-500">Was this helpful?</span>
  {/* ... thumbs up/down buttons ... */}
</div>
```

2. **Remove unused imports:**

```typescript
// Remove from imports:
ThumbsUp, ThumbsDown
```

---

#### Simplify Privacy Policy

If you already have a privacy policy page:

1. Delete `app/faq/privacy-policy.tsx`
2. Or update it with your existing content

---

### Adding New Sections

#### Example: Adding a Contact Section

```typescript
{
  id: "contact",
  name: "Contact Us",
  description: "Get in touch with our team.",
  items: [
    {
      id: "contact-methods",
      question: "How can I contact support?",
      answer: (
        <div>
          <p>We're here to help! Reach out via:</p>
          <ul className="list-disc list-inside mt-2 space-y-1">
            <li>Email: support@sellingtosold.com</li>
            <li>Phone: (555) 123-4567</li>
            <li>Live Chat: Available 9 AM - 5 PM EST</li>
          </ul>
        </div>
      )
    }
  ]
}
```

---

## 🎨 Styling Customization

### Update Brand Colors

The FAQ page uses these color classes that you can customize:

**Primary color (buttons, links):**
```typescript
// Find and replace:
bg-primary → bg-blue-600
text-primary-foreground → text-white
hover:bg-primary → hover:bg-blue-700
```

**Category selection:**
```typescript
// Selected category:
bg-primary text-primary-foreground
// Change to:
bg-blue-600 text-white
```

**Feedback buttons:**
```typescript
// Green (helpful):
text-green-600 bg-green-50 hover:bg-green-100

// Red (not helpful):
text-red-600 bg-red-50 hover:bg-red-100
```

---

### Mobile Responsiveness

The page is already mobile-responsive, but you can adjust:

**Sidebar behavior:**
```typescript
// Current: Shows as top section on mobile
<div className="md:col-span-1">
  <div className="sticky top-4">
    {/* Categories */}
  </div>
</div>

// To hide on mobile, add:
<div className="hidden md:block md:col-span-1">
```

---

## 📱 SEO Integration

### Update SEO Head

In `app/faq/page.tsx`:

```typescript
<SEOHead
  title="Frequently Asked Questions - Selling To Sold"
  description="Find answers to common questions about Selling To Sold's services."
  keywords={[
    "FAQ",
    "questions",
    "help",
    "Selling To Sold support",
  ]}
  canonical="https://sellingtosold.com/faq"
/>
```

### Update Privacy Policy SEO

In `app/faq/privacy-policy.tsx`, add SEOHead:

```typescript
import SEOHead from "../components/SEOHead";

export default function PrivacyPolicy() {
  return (
    <>
      <SEOHead
        title="Privacy Policy - Selling To Sold"
        description="Read our privacy policy and data protection practices."
        canonical="https://sellingtosold.com/faq/privacy-policy"
      />
      {/* ... rest of component ... */}
    </>
  );
}
```

---

## 🔌 Backend API (Optional)

If you want to implement the feedback system, create this API route:

### File: `app/api/faq-feedback/route.ts`

```typescript
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

// In-memory storage (use database in production)
const feedbackData: Record<string, {
  helpful: number;
  notHelpful: number;
  votes: Record<string, boolean>;
}> = {};

export async function GET() {
  try {
    const cookieStore = cookies();
    const sessionId = cookieStore.get("session-id")?.value || "";
    
    // Format response with user's votes
    const response: Record<string, any> = {};
    Object.keys(feedbackData).forEach(itemId => {
      response[itemId] = {
        helpful: feedbackData[itemId].helpful,
        notHelpful: feedbackData[itemId].notHelpful,
        userVote: feedbackData[itemId].votes[sessionId]
      };
    });
    
    return NextResponse.json(response);
  } catch (error) {
    console.error("Error fetching FAQ feedback:", error);
    return NextResponse.json({}, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { faqItemId, isHelpful } = await request.json();
    const cookieStore = cookies();
    let sessionId = cookieStore.get("session-id")?.value;
    
    // Create session if doesn't exist
    if (!sessionId) {
      sessionId = crypto.randomUUID();
      cookies().set("session-id", sessionId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 365 // 1 year
      });
    }
    
    // Initialize feedback data if doesn't exist
    if (!feedbackData[faqItemId]) {
      feedbackData[faqItemId] = {
        helpful: 0,
        notHelpful: 0,
        votes: {}
      };
    }
    
    const item = feedbackData[faqItemId];
    const previousVote = item.votes[sessionId];
    
    // Remove previous vote if exists
    if (previousVote === true) item.helpful--;
    if (previousVote === false) item.notHelpful--;
    
    // Add new vote
    if (isHelpful) {
      item.helpful++;
    } else {
      item.notHelpful++;
    }
    
    item.votes[sessionId] = isHelpful;
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error saving FAQ feedback:", error);
    return NextResponse.json(
      { message: "Failed to save feedback" },
      { status: 500 }
    );
  }
}
```

---

## ✅ Testing Checklist

- [ ] FAQ page loads at `/faq`
- [ ] Privacy policy loads at `/faq/privacy-policy`
- [ ] Search box filters results
- [ ] Category sidebar navigation works
- [ ] Questions expand/collapse on click
- [ ] Styled content displays correctly (tables, lists)
- [ ] Feedback buttons work (if implemented)
- [ ] Mobile responsive design works
- [ ] SEO meta tags are correct
- [ ] Navigation link works
- [ ] No console errors

---

## 🐛 Troubleshooting

### Problem: FAQ page not found (404)
**Solution:** 
1. Ensure files are in `app/faq/` directory
2. Restart dev server
3. Check file names are correct (`page.tsx` not `Page.tsx`)

---

### Problem: Icons not showing
**Solution:**
```bash
npm install lucide-react
```

---

### Problem: Search not working
**Solution:**
1. Check console for errors
2. Verify `searchQuery` state is updating
3. Test with simple search term

---

### Problem: Categories not scrolling
**Solution:**
1. Check that category IDs match between sidebar and content
2. Verify `id` attributes are set correctly
3. Try adding `scroll-mt-20` class for better positioning

---

### Problem: Feedback buttons not working
**Solution:**
1. Check if API route exists at `/api/faq-feedback`
2. Verify API is returning correct format
3. Check browser console for errors

---

## 📊 Performance Tips

### Optimize for Large FAQ Lists

If you have 50+ FAQ items:

1. **Implement pagination:**
```typescript
const ITEMS_PER_PAGE = 10;
const [page, setPage] = useState(1);
```

2. **Add lazy loading:**
```typescript
import dynamic from 'next/dynamic';

const LazyFAQCategory = dynamic(() => import('./FAQCategory'));
```

3. **Debounce search:**
```typescript
import { useDebounce } from 'use-debounce';

const [debouncedSearch] = useDebounce(searchQuery, 300);
```

---

## 🚀 Going Live

Before deploying to production:

1. **Update all content** - Replace TreasureHub references
2. **Test thoroughly** - All features on all devices
3. **Check SEO** - Meta tags, canonical URLs, schema
4. **Add analytics** - Track FAQ page views
5. **Test API** - If using feedback system
6. **Review privacy policy** - Ensure it's accurate
7. **Add to sitemap** - Include `/faq` in sitemap.xml

---

## 📝 Summary

**Time to integrate:** ~20 minutes
**Files to copy:** 4 files
**Dependencies:** 1 (lucide-react)
**Lines of code:** ~1,000
**FAQ categories:** 7 (customizable)
**FAQ items:** 25+ (expandable)

---

**Last Updated:** November 10, 2025
**For:** Selling To Sold Integration


