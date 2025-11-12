# FAQ Page System - Export Package

This export package contains all the files needed to implement a comprehensive, interactive FAQ page in your **Selling To Sold** application.

## 📦 Package Contents

### Pages (`app/faq/`)
- **page.tsx** - Main FAQ page with search, categories, and feedback system
- **faq-data.tsx** - All FAQ questions and answers with TypeScript types
- **privacy-policy.tsx** - Privacy policy page

### Components (`app/components/`)
- **FAQSchema.tsx** - SEO-optimized structured data for search engines

### Documentation (`docs/`, `requirements/`, `pr-templates/`)
- **discount-schedule-faq-integration.txt** - Requirements and specifications
- **discount-schedule-faq-integration.md** - PR template with testing instructions

---

## 🚀 Quick Start Guide

### Step 1: Copy Files to Selling To Sold

Copy the files to your Selling To Sold project:

```bash
# From the TreasureHub/public/faq-export directory:

# Copy FAQ pages
cp app/faq/*.tsx <SellingToSold>/app/faq/

# Copy components
cp app/components/FAQSchema.tsx <SellingToSold>/app/components/
```

### Step 2: Install Dependencies

The FAQ page uses these dependencies (likely already in your project):
- `lucide-react` - For icons (ChevronDown, ChevronUp, ThumbsUp, ThumbsDown, Search)
- `next` - For Next.js features (Link, Script)

If not installed:
```bash
npm install lucide-react
```

### Step 3: Update Your Navigation

Add a link to the FAQ page in your navigation:

```typescript
<Link href="/faq">FAQ</Link>
```

### Step 4: Customize FAQ Data

Open `app/faq/faq-data.tsx` and:
1. Update questions and answers for your business
2. Add/remove FAQ categories as needed
3. Customize the content to match your services

---

## 📚 Key Features

### 1. Searchable FAQ System
- Real-time search across all questions and answers
- Instant filtering as you type
- Highlights matching categories

### 2. Category Navigation
- Sidebar with quick category access
- Smooth scrolling to selected category
- Sticky sidebar for easy navigation

### 3. Expandable Q&A
- Click to expand/collapse answers
- Clean, readable formatting
- Supports both text and JSX answers

### 4. Feedback System
- "Was this helpful?" thumbs up/down buttons
- Vote counting (requires backend API)
- Visual feedback on user votes
- Can be disabled if not needed

### 5. SEO Optimized
- FAQ Schema structured data for Google
- Proper meta tags via SEOHead component
- Search engine friendly URLs

### 6. Responsive Design
- Mobile-first approach
- Collapsible sidebar on mobile
- Touch-friendly interactions

---

## 🔧 Features Explained

### Search Functionality

The search works across both questions and answers:
- Type in the search box
- Results filter in real-time
- Search is case-insensitive
- Matches partial words

### Category System

```typescript
{
  id: "getting-started",
  name: "Getting Started",
  description: "Learn how TreasureHub works",
  items: [/* FAQ items */]
}
```

Each category has:
- Unique ID for navigation
- Display name
- Description
- Array of FAQ items

### FAQ Item Structure

```typescript
{
  id: "unique-id",
  question: "Your question here?",
  answer: "Your answer here",
  category: "category-id"
}
```

Answers can be:
- **String**: Simple text answer
- **JSX**: Rich formatted content with lists, tables, etc.

---

## 🎨 Customization

### Changing Colors

The FAQ page uses Tailwind CSS. Update colors by modifying class names:

**Primary accent (gold):**
```typescript
// Find and replace:
bg-primary → bg-your-color
text-primary-foreground → text-your-color
```

**Feedback buttons:**
```typescript
// Helpful (green):
text-green-600 bg-green-50 hover:bg-green-100

// Not helpful (red):
text-red-600 bg-red-50 hover:bg-red-100
```

### Removing Feedback System

If you don't want the feedback feature:

1. In `app/faq/page.tsx`, remove:
   - All feedback-related state
   - `handleFeedback` function
   - Feedback buttons in the JSX
   - ThumbsUp and ThumbsDown imports

2. Delete feedback-related types

### Adding New FAQ Categories

In `app/faq/faq-data.tsx`:

```typescript
{
  id: "new-category",
  name: "New Category",
  description: "Description of this category",
  items: [
    {
      id: "question-1",
      question: "Question?",
      answer: "Answer here",
      category: "new-category"
    }
  ]
}
```

### Rich Formatted Answers

You can use JSX for complex answers:

```typescript
{
  id: "example",
  question: "How does this work?",
  answer: (
    <div className="space-y-4">
      <p>Main explanation here.</p>
      <ol className="list-decimal list-inside">
        <li>Step one</li>
        <li>Step two</li>
        <li>Step three</li>
      </ol>
      <div className="bg-blue-50 p-3 rounded-lg">
        <strong>Note:</strong> Important information
      </div>
    </div>
  )
}
```

---

## 📖 How It Works

### Data Flow

```
1. FAQ Data (faq-data.tsx)
   ↓
2. Load into FAQ page state
   ↓
3. User searches/filters
   ↓
4. Display filtered results
   ↓
5. User clicks question to expand
   ↓
6. User votes helpful/not helpful (optional)
```

