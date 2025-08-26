# 🚨 URGENT: DNS Fix Required for Email Delivery

## Problem
Your emails are being rejected due to DMARC policy. Gmail error:
```
550 5.7.26 Unauthenticated email from treasurehub.club is not accepted due to domain's DMARC policy
```

## Root Cause
1. **SPF Record**: Authorizes Outlook but NOT AWS SES
2. **DMARC Policy**: Set to `p=reject` (too strict)

## DNS Changes Required

### 1. Update SPF Record (TXT Record)
**Name**: `@` or `treasurehub.club`  
**Current Value**: `v=spf1 include:spf.protection.outlook.com -all`  
**New Value**: `v=spf1 include:spf.protection.outlook.com include:amazonses.com ~all`

**Critical Changes**:
- ✅ Added `include:amazonses.com` (authorizes AWS SES)
- ✅ Changed `-all` to `~all` (soft fail instead of hard fail)

### 2. Update DMARC Policy (TXT Record)
**Name**: `_dmarc`  
**Current Value**: `v=DMARC1; p=reject; adkim=r; aspf=r; rua=mailto:dmarc_rua@onsecureserver.net;`  
**New Value**: `v=DMARC1; p=quarantine; adkim=r; aspf=r; rua=mailto:dmarc_rua@onsecureserver.net;`

**Critical Changes**:
- ✅ Changed `p=reject` to `p=quarantine` (less restrictive)

### 3. Add DKIM for AWS SES (Recommended)
You should also set up DKIM signing in AWS SES Console:
1. Go to AWS SES Console → Verified identities
2. Select `treasurehub.club` 
3. Enable DKIM signing
4. Add the provided CNAME records to your DNS

## How to Update DNS

### If using GoDaddy/Namecheap:
1. Log into your domain registrar
2. Go to DNS Management
3. Find the existing TXT records
4. Update the SPF record value
5. Update the DMARC record value
6. Save changes

### DNS Propagation
- Changes take 5-60 minutes to propagate
- Test after 1 hour to be safe

## Verification Commands

After making changes, test with:
```bash
nslookup -q=TXT treasurehub.club
nslookup -q=TXT _dmarc.treasurehub.club
```

## Temporary Workaround

While waiting for DNS changes, you can temporarily use a verified personal email:

1. In AWS SES Console, verify your personal email (like Gmail)
2. Update your `.env` file:
   ```env
   AWS_SES_VERIFIED_EMAIL=your-personal-email@gmail.com
   ```
3. Your app will use this instead of no-reply@treasurehub.club

## Priority: URGENT
These DNS changes must be made immediately to restore email functionality.

## After DNS Changes
1. Wait 1 hour for propagation
2. Test email sending 
3. Monitor for 24 hours
4. Consider moving DMARC to `p=reject` after everything works

---
*This issue prevents ALL outbound emails from working correctly.*
