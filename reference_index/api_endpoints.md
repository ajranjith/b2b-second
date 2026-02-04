# API Route Index

This index maps API endpoints (Fastify) to their implementation files. If the API interface changes, both these files and their web application consumers (React Query or Server Actions) must be verified.

## API Application
- **Main Entry**: [apps/api/src/index.ts](file:///c:/Users/ajran/.gemini/antigravity/scratch/hotbray-portal-phase1/apps/api/src/index.ts)
- **Base URL**: `http://localhost:3001`

## Route Definitions

### Authentication (`/auth`)
- **File**: [routes/auth.ts](file:///c:/Users/ajran/.gemini/antigravity/scratch/hotbray-portal-phase1/apps/api/src/routes/auth.ts)
- **Endpoints**:
  - `POST /auth/login`
  - `POST /auth/register`
  - `GET /auth/me`

### Dealer Portal (`/dealer`)
- **File**: [routes/dealer.ts](file:///c:/Users/ajran/.gemini/antigravity/scratch/hotbray-portal-phase1/apps/api/src/routes/dealer.ts)
- **Endpoints**:
  - `GET /dealer/orders`
  - `GET /dealer/backorders`
  - `GET /dealer/products`
  - `GET /dealer/pricing/:partNumber`

### Admin Portal (`/admin`)
- **File**: [routes/admin.ts](file:///c:/Users/ajran/.gemini/antigravity/scratch/hotbray-portal-phase1/apps/api/src/routes/admin.ts)
- **Endpoints**:
  - `GET /admin/users`
  - `GET /admin/dealers`
  - `GET /admin/orders`
  - `POST /admin/imports`

## Web App Consumers (SSR vs Client)

- **SSR (Direct DB)**: Most order pages have been migrated to SSR and bypass the API.
  - See [reference_index/database.md](file:///c:/Users/ajran/.gemini/antigravity/scratch/hotbray-portal-phase1/reference_index/database.md) for SSR dependencies.
- **Client Components**: Any component using `fetch()` or `useQuery()` typically hits these endpoints.
