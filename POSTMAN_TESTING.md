# Postman Testing Guide - Agora Authentication API

## Base URL
```
http://localhost:3001
```

## Authentication Endpoints

### 1. Sign Up
**POST** `/auth/signup`

**Request Body:**
```json
{
  "fullName": "John Doe",
  "email": "john.doe@example.com",
  "password": "SecurePass123"
}
```

**Expected Response (201):**
```json
{
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "user-uuid",
      "email": "john.doe@example.com",
      "fullName": "John Doe",
      "createdAt": "2026-10-20T01:00:00.000Z"
    },
    "expiresAt": "2026-10-27T01:00:00.000Z"
  },
  "statusCode": 201,
  "timestamp": "2026-10-20T01:00:00.000Z"
}
```

**Notes:**
- Password must be at least 8 characters
- Email will be sent to user for verification (requires Supabase email setup)
- Creates user in Supabase Auth and profiles table

---

### 2. Login
**POST** `/auth/login`

**Request Body:**
```json
{
  "email": "john.doe@example.com",
  "password": "SecurePass123"
}
```

**Expected Response (200):**
```json
{
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "user-uuid",
      "email": "john.doe@example.com",
      "fullName": "John Doe",
      "createdAt": "2026-10-20T01:00:00.000Z"
    },
    "expiresAt": "2026-10-27T01:00:00.000Z"
  },
  "statusCode": 200,
  "timestamp": "2026-10-20T01:00:00.000Z"
}
```

**Error Response (401):**
```json
{
  "statusCode": 401,
  "message": "Invalid credentials",
  "timestamp": "2026-10-20T01:00:00.000Z"
}
```

---

### 3. Verify Email
**POST** `/auth/verify-email`

**Request Body:**
```json
{
  "email": "john.doe@example.com",
  "code": "123456"
}
```

**Expected Response (200):**
```json
{
  "data": {
    "success": true
  },
  "statusCode": 200,
  "timestamp": "2026-10-20T01:00:00.000Z"
}
```

**Notes:**
- Code must be exactly 6 digits
- Code is sent to user's email by Supabase
- Requires Supabase email verification to be enabled

---

### 4. Forgot Password
**POST** `/auth/forgot-password`

**Request Body:**
```json
{
  "email": "john.doe@example.com"
}
```

**Expected Response (200):**
```json
{
  "data": {
    "success": true
  },
  "statusCode": 200,
  "timestamp": "2026-10-20T01:00:00.000Z"
}
```

**Notes:**
- Sends password reset email to user
- Reset link will redirect to `${FRONTEND_URL}/reset-password`
- Requires Supabase email templates to be configured

---

### 5. Reset Password
**POST** `/auth/reset-password`

**Request Body:**
```json
{
  "token": "reset-token-from-email",
  "newPassword": "NewSecurePass456"
}
```

**Expected Response (200):**
```json
{
  "data": {
    "success": true
  },
  "statusCode": 200,
  "timestamp": "2026-10-20T01:00:00.000Z"
}
```

**Notes:**
- Token comes from the password reset email
- New password must be at least 8 characters
- Updates password in Supabase Auth

---

### 6. Social Authentication (Google)
**POST** `/auth/social`

**Request Body:**
```json
{
  "provider": "google",
  "accessToken": "google-oauth-access-token"
}
```

**Expected Response (200):**
```json
{
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "user-uuid",
      "email": "user@gmail.com",
      "fullName": "Google User",
      "createdAt": "2026-10-20T01:00:00.000Z"
    },
    "expiresAt": "2026-10-27T01:00:00.000Z"
  },
  "statusCode": 200,
  "timestamp": "2026-10-20T01:00:00.000Z"
}
```

**Notes:**
- Requires Google OAuth to be configured in Supabase
- Access token must be obtained from Google OAuth flow
- Creates or updates user profile automatically

---

### 7. Social Authentication (Apple)
**POST** `/auth/social`

**Request Body:**
```json
{
  "provider": "apple",
  "accessToken": "apple-oauth-access-token"
}
```

**Expected Response (200):**
```json
{
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "user-uuid",
      "email": "user@icloud.com",
      "fullName": "Apple User",
      "createdAt": "2026-10-20T01:00:00.000Z"
    },
    "expiresAt": "2026-10-27T01:00:00.000Z"
  },
  "statusCode": 200,
  "timestamp": "2026-10-20T01:00:00.000Z"
}
```

**Notes:**
- Requires Apple OAuth to be configured in Supabase
- Access token must be obtained from Apple OAuth flow
- Creates or updates user profile automatically

