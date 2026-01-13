# Stop all services
Write-Host "Stopping Docker containers..."
docker compose -f infra/docker/docker-compose.yml down

Write-Host "Stopping Node.js processes..."
# Kill all node processes started by pnpm (this is a forceful approach but effective for 'stopping everything')
taskkill /F /IM node.exe /T

Write-Host "All services stopped."
