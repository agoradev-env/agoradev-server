# Agora Server - NestJS Backend

## Project Setup

This is a NestJS backend using Supabase as the database and authentication provider.

## Environment Configuration

Before running the server, ensure your `.env` file has the following variables:

```env
# Server Configuration
PORT=3000
CORS_ORIGIN=*

# Supabase Configuration
SUPABASE_URL=your_supabase_url_here
SUPABASE_KEY=your_supabase_key_here

# JWT Configuration
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRES_IN=7d

# Frontend Configuration
FRONTEND_URL=http://localhost:3000
```

## Database Module

The database module provides a service for Supabase operations:

- `select<T>(table, columns)` - Generic select query
- `selectById<T>(table, id, columns)` - Select by ID
- `selectWithFilters<T>(table, filters, columns)` - Select with filters
- `insert<T>(table, data)` - Insert record
- `update<T>(table, id, data)` - Update record
- `delete(table, id)` - Delete record
- `getClient()` - Get raw Supabase client for custom queries

## Authentication Module

The authentication module provides comprehensive auth features using Supabase Auth and JWT tokens.

### Authentication Endpoints

#### 1. Sign Up
- **POST** `/auth/signup`
- **Body**: `{ fullName, email, password }`
- **Response**: `{ accessToken, refreshToken, user, expiresAt }`
- **Description**: Register a new user with email and password. Creates user profile in Supabase and custom profiles table.

#### 2. Login
- **POST** `/auth/login`
- **Body**: `{ email, password }`
- **Response**: `{ accessToken, refreshToken, user, expiresAt }`
- **Description**: Login with email and password credentials.

#### 3. Verify Email
- **POST** `/auth/verify-email`
- **Body**: `{ email, code }`
- **Response**: `{ success: boolean }`
- **Description**: Verify email address using OTP code sent to email.

#### 4. Forgot Password
- **POST** `/auth/forgot-password`
- **Body**: `{ email }`
- **Response**: `{ success: boolean }`
- **Description**: Request password reset email. Sends reset link to user's email.

#### 5. Reset Password
- **POST** `/auth/reset-password`
- **Body**: `{ token, newPassword }`
- **Response**: `{ success: boolean }`
- **Description**: Reset password using token from email.

#### 6. Social Authentication
- **POST** `/auth/social`
- **Body**: `{ provider: 'google' | 'apple', accessToken }`
- **Response**: `{ accessToken, refreshToken, user, expiresAt }`
- **Description**: Authenticate using Google or Apple OAuth tokens.

#### 7. Refresh Token
- **POST** `/auth/refresh`
- **Body**: `{ refreshToken }`
- **Response**: `{ accessToken }`
- **Description**: Refresh access token using refresh token.

#### 8. Logout
- **POST** `/auth/logout`
- **Headers**: `Authorization: Bearer <token>`
- **Body**: `{ token }`
- **Response**: `{ success: boolean }`
- **Description**: Logout user and invalidate session.

### Database Tables Required

The authentication system expects a `profiles` table in Supabase with the following structure:

```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  email TEXT NOT NULL,
  full_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## Common DTOs

- `BaseDto` - Base DTO with id, created_at, updated_at
- `PaginationDto` - Pagination with limit and offset
- `ResponseDto<T>` - Standard response wrapper
- `PaginatedResponseDto<T>` - Paginated response wrapper

## Available Scripts

- `npm run start` - Start production server
- `npm run start:dev` - Start development server with watch mode
- `npm run start:debug` - Start in debug mode
- `npm run build` - Build the project
- `npm run lint` - Run ESLint

## Health Check Endpoints

- `GET /health` - Basic health check
- `GET /health/database` - Database connection check (requires Supabase credentials)

## Swagger Documentation

The API documentation is available at `/api` endpoint when the server is running.
- Local: http://localhost:3001/api
- Swagger provides interactive documentation for all endpoints including request/response schemas.

## Project Structure

```
src/
├── main.ts                          # Application entry point
├── app.module.ts                    # Root module
├── common/
│   ├── config/
│   │   └── configuration.ts        # Configuration management
│   ├── decorators/
│   │   └── user.decorator.ts        # Custom @User() decorator
│   ├── dto/
│   │   ├── base.dto.ts              # Base DTO
│   │   ├── pagination.dto.ts        # Pagination DTO
│   │   └── response.dto.ts          # Response DTOs
│   ├── filters/
│   │   └── http-exception.filter.ts # Global exception filter
│   ├── guards/                     # (empty, ready for auth guards)
│   ├── interceptors/
│   │   └── transform.interceptor.ts # Response transformer
│   └── pipes/                      # (empty, ready for validation pipes)
└── modules/
    ├── auth/
    │   ├── auth.module.ts           # Auth module
    │   ├── auth.service.ts          # Auth service with Supabase
    │   ├── auth.controller.ts       # Auth controller with Swagger docs
    │   └── dto/
    │       ├── signup.dto.ts        # Signup DTO
    │       ├── login.dto.ts         # Login DTO
    │       ├── verify-email.dto.ts  # Email verification DTO
    │       ├── forgot-password.dto.ts # Forgot password DTO
    │       ├── reset-password.dto.ts # Reset password DTO
    │       ├── social-auth.dto.ts   # Social auth DTO
    │       ├── auth-response.dto.ts # Auth response DTO
    │       └── index.ts             # DTO exports
    ├── database/
    │   ├── database.module.ts       # Database module
    │   ├── database.service.ts      # Database service
    │   └── supabase.config.ts       # Supabase client config
    └── health/
        └── health.controller.ts     # Health check endpoint
```

## Next Steps

1. **Set up Supabase Auth**: Enable email authentication in Supabase dashboard
2. **Create profiles table**: Run the SQL script above in Supabase SQL editor
3. **Configure OAuth providers**: Set up Google and Apple OAuth in Supabase dashboard
4. **Test endpoints**: Use Swagger UI at `/api` to test all authentication endpoints
5. **Add JWT secret**: Set a secure JWT_SECRET in your `.env` file

