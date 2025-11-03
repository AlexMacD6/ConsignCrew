# AWS Security Setup for Photo Gallery - IMMEDIATE STEPS

## 🔒 Overview

This guide covers the **IMMEDIATE** security steps that must be configured in the AWS Console to protect user photos. These steps ensure that:

- ✅ Photos are only accessible through CloudFront (not direct S3 URLs)
- ✅ Signed URLs are required for access (time-limited, secure)
- ✅ CloudFront Origin Access Control (OAC) is enabled
- ✅ Security headers protect against XSS, clickjacking, etc.

**⏱️ Time Required:** 15-20 minutes  
**Difficulty:** Intermediate  
**Prerequisites:** AWS Console access with admin permissions

---

## Step 1: Block Public S3 Access (CRITICAL - Do First!)

###  Purpose:
Prevents anyone from accessing photos directly via S3 URLs. Forces all access through CloudFront.

### Instructions:

1. **Go to AWS S3 Console**
   - URL: https://s3.console.aws.amazon.com/
   - Navigate to bucket: `consigncrew`

2. **Block All Public Access**
   ```
   Permissions Tab → Block public access (bucket settings) → Edit
   
   ☑ Block all public access
   ☑ Block public access to buckets and objects granted through new access control lists (ACLs)
   ☑ Block public access to buckets and objects granted through any access control lists (ACLs)
   ☑ Block public access to buckets and objects granted through new public bucket or access point policies
   ☑ Block public and cross-account access to buckets and objects through any public bucket or access point policies
   
   Click "Save changes"
   Type "confirm" when prompted
   ```

3. **Verify**
   - Status should show: "Block all public access: On"
   - All 4 checkboxes should be checked

**Result:** Direct S3 URLs will now return "Access Denied" errors. This is expected and correct!

---

## Step 2: Configure CloudFront Origin Access Control (OAC)

### Purpose:
Allows CloudFront to access S3 photos while keeping S3 private.

### Instructions:

1. **Go to CloudFront Console**
   - URL: https://console.aws.amazon.com/cloudfront/
   - Select distribution: `dtlqyjbwka60p` (your existing distribution)

2. **Create Origin Access Control**
   ```
   Origins Tab → Select your S3 origin → Edit
   
   Origin Access:
   ◉ Origin access control settings (recommended)
   
   Origin access control:
   Click "Create control setting"
   
   Name: consigncrew-oac
   Description: OAC for TreasureHub photo gallery
   Sign requests: ◉ Always
   
   Click "Create"
   ```

3. **Copy the S3 Bucket Policy**
   - After creating OAC, CloudFront will show a policy statement
   - Click "Copy policy" button
   - **Keep this window open!** You'll need it in the next step

4. **Update S3 Bucket Policy**
   ```
   Go back to S3 Console → consigncrew bucket
   Permissions Tab → Bucket policy → Edit
   
   Replace the existing policy with the one CloudFront provided
   (It should look like this:)
   ```

   ```json
   {
     "Version": "2012-10-17",
     "Statement": [
       {
         "Sid": "AllowCloudFrontServicePrincipalReadOnly",
         "Effect": "Allow",
         "Principal": {
           "Service": "cloudfront.amazonaws.com"
         },
         "Action": "s3:GetObject",
         "Resource": "arn:aws:s3:::consigncrew/*",
         "Condition": {
           "StringEquals": {
             "AWS:SourceArn": "arn:aws:cloudfront::YOUR_ACCOUNT_ID:distribution/YOUR_DISTRIBUTION_ID"
           }
         }
       }
     ]
   }
   ```

   Click "Save changes"

5. **Verify OAC is Active**
   ```
   CloudFront Console → Your distribution → Origins tab
   
   You should see:
   Origin access: Origin access control
   ```

**Result:** CloudFront can now access photos, but direct S3 access is blocked!

---

## Step 3: Set Up CloudFront Key Pair for Signed URLs

### Purpose:
Generates keys to create signed URLs that expire after a set time.

