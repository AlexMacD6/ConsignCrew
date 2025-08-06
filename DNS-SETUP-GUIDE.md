# DNS Setup Guide for Email Deliverability

## Overview
To improve email deliverability and reduce spam folder placement, you need to set up proper DNS records for your domain `treasurehub.club`.

## Required DNS Records

### 1. SPF Record (Sender Policy Framework)
**Purpose**: Authorizes AWS SES to send emails from your domain

**Add this TXT record to your DNS:**
```
Name: @ (or treasurehub.club)
Type: TXT
Value: v=spf1 include:amazonses.com ~all
TTL: 3600 (or default)
```

### 2. DKIM Record (DomainKeys Identified Mail)
**Purpose**: Digitally signs emails to prove authenticity

**Steps:**
1. Go to AWS SES Console → Domains
2. Select your domain `treasurehub.club`
3. Click "Create DKIM"
4. Choose "Easy DKIM" with 2048-bit key
5. Copy the provided CNAME record and add it to your DNS

**Example CNAME record:**
```
Name: [provided-by-aws]._domainkey
Type: CNAME
Value: [provided-by-aws].dkim.amazonses.com
TTL: 3600
```

### 3. DMARC Record (Domain-based Message Authentication)
**Purpose**: Policy for handling unauthenticated emails

**Add this TXT record to your DNS:**
```
Name: _dmarc
Type: TXT
Value: v=DMARC1; p=quarantine; rua=mailto:dmarc@treasurehub.club; ruf=mailto:dmarc@treasurehub.club; pct=100; adkim=r; aspf=r;
TTL: 3600
```

### 4. MX Record (Mail Exchange)
**Purpose**: If you want to receive emails at your domain

**Add this MX record:**
```
Name: @
Type: MX
Value: 10 treasurehub-club.mail.protection.outlook.com
TTL: 3600
```

## AWS SES Configuration

### 1. Verify Domain Ownership
1. Go to AWS SES Console → Domains
2. Click "Verify a New Domain"
3. Enter `treasurehub.club`
4. Add the provided TXT record to your DNS
5. Wait for verification (can take up to 72 hours)

### 2. Set Up DKIM
1. In the domain settings, click "Create DKIM"
2. Choose "Easy DKIM"
3. Add the provided CNAME records to your DNS
4. Wait for DKIM verification

### 3. Monitor Sending Statistics
1. Go to AWS SES Console → Sending Statistics
2. Monitor bounce rate (keep under 2%)
3. Monitor complaint rate (keep under 0.1%)
4. Monitor delivery rate (should be >95%)

## Testing Your Setup

### 1. Check DNS Records
Use these online tools to verify your DNS records:
- [MXToolbox](https://mxtoolbox.com/)
- [DNS Checker](https://dnschecker.org/)
- [WhatIsMyIPAddress](https://whatismyipaddress.com/dns-lookup)

### 2. Test Email Deliverability
- Send test emails to Gmail, Outlook, Yahoo
- Check if emails land in inbox vs spam
- Use tools like [Mail Tester](https://www.mail-tester.com/)

### 3. Monitor DMARC Reports
- Set up email forwarding for dmarc@treasurehub.club
- Review weekly DMARC reports
- Adjust policy based on results

## Best Practices

### 1. Content Guidelines
- Avoid spam trigger words (FREE, URGENT, etc.)
- Use proper HTML structure
- Include plain text alternatives
- Keep images to a minimum
- Use consistent branding

### 2. Sending Practices
- Send from consistent addresses
- Maintain regular sending patterns
- Clean email lists regularly
- Honor unsubscribe requests immediately
- Monitor bounce and complaint rates

### 3. Technical Guidelines
- Use proper email headers
- Include sender information
- Add unsubscribe links for marketing emails
- Test emails across different clients
- Monitor sending reputation

## Troubleshooting

### Common Issues
1. **Emails still going to spam**: Check DNS propagation (can take 24-48 hours)
2. **DKIM not working**: Verify CNAME records are correct
3. **SPF too restrictive**: Ensure `~all` is used, not `-all`
4. **DMARC too strict**: Start with `p=none` and gradually increase

### Monitoring Tools
- [Sender Score](https://senderscore.org/)
- [Barracuda Reputation Block List](https://www.barracudacentral.org/lookups)
- [Spamhaus](https://www.spamhaus.org/lookup/)

## Next Steps
1. Set up DNS records as outlined above
2. Verify domain ownership in AWS SES
3. Enable DKIM signing
4. Monitor sending statistics
5. Test with various email providers
6. Adjust DMARC policy based on results

## Support
If you need help with DNS setup:
1. Contact your domain registrar
2. Check AWS SES documentation
3. Use AWS support if you have a support plan 