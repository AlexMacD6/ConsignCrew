# 🎯 CURSOR PROMPT: Copy TreasureHub Auth & Profile System

## Instructions for AI

**Task**: Copy all authentication and profile management files from TreasureHub to create a standalone auth system package.

### Files to Copy (in order):

#### 1. Authentication Pages
```
Source → Destination (in export folder)
app/login/page.tsx → app/login/page.tsx
app/register/page.tsx → app/register/page.tsx  
app/reset-password/page.tsx → app/reset-password/page.tsx
```

#### 2. Profile Page
```
app/profile/page.tsx → app/profile/page.tsx
```

#### 3. Library Files
```
app/lib/auth.ts → app/lib/auth.ts
app/lib/auth-client.ts → app/lib/auth-client.ts
app/lib/ses-server.ts → app/lib/ses-server.ts
app/lib/prisma.ts → app/lib/prisma.ts
```

#### 4. Hooks
```
app/hooks/useUserPermissions.ts → app/hooks/useUserPermissions.ts
app/hooks/useEarlyAuth.ts → app/hooks/useEarlyAuth.ts
```

#### 5. API Routes
```
app/api/auth/[...all]/route.ts → app/api/auth/[...all]/route.ts
app/api/auth/registerUser.ts → app/api/auth/registerUser.ts
app/api/auth/resend-verification/route.ts → app/api/auth/resend-verification/route.ts
app/api/profile/route.ts → app/api/profile/route.ts
app/api/profile/complete/route.ts → app/api/profile/complete/route.ts
app/api/profile/purchases/route.ts → app/api/profile/purchases/route.ts
app/api/profile/organizations/route.ts → app/api/profile/organizations/route.ts
```

#### 6. Supporting Files
Create `package.json` with required dependencies (see FILE_INVENTORY.md)
Create `.env.example` with all required environment variables
Extract auth-related schema models from `prisma/schema.prisma` → `prisma/auth-schema.prisma`

### Additional Documentation to Create:

1. **QUICK_START.md** - Step-by-step setup guide (5-10 minutes to complete)
2. **MODIFICATIONS_REQUIRED.md** - What must be changed for new project
3. **ARCHITECTURE.md** - System architecture and flow diagrams
4. **TROUBLESHOOTING.md** - Common issues and solutions

### Modification Instructions:

When copying files, **DO NOT modify the code**. Copy as-is. 

Document these required modifications in MODIFICATIONS_REQUIRED.md:
- Brand colors (#D4AF3D → YOUR_COLOR)
- App name ("TreasureHub" → YOUR_APP)
- Domain URLs (treasurehub.club → your-domain.com)
- Email templates (customize branding)
- Routes (update redirects if needed)
- OAuth (enable if needed, currently disabled)

### Success Criteria:

✅ All 20+ files copied to export directory
✅ package.json created with all dependencies
✅ .env.example created with all variables
✅ auth-schema.prisma extracted with all auth models
✅ 4 additional documentation files created
✅ File structure matches original (preserves paths)
✅ All imports and paths remain unchanged
✅ No code modifications made during copy

### Output Format:

Create all files in:
```
public/auth-profile-export/
├── README.md (already created)
├── FILE_INVENTORY.md (already created)  
├── QUICK_START.md (create)
├── MODIFICATIONS_REQUIRED.md (create)
├── ARCHITECTURE.md (create)
├── TROUBLESHOOTING.md (create)
├── package.json (create)
├── .env.example (create)
├── app/
│   ├── login/page.tsx
│   ├── register/page.tsx
│   ├── reset-password/page.tsx
│   ├── profile/page.tsx
│   ├── lib/
│   │   ├── auth.ts
│   │   ├── auth-client.ts
│   │   ├── ses-server.ts
│   │   └── prisma.ts
│   ├── hooks/
│   │   ├── useUserPermissions.ts
│   │   └── useEarlyAuth.ts
│   └── api/
│       ├── auth/
│       │   ├── [...all]/route.ts
│       │   ├── registerUser.ts
│       │   └── resend-verification/route.ts
│       └── profile/
│           ├── route.ts
│           ├── complete/route.ts
│           ├── purchases/route.ts
│           └── organizations/route.ts
└── prisma/
    └── auth-schema.prisma
```

### Commands to Execute:

```bash
# Already created base structure, now copy all files
# Use write tool for each file with exact contents from source
```

---

## USER INSTRUCTION:

Copy and paste this prompt to Cursor AI:

**"Please copy all authentication and profile files from TreasureHub following the structure in `public/auth-profile-export/CURSOR_PROMPT.md`. Copy each file exactly as-is without modifications. Create the additional documentation files (QUICK_START, MODIFICATIONS_REQUIRED, ARCHITECTURE, TROUBLESHOOTING). Create package.json with dependencies and .env.example with all environment variables. Extract auth schema models to auth-schema.prisma. Verify all 20+ files are copied and the directory structure matches the specification."**

---

**Estimated Time**: 10-15 minutes for AI to complete all file copying and documentation.

**Note**: This creates a complete, standalone auth system that can be dropped into any Next.js 15 project.

