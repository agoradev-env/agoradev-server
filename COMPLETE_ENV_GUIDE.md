# Complete Environment Variables Guide

## Required Variables (Server Will Not Start Without These)

### 1. SUPABASE_URL
**What it is:** Your Supabase project URL
**Where to get it:**
1. Go to https://supabase.com/dashboard
2. Select your project
3. Go to Settings → API
4. Copy "Project URL"

**Your current value:** `https://bmboulgbleatsswgqlyr.supabase.co`
**Status:** ✅ Already in your .env file

---

### 2. SUPABASE_KEY
**What it is:** Your Supabase anon/public API key
**Where to get it:**
1. Go to https://supabase.com/dashboard
2. Select your project
3. Go to Settings → API
4. Copy "anon / public" key
5. It usually starts with `eyJ...` or `sb_...`

**Your current value:** `sb_publishable_kFeT7X-hNj-BbxEG2LHRxg_sCuG_ZxD`
**Status:** ✅ Already in your .env file

---

### 3. JWT_SECRET
**What it is:** A secret key used to sign and verify JWT tokens
**Where to get it:** Generate a secure random key

**How to generate:**
```bash
openssl rand -hex 32
```

**Example output:** `b4be8d7fa7b15a349a9f8134f50ffc905e8eeb68180c1e7df4b35fef4442a03f`

**Status:** ❌ MISSING from your .env file (this is why the server won't start)

---

## Optional Variables (Recommended for Development)

### 4. PORT
**What it is:** The port the server runs on
**Default:** 3000
**Your current value:** 3001
**Status:** ✅ Already in your .env file

---

### 5. HOST
**What it is:** The host address the server binds to
**Default:** 0.0.0.0 (allows access from other devices)
**Recommended value:** 0.0.0.0
**Status:** ❌ MISSING from your .env file

---

### 6. CORS_ORIGIN
**What it is:** Allowed frontend origins for CORS
**Required for:** Browser-based frontend integration
**Options:**
- Single origin: `http://localhost:3000`
- Multiple origins: `http://localhost:3000,https://yourdomain.com`
**Recommended value:** `http://localhost:3000`
**Status:** ❌ MISSING from your .env file

---

### 7. JWT_EXPIRES_IN
**What it is:** How long access tokens are valid
**Default:** 7d
**Options:** `7d`, `1h`, `30m`, etc.
**Recommended value:** 7d
**Status:** ❌ MISSING from your .env file

---

### 8. FRONTEND_URL
**What it is:** Your frontend URL (used for password reset redirects)
**Default:** http://localhost:3000
**Recommended value:** http://localhost:3000
**Status:** ❌ MISSING from your .env file

---

### 9. SWAGGER_ENABLED
**What it is:** Enable/disable Swagger documentation
**Options:** `true` or `false`
**Development:** true
**Production:** false
**Recommended value:** true
**Status:** ❌ MISSING from your .env file

---

### 10. SWAGGER_USER
**What it is:** Username to access Swagger documentation
**Required when:** SWAGGER_ENABLED=true
**Recommended value:** admin
**Status:** ❌ MISSING from your .env file

---

### 11. SWAGGER_PASSWORD
**What it is:** Password to access Swagger documentation
**Required when:** SWAGGER_ENABLED=true
**How to choose:** Any secure password
**Recommended value:** change_this_password
**Status:** ❌ MISSING from your .env file

---

## Complete .env File Template

Copy this into your `.env` file and supply the values:

```env
# ========== REQUIRED VARIABLES (Server won't start without these) ==========

# Supabase Configuration
SUPABASE_URL=https://bmboulgbleatsswgqlyr.supabase.co
SUPABASE_KEY=sb_publishable_kFeT7X-hNj-BbxEG2LHRxg_sCuG_ZxD

# JWT Configuration (REQUIRED - generate with: openssl rand -hex 32)
JWT_SECRET=<YOUR_GENERATED_SECRET_HERE>

# ========== OPTIONAL VARIABLES (Recommended) ==========

# Server Configuration
PORT=3001
HOST=0.0.0.0

# CORS Configuration
CORS_ORIGIN=http://localhost:3000

# JWT Configuration
JWT_EXPIRES_IN=7d

# Frontend Configuration
FRONTEND_URL=http://localhost:3000

# Swagger Documentation Configuration
SWAGGER_ENABLED=true
SWAGGER_USER=admin
SWAGGER_PASSWORD=<YOUR_SWAGGER_PASSWORD_HERE>
```

---

## Quick Setup Command

Run this command to generate a secure JWT_SECRET:

```bash
openssl rand -hex 32
```

Then replace `<YOUR_GENERATED_SECRET_HERE>` in the template above with the output.

---

## Values You Already Have

You already have these values (they're in your current .env file):
- ✅ SUPABASE_URL: `https://bmboulgbleatsswgqlyr.supabase.co`
- ✅ SUPABASE_KEY: `sb_publishable_kFeT7X-hNj-BbxEG2LHRxg_sCuG_ZxD`
- ✅ PORT: `3001`

---

## Values You Need to Supply

You need to provide these values:
- ❌ JWT_SECRET (generate with: `openssl rand -hex 32`)
- ❌ SWAGGER_PASSWORD (choose any secure password)

---

## Minimal .env to Start Server

If you just want to start the server, the minimum required is:

```env
SUPABASE_URL=https://bmboulgbleatsswgqlyr.supabase.co
SUPABASE_KEY=sb_publishable_kFeT7X-hNj-BbxEG2LHRxg_sCuG_ZxD
JWT_SECRET=<GENERATE_WITH_OPENSSL>
PORT=3001
```

But I recommend using the complete template above for full functionality.