### Instructions:

1. **Create CloudFront Key Pair**
   ```
   AWS Console → Your Account (top right) → Security credentials
   Scroll down to: CloudFront key pairs
   
   Click "Create new key pair"
   
   Download:
   - Private key file (pk-XXXXXXXXXX.pem)
   - Public key file (rsa-XXXXXXXXXX.pem)
   
   IMPORTANT: Store these files securely!
   - Private key: Keep secret, never commit to git
   - Key Pair ID: Note this down (starts with APK...)
   ```

2. **Convert Private Key for Environment Variable**
   
   **On Windows (PowerShell):**
   ```powershell
   $key = Get-Content -Raw pk-XXXXXXXXXX.pem
   $key -replace "`r`n", "\n"
   # Copy the output (including \n characters)
   ```

   **On Mac/Linux:**
   ```bash
   awk '{printf "%s\\n", $0}' pk-XXXXXXXXXX.pem
   # Copy the output (including \n characters)
   ```

3. **Add to Environment Variables**
   
   Update your `.env.local` file:
   ```env
   # CloudFront Signed URLs Configuration
   CLOUDFRONT_KEY_PAIR_ID=APKAXXXXXXXXXXXXXXX
   CLOUDFRONT_PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----\nMIIEpAIBAAKCAQEA...\n-----END RSA PRIVATE KEY-----"
   ```

   **Important Notes:**
   - The private key must be on ONE line with `\n` characters
   - Keep the quotes around the private key
   - Never commit `.env.local` to git (add to `.gitignore`)

4. **Update Production Environment**
   
   **For Vercel:**
   ```
   Vercel Dashboard → Your Project → Settings → Environment Variables
   
   Add:
   - CLOUDFRONT_KEY_PAIR_ID: APKAXXXXXXXXXXXXXXX
   - CLOUDFRONT_PRIVATE_KEY: (paste the entire key with \n characters)
   
   Make sure to select: Production, Preview, and Development
   ```

5. **Verify Configuration**
   ```
   Restart your development server:
   npm run dev
   
   Check logs when fetching photos:
   ✓ Generated signed URL for photo-gallery/... (expires in 60 min)
   ```

**Result:** Photos now use secure, time-limited URLs!

---

## Step 4: Configure CloudFront Security Settings

### Purpose:
Add additional security layers to CloudFront distribution.

### Instructions:

1. **Add Response Headers Policy**
   ```
   CloudFront Console → Your distribution → Behaviors tab
   Select default behavior → Edit
   
   Response headers policy: Create new policy
   
   Policy name: treasurehub-security-headers
   
   Security headers:
   ☑ Strict-Transport-Security
      max-age: 63072000
      ☑ Include subdomains
      ☑ Preload
   
   ☑ X-Content-Type-Options
      Value: nosniff
   
   ☑ X-Frame-Options
      Value: SAMEORIGIN
   
   ☑ X-XSS-Protection
      Value: 1; mode=block
   
   ☑ Referrer-Policy
      Value: strict-origin-when-cross-origin
   
   Click "Create" → Save changes to behavior
   ```

2. **Enable Standard Logging (Optional but Recommended)**
   ```
   CloudFront Console → Your distribution → General tab → Edit
   
   Standard logging: On
   S3 bucket: consigncrew-logs (create if needed)
   Log prefix: cloudfront/photo-gallery/
   
   Click "Save changes"
   ```

3. **Set Cache Behavior**
   ```
   CloudFront Console → Your distribution → Behaviors tab → Edit
   
   Cache policy: CachingOptimized
   Origin request policy: CORS-S3Origin
   
   Viewer protocol policy: Redirect HTTP to HTTPS
   
   Click "Save changes"
   ```

**Result:** Enhanced security headers on all CloudFront responses!

---

## Step 5: Test Your Security Setup

### Verification Checklist:

