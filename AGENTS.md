# Agora Server - NestJS Backend

## Project Setup

This is a NestJS backend using Supabase as the database.

## Environment Configuration

Before running the server, ensure your `.env` file has the following variables:

```env
# Server Configuration
PORT=3000
CORS_ORIGIN=*

# Supabase Configuration
SUPABASE_URL=your_supabase_url_here
SUPABASE_ANON_KEY=your_supabase_anon_key_here
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
    ├── database/
    │   ├── database.module.ts       # Database module
    │   ├── database.service.ts      # Database service
    │   └── supabase.config.ts       # Supabase client config
    └── health/
        └── health.controller.ts     # Health check endpoint
```
