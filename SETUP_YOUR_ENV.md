# Setup Your .env File

I cannot access your `.env` file directly (it's in .gitignore for security), but I can guide you on exactly what to put in it.

---

## Step-by-Step Instructions

### 1. Open your `.env` file
```bash
nano .env
# or
code .env
```

### 2. Add these exact values

**Copy and paste this into your `.env` file:**

```env
# Server Configuration
PORT=3001
HOST=0.0.0.0

# CORS Configuration
CORS_ORIGIN=http://localhost:3000

# Supabase Configuration (Your existing credentials)
SUPABASE_URL=https://bmboulgbleatsswgqlyr.supabase.co
SUPABASE_KEY=sb_publishable_kFeT7X-hNj-BbxEG2LHRxg_sCuG_ZxD

# JWT Configuration (Use the key you just generated)
JWT_SECRET=b4be8d7fa7b15a349a9f8134f50ffc905e8eeb68180c1e7df4b35fef4442a03f
JWT_EXPIRES_IN=7d

# Frontend Configuration
FRONTEND_URL=http://localhost:3000

# Swagger Documentation Configuration
SWAGGER_ENABLED=true
SWAGGER_USER=admin
SWAGGER_PASSWORD=change_this_password
```

### 3. Save the file

### 4. Start the server
```bash
npm run start:dev
```

---

## Explanation of Each Variable

| Variable | Value | Why |
|----------|-------|-----|
| `PORT` | `3001` | Your existing port (keeps it consistent) |
| `HOST` | `0.0.0.0` | Allows access from other devices on your network |
| `CORS_ORIGIN` | `http://localhost:3000` | Your frontend development URL |
| `SUPABASE_URL` | `https://bmboulgbleatsswgqlyr.supabase.co` | Your existing Supabase project URL |
| `SUPABASE_KEY` | `sb_publishable_kFeT7X-hNj-BbxEG2LHRxg_sCuG_ZxD` | Your existing Supabase key |
| `JWT_SECRET` | `b4be8d7fa7b15a349a9f8134f50ffc905e8eeb68180c1e7df4b35fef4442a03f` | The key you just generated with openssl |
| `JWT_EXPIRES_IN` | `7d` | Access tokens expire in 7 days |
| `FRONTEND_URL` | `http://localhost:3000` | Used for password reset redirects |
| `SWAGGER_ENABLED` | `true` | Enable Swagger for development |
| `SWAGGER_USER` | `admin` | Username to access Swagger |
| `SWAGGER_PASSWORD` | `change_this_password` | Password to access Swagger |

---

## Verification

After saving, verify your `.env` file has the required variables:

```bash
grep -E '^(SUPABASE_URL|SUPABASE_KEY|JWT_SECRET)' .env
```

You should see all three variables with values.

---

## Common Issues

**If you see "Missing required environment variables":**
- Make sure you saved the `.env` file
- Check that the variable names match exactly (no typos)
- Ensure there are no spaces around the `=` sign

**If the server still won't start:**
- Check that the `.env` file is in the project root directory
- Try restarting your terminal/editor
- Verify the file name is exactly `.env` (not `.env.txt`)

---

## After Setup

Once the server starts successfully, you should see:

```
[Bootstrap] CORS enabled for origins: http://localhost:3000
[Bootstrap] Swagger documentation enabled at /docs with Basic Auth protection
[Bootstrap] Swagger JSON endpoint at /docs-json also protected
Application is running on: http://localhost:3000
API base URL: http://localhost:3000/api/v1
Swagger documentation: http://localhost:3000/docs
```

Then you can test:
```bash
curl http://localhost:3000/api/v1/health
```
