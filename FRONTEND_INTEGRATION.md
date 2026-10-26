# Frontend Developer Integration Guide

## API Access for Frontend Developer

### Base URL Structure

**Local Development:**
```
API Base URL: http://localhost:3000/api/v1
Swagger Docs: http://localhost:3000/docs
```

**Production (to be configured):**
```
API Base URL: https://your-api-domain.com/api/v1
Swagger Docs: https://your-api-domain.com/docs
```

**Important:**
- All API endpoints are prefixed with `/api/v1`
- Swagger documentation is at `/docs` (requires authentication)
- Swagger is disabled in production by default

---

## Option 1: Local Network Access (Recommended for Development)

**Step 1: Find your IP address**
```bash
# On macOS/Linux
ifconfig | grep "inet " | grep -v 127.0.0.1

# On Windows
ipconfig
```

**Step 2: Update `.env` file**
Ensure your `.env` file has:
```env
HOST=0.0.0.0
CORS_ORIGIN=http://frontend-developer-ip:3000
```

**Step 3: Share with frontend developer**
Provide them with:
```
API Base URL: http://YOUR_IP_ADDRESS:3000/api/v1
Swagger Docs: http://YOUR_IP_ADDRESS:3000/docs
```

Example:
```
API Base URL: http://192.168.1.100:3000/api/v1
Swagger Docs: http://192.168.1.100:3000/docs
```

**Step 4: Frontend CORS Configuration**
The frontend developer must configure their origin in the backend's `.env`:
```env
CORS_ORIGIN=http://frontend-ip:3000,https://frontend-domain.com
```

---

## Option 2: ngrok (Easiest for Remote Access)

**Step 1: Install ngrok**
```bash
# macOS (with Homebrew)
brew install ngrok

# Or download from https://ngrok.com/
```

**Step 2: Start ngrok**
```bash
ngrok http 3000
```

**Step 3: Share the URL**
ngrok will provide a URL like:
```
https://abc123.ngrok.io
```

Share this with frontend developer:
```
API Base URL: https://abc123.ngrok.io/api/v1
Swagger Docs: https://abc123.ngrok.io/docs
```

**Step 4: Update CORS**
Update `.env` to allow ngrok URLs:
```env
CORS_ORIGIN=https://abc123.ngrok.io
```

---

## Option 3: Deploy to Cloud (Production)

Deploy your API to a cloud provider like:
- **Vercel**
- **Render**
- **Railway**
- **AWS**
- **Heroku**

This will give you a permanent URL like:
```
https://api.agora.com
```

Then the base URL becomes:
```
API Base URL: https://api.agora.com/api/v1
```

---

## Swagger Documentation Access

Swagger documentation is protected with Basic Authentication.

**To access Swagger:**
1. Navigate to `http://localhost:3000/docs`
2. Enter credentials from `.env`:
   - Username: `SWAGGER_USER` (default: admin)
   - Password: `SWAGGER_PASSWORD` (default: change_this_password_in_production)

**Security Note:**
- Swagger is disabled in production by default (`SWAGGER_ENABLED=false`)
- Never commit real credentials to version control
- Change default Swagger password before deployment

---

## API Endpoint Inventory

### Authentication Endpoints (Public)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/v1/auth/signup` | Register new user | No |
| POST | `/api/v1/auth/login` | Login with credentials | No |
| POST | `/api/v1/auth/verify-email` | Verify email with OTP | No |
| POST | `/api/v1/auth/forgot-password` | Request password reset | No |
| POST | `/api/v1/auth/reset-password` | Reset password with token | No |
| POST | `/api/v1/auth/social` | Social auth (Google/Apple) | No |
| POST | `/api/v1/auth/refresh` | Refresh access token | No |

### Authentication Endpoints (Protected)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/v1/auth/logout` | Logout user | Yes (JWT) |

### Health Endpoints (Public)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/v1/health` | Health check | No |
| GET | `/api/v1/health/database` | Database status | No |

