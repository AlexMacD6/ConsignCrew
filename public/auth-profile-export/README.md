# TreasureHub Authentication & Profile System - Export Package

## 📦 Package Contents

This export package contains all the necessary files to implement TreasureHub's complete authentication and profile management system in your own Next.js application.

### What's Included:

1. **Authentication Pages**
   - Login page with email/password authentication
   - Registration page with user type selection (buyer/seller)
   - Password reset page with token-based flow
   - Email verification handling

2. **Profile Management**
   - Complete user profile page with multiple tabs
   - Profile editing functionality
   - Organization management
   - Purchases history
   - Settings management

3. **Better Auth Integration**
   - Full Better Auth setup and configuration
   - Email/password authentication
   - Email verification system
   - Password reset functionality
   - Session management

4. **API Routes**
   - Authentication endpoints
   - Profile data endpoints
   - User registration
   - Email verification
   - Password reset

5. **Supporting Files**
   - Authentication hooks
   - Auth client utilities
   - User permissions system
   - Prisma schema for auth tables

## 🎯 Quick Start

### Prerequisites

```bash
- Next.js 14+ (App Router)
- React 18+
- Prisma ORM
- PostgreSQL database
- Node.js 18+
```

### Required Dependencies

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
    "@types/react": "^18.3.0",
    "prisma": "^6.14.0",
    "typescript": "^5.3.0"
  }
}
```

### Installation Steps

1. **Install Dependencies**
   ```bash
   npm install better-auth @prisma/client react-phone-input-2
   npm install -D prisma
   ```

2. **Copy Files to Your Project**
   ```bash
   # Copy authentication pages
   cp -r app/login your-project/app/
   cp -r app/register your-project/app/
   cp -r app/reset-password your-project/app/
   cp -r app/profile your-project/app/
   
   # Copy library files
   cp -r app/lib your-project/app/
   cp -r app/hooks your-project/app/
   
   # Copy API routes
   cp -r app/api/auth your-project/app/api/
   cp -r app/api/profile your-project/app/api/
   ```

3. **Database Setup**
   ```bash
   # Add authentication tables to your Prisma schema
   cat prisma/auth-schema.prisma >> your-project/prisma/schema.prisma
   
   # Run migration
   npx prisma migrate dev --name add_auth_system
   ```

4. **Environment Variables**
   Create/update `.env` file:
   ```env
   # Database
   DATABASE_URL="postgresql://user:password@localhost:5432/yourdb"
   
   # Better Auth
   BETTER_AUTH_SECRET="your-32-character-secret-key"
   BETTER_AUTH_URL="http://localhost:3000"
   
   # Email (AWS SES)
   AWS_ACCESS_KEY_ID="your-aws-key"
   AWS_SECRET_ACCESS_KEY="your-aws-secret"
   AWS_REGION="us-east-1"
   AWS_SES_FROM_EMAIL="noreply@yourdomain.com"
   
   # Optional: OAuth (if using)
   GOOGLE_CLIENT_ID="your-google-client-id"
   GOOGLE_CLIENT_SECRET="your-google-client-secret"
   FACEBOOK_CLIENT_ID="your-facebook-app-id"
   FACEBOOK_CLIENT_SECRET="your-facebook-app-secret"
   ```

5. **Update Configuration**
   - Update `app/lib/auth.ts` with your domain URLs
   - Update email templates with your branding
   - Adjust redirect URLs to match your routes

## 📁 File Structure

```
your-project/
├── app/
│   ├── login/
│   │   └── page.tsx                 # Login page
│   ├── register/
│   │   └── page.tsx                 # Registration page
│   ├── reset-password/
│   │   └── page.tsx                 # Password reset page
│   ├── profile/
│   │   └── page.tsx                 # User profile page
│   ├── lib/
│   │   ├── auth.ts                  # Better Auth configuration
│   │   ├── auth-client.ts           # Auth client for frontend
│   │   ├── ses-server.ts            # AWS SES email service
│   │   └── prisma.ts                # Prisma client
│   ├── hooks/
│   │   ├── useUserPermissions.ts    # Permission management hook
│   │   └── useEarlyAuth.ts          # Early authentication hook
│   └── api/
│       ├── auth/
│       │   ├── [...all]/route.ts    # Better Auth catch-all route
│       │   ├── registerUser.ts      # User registration action
│       │   └── resend-verification/ # Email verification resend
│       │       └── route.ts
│       └── profile/
│           ├── route.ts             # Profile data endpoint
│           ├── complete/
│           │   └── route.ts         # Complete profile data
│           ├── purchases/
│           │   └── route.ts         # Purchase history
│           └── organizations/
│               └── route.ts         # User organizations
├── prisma/
│   └── schema.prisma                # Database schema with auth tables
└── .env                             # Environment variables
```

## 🔐 Authentication Flow

### User Registration Flow

1. User visits `/register`
2. Selects account type (buyer/seller)
3. Fills out registration form
4. System creates user account (email unverified)
5. Verification email sent via AWS SES
6. User clicks verification link
7. Email verified, user can now login

### Login Flow

1. User visits `/login`
2. Enters email and password
3. Better Auth validates credentials
4. Checks if email is verified
5. If verified: creates session, redirects to profile
6. If not verified: shows error with resend option

### Password Reset Flow

1. User clicks "Forgot Password" on login page
2. Enters email address
3. System sends reset email with token
4. User clicks reset link → redirected to `/reset-password?token=xxx`
5. User enters new password
6. Password updated, redirected to login

### Session Management

- Sessions stored in database
- 30-day expiration
- Auto-refresh every 7 days
- Secure HTTP-only cookies

## 🎨 Customization Guide

### Branding & Styling

1. **Colors**: Update TreasureHub gold (`#D4AF3D`) to your brand color
   - Search and replace `#D4AF3D` and `#b8932f` in all files

