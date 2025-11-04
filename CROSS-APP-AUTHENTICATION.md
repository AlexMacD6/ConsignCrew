# Cross-App Authentication Integration Guide

## Overview

This guide explains how to integrate the **Selling to Sold** app (or any external application) with **TreasureHub** authentication system. This allows users to register and sign in through your external app while creating accounts in the TreasureHub database.

---

## Architecture

```
┌─────────────────────┐          ┌─────────────────────┐
│  Selling to Sold    │          │    TreasureHub      │
│    (External App)   │◄────────►│   (Auth Provider)   │
│                     │   API    │                     │
│  - Registration UI  │  Calls   │  - User Database    │
│  - Login UI         │          │  - Better Auth      │
│  - User Management  │          │  - Stripe Integration│
└─────────────────────┘          └─────────────────────┘
```

---

## Setup Instructions

### 1. Environment Variables (TreasureHub)

Add these to your TreasureHub `.env` file:

```bash
# External App Integration
EXTERNAL_APP_API_KEY=your_secure_random_api_key_32_characters_minimum
EXTERNAL_APP_ORIGIN=https://sellingtosold.yourapp.com
```

**Generate a secure API key:**
```bash
# Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Or use an online generator (use a secure one)
```

### 2. Environment Variables (Selling to Sold App)

Add these to your external app's `.env` file:

```bash
TREASUREHUB_API_URL=https://treasurehub.club
TREASUREHUB_API_KEY=same_api_key_from_above
```

---

## API Endpoints

### 1. Register New User

**Endpoint:** `POST /api/external/register`

**Headers:**
```javascript
{
  'Content-Type': 'application/json',
  'X-API-Key': 'your_api_key_here'
}
```

**Request Body:**
```javascript
{
  "email": "user@example.com",
  "password": "securePassword123",
  "name": "John Doe",
  "mobilePhone": "+1234567890",  // Optional
  "userType": "buyer",            // Optional: "buyer" or "seller"
  "appSource": "selling-to-sold"  // Optional: track registration source
}
```

**Success Response (201):**
```javascript
{
  "success": true,
  "message": "User registered successfully",
  "user": {
    "id": "user_abc123",
    "email": "user@example.com",
    "name": "John Doe",
    "emailVerified": false
  },
  "requiresEmailVerification": true,
  "verificationEmailSent": true
}
```

**Error Responses:**

- **400 Bad Request** - Missing required fields or password too short
- **401 Unauthorized** - Invalid or missing API key
- **409 Conflict** - User with email already exists
- **500 Internal Server Error** - Server error during registration

---

### 2. Verify User Login

**Endpoint:** `POST /api/external/login`

**Headers:**
```javascript
{
  'Content-Type': 'application/json',
  'X-API-Key': 'your_api_key_here'
}
```

**Request Body:**
```javascript
{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

**Success Response (200):**
```javascript
{
  "success": true,
  "message": "Login successful",
  "user": {
    "id": "user_abc123",
    "email": "user@example.com",
    "name": "John Doe",
    "emailVerified": true
  }
}
```

**Error Responses:**

- **400 Bad Request** - Missing email or password
- **401 Unauthorized** - Invalid credentials or API key
- **403 Forbidden** - Email not verified
- **500 Internal Server Error** - Server error

---

## Implementation Examples

### React/Next.js (Selling to Sold App)

```typescript
// lib/treasurehub-auth.ts

const TREASUREHUB_API_URL = process.env.NEXT_PUBLIC_TREASUREHUB_API_URL;
const TREASUREHUB_API_KEY = process.env.TREASUREHUB_API_KEY;

/**
 * Register a new user in TreasureHub
 */
export async function registerUser(data: {
  email: string;
  password: string;
  name: string;
  mobilePhone?: string;
  userType?: 'buyer' | 'seller';
}) {
  try {
    const response = await fetch(`${TREASUREHUB_API_URL}/api/external/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': TREASUREHUB_API_KEY!,
      },
      body: JSON.stringify({
        ...data,
        appSource: 'selling-to-sold',
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || 'Registration failed');
    }

    return result;
  } catch (error) {
    console.error('Registration error:', error);
    throw error;
  }
}

/**
 * Verify user login credentials
 */
export async function verifyLogin(email: string, password: string) {
  try {
    const response = await fetch(`${TREASUREHUB_API_URL}/api/external/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': TREASUREHUB_API_KEY!,
      },
      body: JSON.stringify({ email, password }),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || 'Login failed');
    }

    return result;
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
}
```

### Usage Example

```typescript
// components/RegisterForm.tsx