---

## Response Structure

All API responses follow this structure (due to global response interceptor):

```typescript
{
  "data": <actual response data>,
  "statusCode": 200,
  "timestamp": "2026-10-20T14:00:00.000Z"
}
```

**Example Success Response:**
```json
{
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "user-uuid",
      "email": "user@example.com",
      "fullName": "John Doe",
      "createdAt": "2026-10-20T14:00:00.000Z"
    },
    "expiresAt": "2026-10-27T14:00:00.000Z"
  },
  "statusCode": 200,
  "timestamp": "2026-10-20T14:00:00.000Z"
}
```

**Example Error Response:**
```json
{
  "statusCode": 401,
  "message": "Invalid credentials",
  "timestamp": "2026-10-20T14:00:00.000Z"
}
```

---

## Authentication Flow

### 1. Sign Up
```javascript
POST /api/v1/auth/signup
{
  "fullName": "John Doe",
  "email": "john@example.com",
  "password": "SecurePass123"
}

Response:
{
  "data": {
    "accessToken": "jwt-token",
    "refreshToken": "refresh-token",
    "user": { ... },
    "expiresAt": "2026-10-27T..."
  },
  "statusCode": 201,
  "timestamp": "..."
}
```

### 2. Login
```javascript
POST /api/v1/auth/login
{
  "email": "john@example.com",
  "password": "SecurePass123"
}

Response: Same structure as signup
```

### 3. Store Tokens
```javascript
// Store in localStorage or secure cookies
localStorage.setItem('accessToken', response.data.accessToken);
localStorage.setItem('refreshToken', response.data.refreshToken);
```

### 4. Use Access Token
```javascript
// Include in Authorization header
fetch('/api/v1/protected-route', {
  headers: {
    'Authorization': `Bearer ${accessToken}`
  }
})
```

**Important:** Currently only `/api/v1/auth/logout` requires authentication. Other endpoints are public.

### 5. Refresh Token
```javascript
POST /api/v1/auth/refresh
{
  "refreshToken": "stored-refresh-token"
}

Response:
{
  "data": {
    "accessToken": "new-jwt-token"
  },
  "statusCode": 200,
  "timestamp": "..."
}
```

### 6. Logout (Protected)
```javascript
POST /api/v1/auth/logout
Headers:
  Authorization: Bearer <accessToken>

Response:
{
  "data": {
    "success": true
  },
  "statusCode": 200,
  "timestamp": "..."
}
```

---

## Required Environment Variables

Share these requirements with your DevOps/deployment team:

```env
# Server Configuration
PORT=3000
HOST=0.0.0.0

# CORS Configuration
# Comma-separated list of allowed frontend origins
CORS_ORIGIN=http://localhost:3000,https://yourdomain.com

# Supabase Configuration
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_key

# JWT Configuration
# Required: Generate secure random key
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRES_IN=7d

# Frontend Configuration
FRONTEND_URL=http://localhost:3000

# Swagger Configuration
# Set to 'false' in production
SWAGGER_ENABLED=true
SWAGGER_USER=admin
SWAGGER_PASSWORD=secure_password_here
```

---

## CORS Requirements

**Important CORS Configuration:**

1. **Do not use wildcard with credentials**
   - ❌ `origin: '*'` with `credentials: true` is invalid
   - ✅ Use specific origins: `origin: ['http://localhost:3000', 'https://yourdomain.com']`

2. **Allowed Headers:**
   - `Content-Type`
   - `Authorization`

3. **Allowed Methods:**
   - GET, HEAD, PUT, PATCH, POST, DELETE, OPTIONS

4. **Credentials:**
   - Enabled for cookie-based auth if needed

**Configuration Format:**
```env
# Single origin
CORS_ORIGIN=http://localhost:3000

# Multiple origins (comma-separated)
CORS_ORIGIN=http://localhost:3000,https://staging.yourdomain.com,https://yourdomain.com
```