2. **Logo**: Replace "TreasureHub" text with your logo component

3. **Email Templates**: Update `app/lib/auth.ts`:
   ```typescript
   // Line ~54: Verification email template
   // Line ~108: Password reset email template
   ```

### Routes & Redirects

Update these constants in authentication files:

```typescript
// app/login/page.tsx
const redirectTo = searchParams.get("redirect") || "/profile";

// app/register/page.tsx  
router.push("/login?message=registration-success");

// app/reset-password/page.tsx
router.push("/login?message=password-reset-success");
```

### Feature Flags

Enable/disable features:

```typescript
// OAuth (currently disabled)
// Uncomment sections marked with:
// TODO: Uncomment when OAuth integration is ready

// Email verification requirement
// app/lib/auth.ts line 44:
requireEmailVerification: true,  // Set to false to disable
```

## 🔧 Configuration Details

### Better Auth Configuration

File: `app/lib/auth.ts`

Key settings:
- Database adapter: Prisma (PostgreSQL)
- Email provider: Custom AWS SES integration
- Session duration: 30 days
- Email verification: Required by default
- Trusted origins: Configure your domains

### Email Service (AWS SES)

File: `app/lib/ses-server.ts`

Requirements:
- AWS SES account with verified domain/email
- AWS credentials in environment variables
- Email templates with HTML styling

To switch to another email service:
1. Update `sendEmail` function in `ses-server.ts`
2. Keep the same function signature
3. Update environment variables

### Database Schema

File: `prisma/auth-schema.prisma`

Tables created:
- `user` - User accounts
- `session` - Active sessions
- `account` - OAuth accounts (optional)
- `verification` - Email verification tokens
- `verificationToken` - Password reset tokens

## 📊 API Endpoints

### Authentication Endpoints