### Search Algorithm

The search filters both questions and answers:

```typescript
category.items.some(item =>
  item.question.toLowerCase().includes(query) ||
  item.answer.toLowerCase().includes(query)
)
```

### Category Navigation

Clicking a category:
1. Updates selected category state
2. Scrolls to category section
3. Highlights category in sidebar

### Feedback System

The feedback system:
1. Stores votes in state
2. Calls API to persist votes
3. Updates counts in real-time
4. Prevents duplicate votes per user

**Note:** Requires backend API at `/api/faq-feedback` (not included)

---

## 🧪 Testing

### Test Search
1. Navigate to `/faq`
2. Type in search box
3. Verify results filter correctly
4. Try searching questions and answers

### Test Categories
1. Click each category in sidebar
2. Verify page scrolls to category
3. Check that category is highlighted

### Test Expand/Collapse
1. Click a question
2. Verify answer expands
3. Click again to collapse
4. Try multiple questions

### Test Feedback (if implemented)
1. Expand a question
2. Click thumbs up
3. Verify count increases
4. Verify button highlights
5. Try clicking thumbs down

---

## 🐛 Troubleshooting

### Search not working
- Check that `searchQuery` state is updating
- Verify filter logic is correct
- Check for TypeScript errors

### Categories not scrolling
- Ensure category IDs match
- Check that `selectedCategory` state updates
- Verify `scrollIntoView` is called

### Feedback buttons not working
- Check console for API errors
- Verify `/api/faq-feedback` route exists
- Test API endpoint separately

### Styling issues
- Verify Tailwind classes are correct
- Check for conflicting CSS
- Test responsive design on mobile

---

## 🔄 Backend API (Optional)

If you want the feedback system, create this API route:

```typescript
// app/api/faq-feedback/route.ts

import { NextResponse } from "next/server";

export async function GET() {
  // Return all feedback counts
  // Format: { [faqItemId]: { helpful: number, notHelpful: number } }
}

export async function POST(request: Request) {
  // Save user vote
  // Body: { faqItemId: string, isHelpful: boolean }
  // Prevent duplicate votes per user
}
```

**Database Schema:**
```prisma
model FAQFeedback {
  id         String   @id @default(cuid())
  faqItemId  String
  userId     String?
  sessionId  String?
  isHelpful  Boolean
  createdAt  DateTime @default(now())

  @@unique([faqItemId, userId])
  @@unique([faqItemId, sessionId])
}
```

---

## 📝 File Descriptions

### page.tsx (294 lines)
The main FAQ page component. Features:
- Search functionality
- Category sidebar navigation
- Expandable Q&A items
- Feedback system
- SEO integration

### faq-data.tsx (385 lines)
Complete FAQ data. Contains:
- TypeScript type definitions
- 7 FAQ categories
- 25+ questions and answers
- Detailed discount schedule tables
- Privacy and support information

### privacy-policy.tsx (296 lines)
Privacy policy page. Includes:
- Complete privacy policy text
- Legal compliance sections
- Contact information
- Responsive formatting

### FAQSchema.tsx (38 lines)
SEO component. Provides:
- FAQ structured data for Google
- Schema.org format
- Automatic JSON-LD generation

---

## 🎯 Use Cases

### For E-commerce
- Product questions
- Shipping policies
- Return policies
- Payment methods

### For Services
- How it works
- Pricing information
- Scheduling details
- Terms of service

### For SaaS
- Getting started guides
- Feature explanations
- Account management
- Billing questions

---

## 📊 Statistics

- **Total Files:** 4 main files + 2 documentation
- **Total Lines:** ~1,000 lines
- **FAQ Categories:** 7 (customizable)
- **FAQ Items:** 25+ (expandable)
- **Dependencies:** 2 (lucide-react, next)

---

## ✅ Benefits

1. **Comprehensive** - Covers all common questions
2. **Searchable** - Find answers quickly
3. **Organized** - Clean category structure
4. **Interactive** - Expandable Q&A format
5. **SEO Optimized** - Structured data for search engines
6. **Customizable** - Easy to modify content
7. **Responsive** - Works on all devices
8. **Professional** - Clean, modern design

---

## 🎨 Example Questions Included

- Getting started with the platform
- How to list items
- Pricing and discount schedules
- Pickup and delivery process
- Tracking and notifications
- Payout information
- Privacy and data protection
- Support and help

---

## 📞 Support

For questions or issues:
1. Check the documentation in `docs/` folder
2. Review the requirements file for implementation details
3. See the PR template for testing instructions
4. Compare with TreasureHub implementation for reference

---

## 🎯 Next Steps

1. **Copy files** to Selling To Sold project
2. **Customize FAQ data** for your business
3. **Update styling** to match your brand
4. **Test all features** thoroughly
5. **Add navigation links** to FAQ page
6. **Implement backend API** if using feedback (optional)
7. **Deploy** and verify in production

---

## 📄 License

This code is part of TreasureHub and is being exported for use in Selling To Sold (sister application).

---

**Last Updated:** November 10, 2025
**Exported From:** TreasureHub v1.0
**For Use In:** Selling To Sold