---

## Testing Without Postman

### Using cURL
```bash
# Health check
curl http://localhost:3000/api/v1/health

# Sign up
curl -X POST http://localhost:3000/api/v1/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"fullName":"Test User","email":"test@example.com","password":"TestPass123"}'

# Login
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"TestPass123"}'
```

### Using the Test Script
```bash
# Note: Update test-api.sh to use new /api/v1 prefix
./test-api.sh
```

### Using Swagger UI
1. Open in browser: http://localhost:3000/docs
2. Enter Basic Auth credentials (from `.env`)
3. Click on any endpoint
4. Click "Try it out"
5. Fill in the parameters
6. Click "Execute"

---

## Common Issues

### Issue: CORS Errors
**Solution:** Update `CORS_ORIGIN` in `.env` to include frontend URL:
```env
CORS_ORIGIN=http://frontend-url:3000,https://frontend-url.com
```

### Issue: Cannot Access from Other Device
**Solution:** Ensure `HOST=0.0.0.0` is set in `.env` and firewall allows port 3000

### Issue: Swagger Returns 401
**Solution:** Provide correct Basic Auth credentials (SWAGGER_USER and SWAGGER_PASSWORD from `.env`)

### Issue: Swagger Disabled
**Solution:** Set `SWAGGER_ENABLED=true` in `.env` and provide credentials

### Issue: ngrok HTTPS Issues
**Solution:** Update Supabase to allow ngrok URL in redirect URLs

---

## Production Checklist

Before going to production:

- [ ] Set `SWAGGER_ENABLED=false` in production `.env`
- [ ] Change `JWT_SECRET` to a strong random key
- [ ] Update `CORS_ORIGIN` to production frontend URL only
- [ ] Enable HTTPS (SSL certificate)
- [ ] Set up rate limiting
- [ ] Configure proper logging
- [ ] Set up monitoring
- [ ] Add authentication guards to protected routes
- [ ] Review and update security headers
- [ ] Test all endpoints in production environment
- [ ] Remove or secure any test data

---

## Known Limitations

1. **Limited Protected Routes**
   - Currently only `/api/v1/auth/logout` requires authentication
   - Most endpoints are public for development
   - Additional guards should be added for protected resources

2. **No User Profile Endpoints**
   - No endpoints to fetch/update user profile
   - Profile data returned only in auth responses

3. **Email Verification Requires Supabase Setup**
   - Email verification endpoint exists but requires Supabase email configuration
   - Social auth requires OAuth provider setup in Supabase

4. **Token Validation**
   - JWT tokens are issued and validated by backend
   - Refresh token validation uses JWT verification (not Supabase)

---

## OpenAPI Specification

The OpenAPI specification is available at:
```
http://localhost:3000/docs-json
```

Requires Basic Auth authentication.

---

## Contact Information

For API-related questions:
- API Documentation: http://localhost:3000/docs (with auth)
- GitHub Repository: [Your Repo URL]
- Contact: [Your Email]

---

## Quick Reference

**Base URL:** `http://localhost:3000/api/v1`
**Swagger:** `http://localhost:3000/docs` (Basic Auth required)
**Swagger Auth:** Use `SWAGGER_USER` and `SWAGGER_PASSWORD` from `.env`

**Public Endpoints:**
- `POST /api/v1/auth/signup` - Register user
- `POST /api/v1/auth/login` - Login user
- `POST /api/v1/auth/verify-email` - Verify email
- `POST /api/v1/auth/forgot-password` - Request password reset
- `POST /api/v1/auth/reset-password` - Reset password
- `POST /api/v1/auth/social` - Social auth (Google/Apple)
- `POST /api/v1/auth/refresh` - Refresh access token
- `GET /api/v1/health` - Health check
- `GET /api/v1/health/database` - Database status

**Protected Endpoints:**
- `POST /api/v1/auth/logout` - Logout user (requires JWT)
