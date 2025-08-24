# AWS SES Email Verification Setup Guide

## 🚨 Current Issue
**Error**: `MessageRejected: Email address is not verified. The following identities failed the check in region US-EAST-1: noreply@treasurehub.store`

## 📧 Quick Solutions

### Option 1: Verify Your Domain in SES (Recommended)
1. **Go to AWS SES Console**: https://console.aws.amazon.com/ses/
2. **Navigate to**: Configuration → Verified identities
3. **Click**: "Create identity"
4. **Select**: "Domain"
5. **Enter**: `treasurehub.store`
6. **Follow verification process** (add DNS records)
7. **Wait for verification** (usually 72 hours max)

### Option 2: Verify Individual Email Address (Quick Test)
1. **Go to AWS SES Console**: https://console.aws.amazon.com/ses/
2. **Navigate to**: Configuration → Verified identities  
3. **Click**: "Create identity"
4. **Select**: "Email address"
5. **Enter**: `noreply@treasurehub.store` (or your preferred sender email)
6. **Check email** and click verification link
7. **Update environment variable**: `SES_FROM_EMAIL=noreply@treasurehub.store`

### Option 3: Use Your Personal Verified Email (Immediate Testing)
1. **Verify your personal email** (like Gmail) following Option 2
2. **Update your `.env.local`**:
   ```bash
   SES_FROM_EMAIL=your-email@gmail.com
   # or
   AWS_SES_VERIFIED_EMAIL=your-email@gmail.com
   ```

## 🔧 Environment Variables Setup

Add these to your `.env.local` file:

```bash
# AWS SES Configuration
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_access_key_here
AWS_SECRET_ACCESS_KEY=your_secret_access_key_here

# Email Configuration  
SES_FROM_EMAIL=noreply@treasurehub.store
# OR use backup verified email
AWS_SES_VERIFIED_EMAIL=your-verified-email@domain.com

# Application URL
NEXT_PUBLIC_SITE_URL=https://treasurehub.store
```

## 🏗️ SES Account Configuration

### Check SES Sandbox Mode
1. **Go to AWS SES Console**
2. **Check**: Account dashboard
3. **If in Sandbox**:
   - Can only send to verified email addresses
   - Limited to 200 emails/day
   - Request production access for unlimited sending

### Request Production Access (For Live System)
1. **Navigate to**: Account dashboard → Request production access
2. **Fill out**: Use case description
3. **Include**: 
   - Business purpose
   - Expected volume
   - Bounce/complaint handling process
4. **Wait for approval** (usually 24-48 hours)

## 🧪 Testing the Fix

### Test with Verified Email
```bash
# Set environment variable
export SES_FROM_EMAIL="your-verified-email@domain.com"

# Restart your development server
npm run dev
```

### Verify Email Sending
1. **Go to delivery scheduler**
2. **Assign time slots** to an order
3. **Check console** for success/error messages
4. **Verify email** arrives at customer address

## 🔍 Troubleshooting

### Common Issues
1. **Wrong Region**: Ensure `AWS_REGION` matches your SES setup
2. **Invalid Credentials**: Check AWS access keys have SES permissions
3. **Rate Limits**: In sandbox mode, limited sends per day
4. **Bounce/Complaints**: High bounce rates can suspend sending

### Debug Commands
```bash
# Check environment variables
echo $AWS_REGION
echo $SES_FROM_EMAIL

# Test AWS credentials
aws ses get-send-quota --region us-east-1
```

## 📊 Monitoring

### AWS SES Console
- **Sending statistics**: Track delivery rates
- **Reputation metrics**: Monitor bounce/complaint rates  
- **Suppression list**: Check blocked addresses

### Application Logs
- **Success logs**: Check for MessageId in responses
- **Error logs**: Monitor for SES-specific errors
- **Email tracking**: Implement delivery confirmations

## 🚀 Production Recommendations

1. **Domain Verification**: Always verify your domain, not individual emails
2. **DKIM Setup**: Enable DKIM for better deliverability
3. **SPF Records**: Configure SPF for your domain
4. **Monitoring**: Set up CloudWatch alarms for failures
5. **Feedback Loop**: Handle bounces and complaints automatically

## 📞 Support

If you continue having issues:
1. **Check AWS SES quotas** and limits
2. **Verify IAM permissions** for SES
3. **Contact AWS Support** for SES-specific issues
4. **Test with AWS CLI** to isolate issues
