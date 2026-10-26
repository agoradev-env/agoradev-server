# Agora Server

NestJS backend API for Agora application with Supabase authentication.

## Features

- **Authentication System**
  - Email/password registration and login
  - Email verification with OTP
  - Password reset via email
  - Social authentication (Google, Apple)
  - JWT token-based authentication
  - Token refresh mechanism

- **Database**
  - Supabase integration
  - Custom profiles table
  - Generic CRUD operations

- **API Documentation**
  - Swagger/OpenAPI specification
  - Basic Auth protected documentation
  - Interactive API testing

- **Security**
  - JWT authentication guards
  - CORS configuration
  - Environment variable validation
  - Protected Swagger documentation

## Prerequisites

- Node.js >= 18.x
- npm or yarn
- Supabase account and project

## Installation

```bash
# Install dependencies
npm install
```

## Environment Configuration

Copy `.env.example` to `.env` and configure:

```env
# Server Configuration
PORT=3000
HOST=0.0.0.0

# CORS Configuration
CORS_ORIGIN=http://localhost:3000

# Supabase Configuration
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_key

# JWT Configuration
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRES_IN=7d

# Frontend Configuration
FRONTEND_URL=http://localhost:3000

# Swagger Documentation
SWAGGER_ENABLED=true
SWAGGER_USER=admin
SWAGGER_PASSWORD=change_this_password
```

**Important:** Generate a secure JWT_SECRET:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## Database Setup

Create the `profiles` table in Supabase SQL Editor:

```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  email TEXT NOT NULL,
  full_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## Running the Application

```bash
# Development mode with hot reload
npm run start:dev

# Production build
npm run build
npm run start:prod

# Debug mode
npm run start:debug
```

The server will start on:
- API: http://localhost:3000/api/v1
- Swagger: http://localhost:3000/docs (requires Basic Auth)

## API Endpoints

### Authentication (Public)
- `POST /api/v1/auth/signup` - Register new user
- `POST /api/v1/auth/login` - Login with credentials
- `POST /api/v1/auth/verify-email` - Verify email with OTP
- `POST /api/v1/auth/forgot-password` - Request password reset
- `POST /api/v1/auth/reset-password` - Reset password
- `POST /api/v1/auth/social` - Social auth (Google/Apple)
- `POST /api/v1/auth/refresh` - Refresh access token

### Authentication (Protected)
- `POST /api/v1/auth/logout` - Logout user (requires JWT)

### Health
- `GET /api/v1/health` - Health check
- `GET /api/v1/health/database` - Database status

## API Documentation

### Swagger UI
Access interactive API documentation at:
```
http://localhost:3000/docs
```

**Authentication:** Use Basic Auth with credentials from `.env`:
- Username: `SWAGGER_USER`
- Password: `SWAGGER_PASSWORD`

**Note:** Swagger is disabled in production by default (`SWAGGER_ENABLED=false`).

### Postman Collection
Import `agora-api-collection.json` into Postman for pre-configured requests.

### Test Script
Run the automated test script:
```bash
./test-api.sh
```

## Security

- Swagger documentation is protected with Basic Auth
- CORS is configured with specific origins (no wildcard)
- JWT tokens are validated on protected routes
- Environment variables are validated at startup
- Sensitive data is never logged or exposed

For detailed security information, see `SECURITY_AUDIT_REPORT.md`.

## Frontend Integration

For complete frontend integration guide, see `FRONTEND_INTEGRATION.md`.

Key points:
- API base URL: `http://localhost:3000/api/v1`
- All responses follow structure: `{ data, statusCode, timestamp }`
- CORS must be configured with frontend origin
- Swagger requires Basic Auth for access

## Project Structure

```
src/
├── main.ts                      # Application entry point
├── app.module.ts                # Root module
├── common/
│   ├── config/                  # Configuration
│   ├── decorators/              # Custom decorators
│   ├── dto/                     # Common DTOs
│   ├── filters/                 # Exception filters
│   ├── guards/                 # Authentication guards
│   ├── interceptors/            # Response interceptors
│   └── pipes/                  # Validation pipes
└── modules/
    ├── auth/                    # Authentication module
    │   ├── dto/                # Auth DTOs
    │   ├── auth.controller.ts   # Auth endpoints
    │   ├── auth.service.ts      # Auth logic
    │   └── auth.module.ts       # Auth module
    ├── database/                # Database module
    │   ├── database.service.ts  # Database operations
    │   ├── database.module.ts   # Database module
    │   └── supabase.config.ts   # Supabase config
    └── health/                  # Health check
        └── health.controller.ts
```

## Development

### Adding New Endpoints

1. Create controller in appropriate module
2. Add DTOs in `dto/` folder
3. Update Swagger documentation with decorators
4. Add guards if endpoint requires authentication
5. Update `FRONTEND_INTEGRATION.md`

### Testing

```bash
# Run tests (when implemented)
npm run test

# Lint code
npm run lint

# Format code
npm run format
```

## Deployment

### Before Deployment

1. Change `JWT_SECRET` to a secure random key
2. Update `CORS_ORIGIN` to production frontend URL
3. Set `SWAGGER_ENABLED=false`
4. Enable HTTPS
5. Configure production database
6. Set up monitoring and logging

### Environment Variables for Production

```env
PORT=3000
HOST=0.0.0.0
CORS_ORIGIN=https://your-frontend-domain.com
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_key
JWT_SECRET=your_production_jwt_secret
JWT_EXPIRES_IN=7d
FRONTEND_URL=https://your-frontend-domain.com
SWAGGER_ENABLED=false
```

## Documentation

- [Security Audit Report](SECURITY_AUDIT_REPORT.md) - Security findings and fixes
- [Frontend Integration Guide](FRONTEND_INTEGRATION.md) - Complete integration instructions
- [Postman Testing Guide](POSTMAN_TESTING.md) - API testing with Postman
- [Agents Documentation](AGENTS.md) - Development notes

## License

ISC

## Support

For API-related questions, refer to the Swagger documentation or contact the development team.
