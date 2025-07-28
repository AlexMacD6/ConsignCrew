## Changelog

- Fixed module resolution errors in API routes
  - Updated TypeScript configuration to map `@/*` to `./app/*` instead of `./src/*`
  - Standardized Prisma imports to use `@/lib/prisma` alias
  - Fixed incorrect relative path calculations in API routes
- Updated tsconfig.json path mapping for proper app directory support
- Standardized import patterns across API routes

---

## Testing Instructions

1. Pull this branch.
2. Run `npm install` to ensure all dependencies are up to date.
3. Start the application with `npm run dev`.
4. Check console for any module resolution errors - should be none.
5. Test API endpoints that use Prisma:
   - `/api/questions` - should load without errors
   - `/api/profile` - should function correctly
   - `/api/admin/*` routes - should resolve imports properly
6. Verify that all database operations work correctly.
7. Test that the application builds without TypeScript errors. 