---

### 8. Refresh Token
**POST** `/auth/refresh`

**Request Body:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Expected Response (200):**
```json
{
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  },
  "statusCode": 200,
  "timestamp": "2026-10-20T01:00:00.000Z"
}
```

**Notes:**
- Use refresh token from login/signup response
- Returns new access token
- Refresh token is valid for 30 days

---

### 9. Logout
**POST** `/auth/logout`

**Request Body:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Expected Response (200):**
```json
{
  "data": {
    "success": true
  },
  "statusCode": 200,
  "timestamp": "2026-10-20T01:00:00.000Z"
}
```

**Notes:**
- Invalidates the session
- Token should be the access token

---

## Health Check Endpoints

### 10. Health Check
**GET** `/health`

**Expected Response (200):**
```json
{
  "data": {
    "status": "ok",
    "timestamp": "2026-10-20T01:00:00.000Z"
  },
  "statusCode": 200,
  "timestamp": "2026-10-20T01:00:00.000Z"
}
```

---

### 11. Database Health Check
**GET** `/health/database`

**Expected Response (200):**
```json
{
  "data": {
    "status": "ok",
    "database": "connected",
    "supabaseUrl": "https://bmboulgbleatsswgqlyr.supabase.co",
    "timestamp": "2026-10-20T01:00:00.000Z"
  },
  "statusCode": 200,
  "timestamp": "2026-10-20T01:00:00.000Z"
}
```

---

## Testing Checklist

### Basic Setup
- [ ] Server is running on http://localhost:3001
- [ ] Supabase credentials are configured in `.env`
- [ ] JWT_SECRET is set in `.env`
- [ ] `profiles` table exists in Supabase

### Authentication Flow
- [ ] Test health check endpoint
- [ ] Test database connection endpoint
- [ ] Sign up a new user
- [ ] Login with the same user
- [ ] Verify email (if Supabase email is configured)
- [ ] Request password reset
- [ ] Reset password with token
- [ ] Refresh access token
- [ ] Logout user

### Error Cases
- [ ] Login with wrong password (should return 401)
- [ ] Sign up with existing email (should return error)
- [ ] Verify email with wrong code (should return error)
- [ ] Reset password with invalid token (should return error)
- [ ] Refresh with invalid token (should return error)

### Social Auth (Optional)
- [ ] Test Google OAuth (requires Supabase Google setup)
- [ ] Test Apple OAuth (requires Supabase Apple setup)

---

## Postman Collection Setup

### Environment Variables
Create an environment in Postman with these variables:

```
BASE_URL = http://localhost:3001
TEST_EMAIL = test@example.com
TEST_PASSWORD = TestPass123
TEST_FULLNAME = Test User
```

### Test Data Suggestions
Use these test credentials for testing:

**User 1:**
```json
{
  "fullName": "Test User One",
  "email": "testuser1@example.com",
  "password": "TestPass123"
}
```

**User 2:**
```json
{
  "fullName": "Test User Two",
  "email": "testuser2@example.com",
  "password": "TestPass456"
}
```

---

## Common Issues and Solutions

### Issue: "Missing Supabase environment variables"
**Solution:** Ensure SUPABASE_URL and SUPABASE_KEY are set in `.env`

### Issue: "Database not connected"
**Solution:** Check Supabase credentials and ensure database is accessible

### Issue: "Invalid credentials" on login
**Solution:** Verify email and password are correct, user exists in Supabase

### Issue: Email verification not working
**Solution:** Enable email provider in Supabase Dashboard and configure email templates

### Issue: Social auth failing
**Solution:** Configure OAuth providers in Supabase Dashboard with valid credentials

---

## Swagger Documentation

For interactive testing, you can also use Swagger UI:
```
http://localhost:3001/api
```

Swagger provides:
- Visual interface for all endpoints
- Request/response schemas
- Try-it-out functionality
- Real-time testing

---

## Next Steps After Testing

Once all endpoints are tested successfully:

1. **Configure Supabase Email** (if not done)
   - Enable email provider
   - Configure email templates
   - Set up SMTP or use Supabase email service

2. **Configure OAuth Providers** (if needed)
   - Set up Google OAuth in Supabase
   - Set up Apple OAuth in Supabase
   - Add redirect URLs

3. **Test Email Flows**
   - Test actual email verification
   - Test password reset email

4. **Proceed to Frontend Integration**
   - Share API documentation with frontend team
   - Provide Swagger URL
   - Share environment variable requirements