'use client';

import { useState } from 'react';
import { registerUser } from '@/lib/treasurehub-auth';

export default function RegisterForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const result = await registerUser({
        email,
        password,
        name,
        userType: 'seller', // Selling to Sold users are sellers
      });

      setSuccess(true);
      console.log('User registered:', result.user);
      
      // Show success message
      alert('Registration successful! Please check your email to verify your account.');
      
      // Redirect or handle success
      // router.push('/verify-email');
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded text-red-600">
          {error}
        </div>
      )}
      
      {success && (
        <div className="p-3 bg-green-50 border border-green-200 rounded text-green-600">
          Registration successful! Please check your email.
        </div>
      )}

      <input
        type="text"
        placeholder="Full Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
        className="w-full px-4 py-2 border rounded"
      />

      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        className="w-full px-4 py-2 border rounded"
      />

      <input
        type="password"
        placeholder="Password (min 8 characters)"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
        minLength={8}
        className="w-full px-4 py-2 border rounded"
      />

      <button
        type="submit"
        disabled={loading}
        className="w-full px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
      >
        {loading ? 'Registering...' : 'Register'}
      </button>
    </form>
  );
}
```

---

## Security Considerations

### 1. **API Key Protection**
- Never expose your API key in client-side code
- Keep it in environment variables on the server side only
- Rotate API keys periodically
- Use different keys for development and production

### 2. **HTTPS Required**
- All API calls MUST use HTTPS in production
- Never send credentials over unencrypted connections

### 3. **Rate Limiting** (Recommended)
Consider implementing rate limiting on your external app to prevent abuse:

```typescript
// Example with rate-limit library
import rateLimit from 'express-rate-limit';

const registerLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 registration attempts per window
});
```

### 4. **Input Validation**
Always validate and sanitize user input before sending to the API.

---

## Testing

### Test with curl

**Register User:**
```bash
curl -X POST https://treasurehub.club/api/external/register \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your_api_key_here" \
  -d '{
    "email": "test@example.com",
    "password": "testPassword123",
    "name": "Test User",
    "userType": "seller",
    "appSource": "selling-to-sold"
  }'
```

**Login User:**
```bash
curl -X POST https://treasurehub.club/api/external/login \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your_api_key_here" \
  -d '{
    "email": "test@example.com",
    "password": "testPassword123"
  }'
```

---

## What Happens on Registration

1. **User Creation** - User account created in TreasureHub database
2. **Email Verification** - Verification email sent to user
3. **Stripe Customer** - Stripe customer created (for buyers)
4. **Organization Assignment** - User added to appropriate organization (buyers/sellers)
5. **Return Response** - User details returned to Selling to Sold app

---

## Email Verification Flow

1. User registers through Selling to Sold app
2. TreasureHub sends verification email with link
3. User clicks link in email (redirects to TreasureHub)
4. Email verified in TreasureHub database
5. User can now log in through either app

**Note:** Consider redirecting verified users back to Selling to Sold app with a success parameter.

---

## Troubleshooting

### Common Issues

**401 Unauthorized:**
- Check that API key is correctly set in environment variables
- Verify API key matches between apps
- Ensure `X-API-Key` header is being sent

**409 Conflict (User exists):**
- Email already registered
- Use login endpoint instead
- Provide "already registered" message to user

**403 Forbidden (Email not verified):**
- User needs to verify email before logging in
- Resend verification email if needed
- Consider implementing resend verification endpoint

**CORS Errors:**
- Verify `EXTERNAL_APP_ORIGIN` is set correctly
- Check that your domain matches the allowed origin
- Ensure preflight OPTIONS requests are handled

---

## Future Enhancements

### Potential Features:
1. **SSO (Single Sign-On)** - Users logged into Selling to Sold automatically logged into TreasureHub
2. **OAuth Provider** - Turn TreasureHub into OAuth provider
3. **Webhook Events** - Notify Selling to Sold of user status changes
4. **Password Reset API** - Allow password resets from external app
5. **User Profile Sync** - Sync user profile updates between apps

---

## Support

For questions or issues:
- Email: support@treasurehub.club
- Check TreasureHub server logs for detailed error messages
- Monitor API response codes and error messages

---

## Changelog

- **v1.0** (2025-11-04) - Initial cross-app authentication implementation
  - Registration endpoint
  - Login verification endpoint
  - API key authentication
  - Email verification flow

