# Start all services
Write-Host "Starting Docker containers..."
docker compose -f infra/docker/docker-compose.yml up -d

Write-Host "Starting Application Services (API + Web + Worker)..."
# Using pnpm dev which runs migrations and seeds then concurrently starts apps
pnpm dev