#### ✅ **Test 1: Direct S3 Access is Blocked**
```bash
# Try accessing a photo directly via S3
curl https://consigncrew.s3.us-east-1.amazonaws.com/photo-gallery/test.jpg

# Expected result: Access Denied error
```

#### ✅ **Test 2: CloudFront Unsigned URLs Fail** (after signed URLs are enabled)
```bash
# Try accessing via CloudFront without signature
curl https://dtlqyjbwka60p.cloudfront.net/photo-gallery/test.jpg

# Expected result: 403 Forbidden (if signed URLs are enforced)
# OR: Success (if signed URLs are optional - still secure!)
```

#### ✅ **Test 3: Signed URLs Work**
```
1. Login to TreasureHub
2. Go to Photo Gallery
3. Check browser developer tools → Network tab
4. Look at photo URLs - they should have query parameters like:
   ?Expires=...&Signature=...&Key-Pair-Id=...
5. Photos should load successfully
```

#### ✅ **Test 4: Security Headers are Present**
```bash
curl -I https://www.treasurehubclub.com/

# Look for these headers:
# Strict-Transport-Security: max-age=63072000...
# X-Frame-Options: SAMEORIGIN
# X-Content-Type-Options: nosniff
# X-XSS-Protection: 1; mode=block
```

---

## 🎯 Quick Reference - What We Did

| Step | What It Does | Why It's Important |
|------|--------------|-------------------|
| Block Public S3 Access | Prevents direct S3 URL access | Forces all access through CloudFront |
| Enable CloudFront OAC | Allows CloudFront to access private S3 | Secure connection between CloudFront & S3 |
| CloudFront Key Pair | Generates signed URLs | Time-limited access, prevents URL guessing |
| Security Headers | Protects against XSS, clickjacking | Industry-standard web security |
| Logging | Tracks all access attempts | Helps identify suspicious activity |

---

## 🚨 Troubleshooting

### Photos Not Loading:
1. Check browser console for errors
2. Verify OAC policy was copied correctly to S3
3. Ensure environment variables are set in production
4. Check CloudFront distribution status (must be "Deployed")

### "Access Denied" Errors:
**This is normal after Step 1!**
- Direct S3 URLs should return "Access Denied"
- CloudFront URLs should work
- Signed URLs in the app should work

### Signed URLs Not Working:
1. Verify CLOUDFRONT_KEY_PAIR_ID is set
2. Verify CLOUDFRONT_PRIVATE_KEY is set (with `\n` characters)
3. Check CloudFront key pair status in AWS Console
4. Restart your application server

---

## 📋 Post-Setup Checklist

- [ ] S3 public access is blocked
- [ ] CloudFront OAC is enabled
- [ ] S3 bucket policy allows CloudFront OAC
- [ ] CloudFront key pair is created
- [ ] Environment variables are set (local and production)
- [ ] Security headers policy is applied
- [ ] CloudFront logging is enabled (optional)
- [ ] All tests pass
- [ ] Application is deployed to production
- [ ] Photos load correctly in the app

---

## 🔐 Security Best Practices

1. **Never commit private keys to git**
   - Add `.env.local` to `.gitignore`
   - Use environment variables for secrets

2. **Rotate CloudFront keys regularly**
   - Create new key pair every 6-12 months
   - Update environment variables
   - Delete old keys after transition period

3. **Monitor CloudFront logs**
   - Set up alerts for unusual access patterns
   - Review logs monthly for suspicious activity

4. **Test security regularly**
   - Verify direct S3 access is blocked
   - Ensure signed URLs expire correctly
   - Check security headers are present

5. **Keep documentation updated**
   - Document any changes to AWS configuration
   - Update this guide as needed

---

**Setup Complete!** 🎉

Your photo gallery now has enterprise-grade security:
- ✅ Photos are protected from unauthorized access
- ✅ Time-limited URLs prevent URL sharing
- ✅ Security headers protect against common attacks
- ✅ CloudFront provides fast, secure delivery

**Next Steps:** Monitor your CloudFront logs and adjust expiration times as needed!