All managed by Better Auth:
- `POST /api/auth/sign-in/email` - Email/password login
- `POST /api/auth/sign-up/email` - Registration  
- `POST /api/auth/forget-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password with token
- `GET /api/auth/verify-email` - Verify email with token
- `POST /api/auth/resend-verification` - Resend verification email

### Profile Endpoints

- `GET /api/profile` - Get user profile
- `GET /api/profile/complete` - Get complete profile with relations
- `GET /api/profile/purchases` - Get purchase history
- `GET /api/profile/organizations` - Get user organizations
- `PATCH /api/profile` - Update profile (you'll need to create this)

## 🛠️ Common Modifications

### 1. Add Social Media Fields to Profile

```typescript
// prisma/schema.prisma
model user {
  // ... existing fields
  twitter    String?
  instagram  String?
  linkedin   String?
}
```

### 2. Disable Email Verification

```typescript
// app/lib/auth.ts
emailAndPassword: {
  enabled: true,
  requireEmailVerification: false,  // Changed from true
  // ... rest of config
}
```

### 3. Add Profile Photo Upload

Add to `app/profile/page.tsx`:
```typescript
const [profilePhoto, setProfilePhoto] = useState<string>("");
// Add file upload component
// Save to user.profilePhotoUrl field
```

### 4. Custom Password Requirements

```typescript
// app/register/page.tsx
<input
  type="password"
  minLength={10}  // Change from 8
  pattern="(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{10,}"
  title="Must contain at least one number, one uppercase and lowercase letter, and at least 10 characters"
/>
```

## 🧪 Testing

### Test User Registration

```bash
# 1. Start your app
npm run dev

# 2. Navigate to registration
http://localhost:3000/register

# 3. Fill out form and submit
# 4. Check email for verification link
# 5. Click verification link
# 6. Login with credentials
```

### Test Password Reset

```bash
# 1. Go to login page
# 2. Click "Forgot Password"
# 3. Enter email
# 4. Check email for reset link
# 5. Click link and reset password
# 6. Login with new password
```

## 🐛 Troubleshooting

### Issue: "Module not found: Can't resolve '@/lib/auth'"

**Solution**: Check your `tsconfig.json` has path aliases:
```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./app/*"]
    }
  }
}
```

### Issue: Email verification emails not sending

**Solution**: 
1. Verify AWS SES credentials in `.env`
2. Check AWS SES console - email/domain must be verified
3. Check server logs for detailed error messages
4. Ensure `AWS_SES_FROM_EMAIL` is verified in SES

### Issue: "Invalid session" errors

**Solution**:
1. Clear browser cookies
2. Check `BETTER_AUTH_SECRET` is set in `.env`
3. Verify database connection
4. Check session table has records

### Issue: Prisma client errors

**Solution**:
```bash
# Regenerate Prisma client
npx prisma generate

# If schema changed, run migration
npx prisma migrate dev
```

## 📚 Additional Resources

- [Better Auth Documentation](https://better-auth.com/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Next.js App Router](https://nextjs.org/docs/app)
- [AWS SES Documentation](https://docs.aws.amazon.com/ses/)

## 🔒 Security Best Practices

1. **Environment Variables**
   - Never commit `.env` file
   - Use strong, random secrets
   - Rotate secrets regularly

2. **Password Security**
   - Enforce minimum 8 characters
   - Consider adding password strength meter
   - Implement rate limiting on login

3. **Email Verification**
   - Keep verification required for production
   - Set reasonable token expiration (24 hours)
   - Implement rate limiting on resend

4. **Session Security**
   - Use secure, HTTP-only cookies
   - Implement CSRF protection
   - Set appropriate session expiration

5. **Database Security**
   - Use connection pooling
   - Implement proper indexes
   - Regular backups
   - Parameterized queries only (Prisma handles this)

## 📝 License

This code is exported from TreasureHub and follows the same license as your main project.

## 💬 Support

For issues or questions about this authentication system:
1. Review this documentation
2. Check the troubleshooting section
3. Review Better Auth documentation
4. Check server logs for detailed errors

---

**Version**: 1.0  
**Last Updated**: November 5, 2025  
**Exported From**: TreasureHub  
**Framework**: Next.js 15 + Better Auth + Prisma

