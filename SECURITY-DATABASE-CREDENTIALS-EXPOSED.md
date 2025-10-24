# 🚨 URGENT: Database Credentials Exposed in GitHub Repository

## Summary

Database credentials were found hardcoded in script files and pushed to GitHub. This is a **critical security issue** that requires immediate action.

## Exposed Files

1. `scripts/check-backup-schema.js` (commit d1cc2e9 and earlier)
2. `scripts/import-from-backup-branch.js` (commit 40ae0fc and earlier)

## What Was Exposed

- **Database Host**: `ep-old-bread-aefqou3d-pooler.c-2.us-east-2.aws.neon.tech`
- **Username**: `neondb_owner`
- **Password**: `npg_Bsjwzn3Kk7Vq`
- **Database Name**: `neondb`
- **Connection String**: Full PostgreSQL connection string with credentials

## Repository

- **GitHub Repo**: https://github.com/AlexMacD6/ConsignCrew.git
- **Branch**: treasurehub (and possibly others)

---

## ✅ Actions Completed

1. ✅ **Fixed script files** - Both scripts now use environment variables (`BACKUP_DATABASE_URL`)
2. ✅ **Identified exposed commits** - Credentials are in git history

---

## 🔴 IMMEDIATE ACTIONS REQUIRED

### 1. Rotate Your Database Password (CRITICAL - DO THIS NOW)

Your database password is exposed and must be changed immediately.

#### Steps to Rotate Password in Neon:

1. Log in to your Neon console: https://console.neon.tech
2. Select your project
3. Go to **Settings** → **Connection Details**
4. Click **Reset Password** for the `neondb_owner` user
5. Copy the new connection string
6. Update your `.env` file with the new `DATABASE_URL`
7. Update any Vercel/production environment variables

### 2. Update Environment Variables

After rotating the password, update:

**Local `.env` file:**
```bash
DATABASE_URL="postgresql://neondb_owner:NEW_PASSWORD@ep-old-bread-aefqou3d-pooler.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require"
BACKUP_DATABASE_URL="your-backup-connection-string"  # If needed
```

**Vercel Environment Variables:**
1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Update `DATABASE_URL` with the new connection string
4. Deploy to apply changes

### 3. Remove Credentials from Git History

The credentials are in your git history. You have two options:

#### Option A: Remove from Git History (Recommended but Complex)

Use BFG Repo-Cleaner or `git filter-branch` to remove credentials from history:

```bash
# Install BFG Repo-Cleaner
# Download from: https://rtyley.github.io/bfg-repo-cleaner/

# Create a passwords.txt file with the exposed password
echo "npg_Bsjwzn3Kk7Vq" > passwords.txt

# Run BFG to remove the password from all commits
java -jar bfg.jar --replace-text passwords.txt

# Clean up
git reflog expire --expire=now --all
git gc --prune=now --aggressive

# Force push to GitHub (WARNING: This rewrites history)
git push origin --force --all
```

**WARNING**: This rewrites git history and will affect anyone who has cloned the repository. Coordinate with your team first.

#### Option B: Commit the Fixes and Rotate Password (Simpler)

If you're the only developer or this is early in the project:

1. ✅ The fixes are already made to the script files
2. Commit these changes
3. Rotate the database password (most important!)
4. The old password in git history will be useless

```bash
git add scripts/check-backup-schema.js scripts/import-from-backup-branch.js
git commit -m "Security fix: Remove hardcoded database credentials"
git push
```

### 4. Verify `.gitignore` Excludes `.env`

Make sure your `.env` file is never committed:

```bash
# Check if .env is in .gitignore
grep "^\.env$" .gitignore

# If not found, add it
echo ".env" >> .gitignore
git add .gitignore
git commit -m "Ensure .env is in .gitignore"
```

### 5. Check for Leaked Secrets Scanning

Enable GitHub's secret scanning (if you have a paid plan) or use tools like:
- **TruffleHog**: https://github.com/trufflesecurity/trufflehog
- **GitGuardian**: https://www.gitguardian.com/
- **Gitleaks**: https://github.com/gitleaks/gitleaks

---

## 📝 How to Use the Fixed Scripts

The scripts now require environment variables:

### `check-backup-schema.js`
```bash
BACKUP_DATABASE_URL="postgresql://user:pass@host/db" node scripts/check-backup-schema.js
```

### `import-from-backup-branch.js`
```bash
BACKUP_DATABASE_URL="postgresql://user:pass@host/db" node scripts/import-from-backup-branch.js
```

Or add to your `.env` file:
```bash
BACKUP_DATABASE_URL="your-backup-connection-string"
```

---

## 🔒 Prevention for the Future

1. **Never hardcode credentials** - Always use environment variables
2. **Use `.env` files** - Keep them in `.gitignore`
3. **Use pre-commit hooks** - Tools like `git-secrets` or `detect-secrets`
4. **Rotate credentials regularly** - Best practice for security
5. **Use secret management** - Consider AWS Secrets Manager, HashiCorp Vault, or similar
6. **Enable GitHub secret scanning** - If available on your plan

---

## Timeline

- **Exposure Date**: At least since commit 40ae0fc (Admin Dashboard Performance Optimization)
- **Detection Date**: October 24, 2025
- **Fix Applied**: October 24, 2025
- **Password Rotation**: PENDING (DO THIS NOW!)

---

## Priority

**CRITICAL** - Action required within the next few hours.

The exposed credentials provide full access to your database. While the repository may be private, anyone with access (current or former collaborators, or if the repo becomes public) could access your database.

---

## Questions?

If you need help with any of these steps, especially rotating the Neon password or cleaning git history, please reach out immediately.

