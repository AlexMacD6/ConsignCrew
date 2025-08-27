# Fix for Outlook Email DMARC Rejection

## Problem
Sending emails from Outlook using `@treasurehub.club` address results in:
```
550 5.7.26 Unauthenticated email from treasurehub.club is not accepted due to domain's DMARC policy
```

## Root Cause
Your DMARC policy is set to `p=reject` which means ANY email that fails authentication gets rejected. Even though your SPF record correctly authorizes Outlook (`spf.protection.outlook.com`), the email may be failing DKIM or alignment checks.

## Current DNS Status
- ✅ **SPF**: Correctly authorizes Outlook servers
- ❌ **DMARC**: Too strict (`p=reject`) 
- ❓ **DKIM**: May not be properly configured for Outlook

## Solution: Update DMARC Policy

### Change DMARC Record
**Current**: `v=DMARC1; p=reject; adkim=r; aspf=r; rua=mailto:dmarc_rua@onsecureserver.net;`  
**Change to**: `v=DMARC1; p=quarantine; adkim=r; aspf=r; rua=mailto:dmarc_rua@onsecureserver.net;`

**What this does**:
- Changes from `p=reject` (hard fail) to `p=quarantine` (soft fail)
- Emails that fail authentication will go to spam folder instead of being rejected
- Allows legitimate emails to be delivered while maintaining security

## DNS Update Steps

### 1. Access Your DNS Management
- Log into your domain registrar (GoDaddy, Namecheap, etc.)
- Go to DNS Management for `treasurehub.club`

### 2. Find DMARC Record
- Look for TXT record with name `_dmarc`
- Current value starts with `v=DMARC1; p=reject;`

### 3. Update the Record
- Change `p=reject` to `p=quarantine`
- Keep everything else the same
- Save changes

### 4. Wait for Propagation
- DNS changes take 5-60 minutes to propagate
- Test again after 1 hour

## Alternative: More Permissive DMARC (Temporary)

If you want to be extra safe during testing:
```
v=DMARC1; p=none; adkim=r; aspf=r; rua=mailto:dmarc_rua@onsecureserver.net;
```

**`p=none`** means:
- No action taken on failed authentication
- Still collect reports for monitoring
- Most permissive setting

## Verification

After making changes, test with:
```bash
nslookup -q=TXT _dmarc.treasurehub.club
```

Should show the updated policy.

## Outlook-Specific Considerations

### 1. Check Outlook DKIM Setup
- In Microsoft 365 Admin Center
- Go to Security → Email Authentication
- Verify DKIM is enabled for `treasurehub.club`

### 2. Use Proper From Address
- Make sure you're sending from the correct email address
- Should match what's configured in Outlook/Microsoft 365

### 3. Check Microsoft 365 Settings
- Ensure your domain is properly verified in Microsoft 365
- Check that mail flow rules aren't interfering

## Long-term Recommendation

1. **Start with `p=quarantine`** - allows delivery but flags issues
2. **Monitor DMARC reports** for 1-2 weeks
3. **Fix any authentication issues** that show up in reports
4. **Eventually move to `p=reject`** once everything is working perfectly

## Priority
This is a DNS-level fix that must be done through your domain registrar, not through code changes.
