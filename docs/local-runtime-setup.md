# Local Runtime Setup

## Environment files

Copy each `.env.example` to `.env` and update values as needed.

### apps/api

- `DATABASE_URL_PRIMARY` - Primary PostgreSQL connection string.
- `DATABASE_URL_REPLICA` - Replica PostgreSQL connection string (read-only).
- `JWT_SECRET` - JWT signing secret.
- `ENCRYPTION_KEY` - Encryption key for sensitive payloads.
- `DEV_BFF_BYPASS_AUTH` - Set `true` to allow dev-only role bypass via `x-dev-role`.
- `API_BASE_URL` - Base URL used by local test scripts.

### apps/admin-web

- `NEXT_PUBLIC_API_URL` - API base URL (used by browser).
- `API_BASE_URL` - Optional alias for local tooling.

### apps/dealer-web

- `NEXT_PUBLIC_API_URL` - API base URL (used by browser).
- `API_BASE_URL` - Optional alias for local tooling.

## Local database (primary + replica)

Bring up the dev database stack:

```bash
docker compose -f docker-compose.dev.yml up -d
```

Default ports:

- Primary: `localhost:5432`
- Replica: `localhost:5433`

## Test scripts

Run the replication tests once the API is running:

```bash
pnpm --filter api exec tsx src/scripts/test-permission.ts
pnpm --filter api exec tsx src/scripts/test-lag.ts
pnpm --filter api exec tsx src/scripts/test-load.ts
```
