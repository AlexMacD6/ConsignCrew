# ConsignCrew Landing Page

A single-page, mobile-first landing page for ConsignCrew (Houston’s concierge resale service).

## Features

- Explains the concept in <15 seconds of scroll
- Highlights the three-step flow (“Tap → Snap → Cash”)
- Shows updated commission tiers (40 / 28 / 18 %)
- Teases the Flip-to-Fly launch challenge
- Captures email addresses to a Mailchimp list (or fallback: saves to Supabase)
- Uses the brand palette: #D4AF3D (gold), #825E08 (deep bronze), #f7f7f7 / #222 (neutral)
- Loads fast (<100 KB critical path) and passes Lighthouse 90+ on mobile
- Animated hero headline with typewriter effect
- Subtle framer-motion fade-ins and progress bar
- FAQ accordion, social links, and “Built in Houston” badge

## Tech Stack

- **Frontend**: Next.js 14 (React 18) + TypeScript + Tailwind CSS
- **Icons**: @heroicons/react
- **Animation**: framer-motion

## Quick Start

### Prerequisites

- **Node.js 18+**: Install from [nodejs.org](https://nodejs.org/)

### Setup

```bash
npm install
```

### Running the App

```bash
npm run dev
```

The application will be available at:
- http://localhost:3000

## Environment Variables

Create a `.env.local` file with the following (see `.env.example`):

```
MAILCHIMP_API_KEY=your-mailchimp-api-key
MAILCHIMP_LIST_ID=your-mailchimp-list-id
```

## Project Structure

```
app/
  ├─ page.tsx         # Main landing page
  ├─ components/      # UI components
  └─ api/subscribe/   # API route for Mailchimp integration
public/
tailwind.config.ts
next.config.ts
postcss.config.mjs
```

## Deployment

Deploy on Vercel for best results. The site is optimized for mobile and Lighthouse performance.

---

This project is a modern, static landing page for ConsignCrew. For any questions, open an issue or contact the team.