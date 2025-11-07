# Auth & Profile System - Complete File List

## Required Files to Copy

### Authentication Pages (3 files)
1. `app/login/page.tsx` → Login with email/password, forgot password modal
2. `app/register/page.tsx` → Registration with user type selection  
3. `app/reset-password/page.tsx` → Password reset with token validation

### Profile Management (1 file)
4. `app/profile/page.tsx` → Complete profile page with tabs (listings, purchases, settings, admin)

### Authentication Library & Config (4 files)
5. `app/lib/auth.ts` → Better Auth configuration (email verification, password reset)
6. `app/lib/auth-client.ts` → Frontend authentication client
7. `app/lib/ses-server.ts` → AWS SES email service for verification/reset emails
8. `app/lib/prisma.ts` → Prisma client singleton

### Authentication Hooks (2 files)
9. `app/hooks/useUserPermissions.ts` → User role and permissions hook
10. `app/hooks/useEarlyAuth.ts` → Early authentication initialization

### API Routes (7+ files)
11. `app/api/auth/[...all]/route.ts` → Better Auth catch-all route handler
12. `app/api/auth/registerUser.ts` → Server action for user registration
13. `app/api/auth/resend-verification/route.ts` → Resend verification email endpoint
14. `app/api/profile/route.ts` → User profile data endpoint
15. `app/api/profile/complete/route.ts` → Complete profile with all relations
16. `app/api/profile/purchases/route.ts` → User purchase history
17. `app/api/profile/organizations/route.ts` → User organization memberships

### Database Schema (1 file)
18. `prisma/schema.prisma` → Extract auth-related models (user, session, account, verification, verificationToken)

### Supporting Files
19. `package.json` → Dependencies list for auth system
20. `.env.example` → Required environment variables

## File Sizes & Line Counts

| File | Lines | Description |
|------|-------|-------------|
| login/page.tsx | 593 | Login page with email/password, OAuth placeholders, forgot password |
| register/page.tsx | 444 | Registration with user type selection (buyer/seller) |
| reset-password/page.tsx | 220 | Password reset form with token validation |
| profile/page.tsx | ~1500 | Complete profile management (tabs, editing, organizations) |
| lib/auth.ts | 217 | Better Auth config with email verification & password reset |
| lib/auth-client.ts | ~50 | Frontend auth client wrapper |
| lib/ses-server.ts | ~100 | AWS SES integration for emails |
| hooks/useUserPermissions.ts | ~80 | Permission checking hook |
| hooks/useEarlyAuth.ts | ~30 | Early auth initialization |
| api/auth/[...all]/route.ts | ~15 | Better Auth route handler |
| api/auth/registerUser.ts | ~150 | User registration server action |
| api/auth/resend-verification/route.ts | ~100 | Email verification resend |
| api/profile/route.ts | ~200 | Profile CRUD endpoints |
| api/profile/complete/route.ts | ~150 | Complete profile with relations |

**Total**: ~3,850 lines of code

## Dependencies Required

```json
{
  "dependencies": {
    "better-auth": "^1.3.3",
    "@prisma/client": "^6.14.0",
    "react": "^18.3.0",
    "next": "^15.0.0",
    "react-phone-input-2": "^2.15.1",
    "aws-sdk": "^2.1691.0"
  },
  "devDependencies": {
    "prisma": "^6.14.0",
    "typescript": "^5.3.0",
    "@types/react": "^18.3.0",
    "@types/node": "^20.0.0"
  }
}
```

## Environment Variables Required

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/yourdb"

# Better Auth
BETTER_AUTH_SECRET="your-secure-32-character-random-string"
BETTER_AUTH_URL="http://localhost:3000"
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# AWS SES (for emails)
AWS_ACCESS_KEY_ID="your-aws-access-key"
AWS_SECRET_ACCESS_KEY="your-aws-secret-key"
AWS_REGION="us-east-1"
AWS_SES_FROM_EMAIL="noreply@yourdomain.com"

# Optional: OAuth Providers
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
FACEBOOK_CLIENT_ID="your-facebook-app-id"
FACEBOOK_CLIENT_SECRET="your-facebook-app-secret"
```

## Database Tables (Prisma Schema)

### Core Auth Tables

```prisma
model user {
  id               String          @id @default(cuid())
  email            String          @unique
  mobilePhone      String?
  createdAt        DateTime        @default(now())
  updatedAt        DateTime        @updatedAt
  emailVerified    Boolean         @default(false)
  name             String
  addressLine1     String?
  addressLine2     String?
  city             String?
  neighborhood     String?
  state            String?
  zipCode          String?
  country          String?
  stripeCustomerId String?
  role             String          @default("USER") // USER or ADMIN
  
  // Relations
  sessions         session[]
  accounts         account[]
  // ... your app-specific relations
}

model session {
  id                   String        @id @default(cuid())
  userId               String
  activeOrganizationId String?
  activeTeamId         String?
  createdAt            DateTime      @default(now())
  updatedAt            DateTime      @updatedAt
  expiresAt            DateTime
  token                String        @unique
  ipAddress            String?
  userAgent            String?
  user                 user          @relation(fields: [userId], references: [id])
  
  @@map("session")
}

