# Environment Files Guide

## .env.example vs .env

### `.env.example` (For Git Committing)
This file is a **template** that shows what environment variables are needed. It should contain **placeholder values only**.

**Purpose:**
- Show developers what variables they need to configure
- Serve as a reference for setting up the application
- Can be safely committed to Git (no real secrets)

**Should contain:**
- Placeholder values like `your_secret_here`
- Default non-sensitive values
- Comments explaining each variable

**Should NOT contain:**
- Real API keys
- Real passwords
- Real secrets
- Production credentials

---

### `.env` (Never Commit to Git)
This file contains your **actual environment variables** with real values.

**Purpose:**
- Store actual configuration for your local development
- Hold real secrets and credentials
- Used by the application at runtime

**Status:**
- ✅ Already in `.gitignore` (should never be committed)
- ⚠️ Should contain your real Supabase credentials
- ⚠️ Should contain your real JWT_SECRET

---

## What Should Be in Your `.env` File

**Your actual `.env` file should look like this:**

```env
# Server Configuration
PORT=3001
HOST=0.0.0.0

# CORS Configuration
CORS_ORIGIN=http://localhost:3000

# Supabase Configuration (YOUR REAL CREDENTIALS)
SUPABASE_URL=https://bmboulgbleatsswgqlyr.supabase.co
SUPABASE_KEY=sb_publishable_kFeT7X-hNj-BbxEG2LHRxg_sCuG_ZxD

# JWT Configuration (YOUR REAL SECRET)
JWT_SECRET=b4be8d7fa7b15a349a9f8134f50ffc905e8eeb68180c1e7df4b35fef4442a03f
JWT_EXPIRES_IN=7d

# Frontend Configuration
FRONTEND_URL=http://localhost:3000

# Swagger Documentation Configuration
SWAGGER_ENABLED=true
SWAGGER_USER=admin
SWAGGER_PASSWORD=change_this_password
```

---

## What Should Be in `.env.example`

**The `.env.example` file (template) should look like this:**

```env
# Server Configuration
PORT=3000
HOST=0.0.0.0

# CORS Configuration
CORS_ORIGIN=http://localhost:3000

# Supabase Configuration
SUPABASE_URL=your_supabase_url_here
SUPABASE_KEY=your_supabase_key_here

# JWT Configuration
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRES_IN=7d

# Frontend Configuration
FRONTEND_URL=http://localhost:3000

# Swagger Documentation Configuration
SWAGGER_ENABLED=true
SWAGGER_USER=admin
SWAGGER_PASSWORD=change_this_password_in_production
```

---

## Action Required

**Do NOT commit your real `.env` file to Git.**

**Your `.env` file should contain:**
- ✅ Your real Supabase URL and key
- ✅ Your real JWT_SECRET (use the one you generated: `b4be8d7fa7b15a349a9f8134f50ffc905e8eeb68180c1e7df4b35fef4442a03f`)
- ✅ Your chosen Swagger password
- ✅ CORS_ORIGIN set to your frontend URL

**Your `.env.example` file should contain:**
- ✅ Placeholder values only (already fixed)
- ✅ No real secrets
- ✅ Safe to commit to Git

---

## Required Variables for Server to Start

The server **will not start** without these variables in your `.env` file:

- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_KEY` - Your Supabase anon key
- `JWT_SECRET` - A secure random secret for JWT signing

Optional but recommended:
- `CORS_ORIGIN` - Your frontend URL
- `SWAGGER_ENABLED` - Set to `true` for development
- `SWAGGER_USER` - Username for Swagger access
- `SWAGGER_PASSWORD` - Password for Swagger access

---

## Quick Setup

1. **Check your `.env` file** - Make sure it has real values:
   ```bash
   cat .env
   ```

2. **Verify required variables are present:**
   ```bash
   grep -E '^(SUPABASE_URL|SUPABASE_KEY|JWT_SECRET)' .env
   ```

3. **Start the server:**
   ```bash
   npm run start:dev
   ```

If you see "Missing required environment variables", your `.env` file is missing one of the required variables.