model account {
  id                   String    @id @default(cuid())
  userId               String
  providerId           String    @map("provider")
  accountId            String    @map("providerAccountId")
  refreshToken         String?   @map("refresh_token")
  accessToken          String?   @map("access_token")
  idToken              String?   @map("id_token")
  createdAt            DateTime  @default(now())
  updatedAt            DateTime  @updatedAt
  accessTokenExpiresAt DateTime? @map("expires_at")
  password             String?
  user                 user      @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@unique([providerId, accountId])
  @@map("account")
}

model verification {
  id         String   @id @default(cuid())
  identifier String
  value      String
  expiresAt  DateTime
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt
  
  @@map("verification")
}

model verificationToken {
  identifier String
  token      String   @unique
  expires    DateTime
  
  @@unique([identifier, token])
  @@map("verificationToken")
}
```

## Setup Instructions

### Step 1: Install Dependencies
```bash
npm install better-auth @prisma/client react-phone-input-2 aws-sdk
npm install -D prisma @types/react @types/node
```

### Step 2: Copy All Files
Use the file list above to copy each file to your project in the same directory structure.

### Step 3: Database Setup
```bash
# Add auth models to your schema.prisma
# Then run migration
npx prisma migrate dev --name add_auth_system
npx prisma generate
```

### Step 4: Configure Environment Variables
Copy `.env.example` to `.env` and fill in your values.

### Step 5: Test
```bash
npm run dev
# Visit http://localhost:3000/register
```

## Key Features

### ✅ Authentication
- Email/password registration with verification
- Secure login with session management
- Password reset via email
- Email verification required before login
- Resend verification email functionality
- OAuth placeholders (Google, Facebook, TikTok) - currently disabled

### ✅ Profile Management
- View and edit user profile
- Multiple tabs: Listings, Purchases, Settings
- Organization management (if using multi-tenant)
- Admin dashboard link (for admin users)
- Profile photo support
- Address management
- Payment method tracking

### ✅ Security
- Password hashing via Better Auth
- Secure HTTP-only cookies
- CSRF protection
- Session expiration (30 days)
- Rate limiting ready (needs implementation)
- Email verification required

### ✅ User Experience
- Loading states
- Error handling with clear messages
- Success notifications
- Email verification reminders
- Forgot password modal
- Responsive design
- Form validation

## Customization Needed

### 1. Branding
- Replace `#D4AF3D` (TreasureHub gold) with your brand color
- Update "TreasureHub" text with your app name
- Customize email templates in `app/lib/auth.ts`

### 2. Routes
- Update redirect URLs in authentication files
- Configure trusted origins in `app/lib/auth.ts`
- Set your domain in environment variables

### 3. Profile Features
- Add/remove profile tabs as needed
- Customize profile fields
- Update organization logic if not needed
- Modify admin access logic

### 4. Email Service
- Configure AWS SES or switch to another provider
- Update `app/lib/ses-server.ts` if using different service
- Verify sender email in your email service

## Architecture Overview

```
User Flow:
1. Registration → Email Sent → Verify Email → Login → Profile
2. Login → Check Verification → Create Session → Redirect
3. Forgot Password → Email Sent → Reset Password → Login

Tech Stack:
- Frontend: Next.js 15 (App Router) + React 18
- Auth: Better Auth (email/password, sessions)
- Database: Prisma + PostgreSQL
- Email: AWS SES (customizable)
- Styling: Tailwind CSS (inline styles)
- Phone Input: react-phone-input-2

Session Management:
- Stored in database (session table)
- HTTP-only secure cookies
- 30-day expiration
- Auto-refresh every 7 days

Security:
- Passwords hashed by Better Auth
- Email verification required
- CSRF protection enabled
- Secure session tokens
```

## Common Issues & Solutions

### Issue: Build errors about missing modules
**Solution**: Run `npm install` for all dependencies

### Issue: Database connection errors
**Solution**: Check DATABASE_URL in `.env`

### Issue: Emails not sending
**Solution**: Verify AWS SES credentials and verify sender email

### Issue: Import path errors
**Solution**: Check `tsconfig.json` has path aliases configured

### Issue: "Email not verified" errors
**Solution**: Click verification link in email or disable verification requirement

## Testing Checklist

- [ ] Register new user
- [ ] Receive verification email
- [ ] Click verification link
- [ ] Login with verified account
- [ ] Test forgot password
- [ ] Reset password successfully
- [ ] Login with new password
- [ ] View profile page
- [ ] Edit profile information
- [ ] Test logout
- [ ] Resend verification email

## API Endpoints Reference

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/auth/sign-in/email` | POST | Login with email/password |
| `/api/auth/sign-up/email` | POST | Register new user |
| `/api/auth/forget-password` | POST | Request password reset |
| `/api/auth/reset-password` | POST | Reset password with token |
| `/api/auth/verify-email` | GET | Verify email with token |
| `/api/auth/resend-verification` | POST | Resend verification email |
| `/api/auth/get-session` | GET | Get current session |
| `/api/profile` | GET | Get user profile |
| `/api/profile/complete` | GET | Get complete profile data |
| `/api/profile/purchases` | GET | Get purchase history |
| `/api/profile/organizations` | GET | Get user organizations |

## Next Steps After Setup

1. Test all authentication flows
2. Customize branding and colors
3. Configure email service
4. Set up production environment variables
5. Enable OAuth providers (optional)
6. Add rate limiting for security
7. Implement additional profile features
8. Set up monitoring and logging
9. Configure backup strategy
10. Test on production domain

---

**Ready to implement?** Follow the README.md for detailed setup instructions.

