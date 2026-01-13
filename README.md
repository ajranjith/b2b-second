# b2b-second

B2B dealer and admin portal.

## Quick Start

### Prerequisites
- Node.js (v20+)
- pnpm
- Docker Desktop

### Service Management

We provide PowerShell scripts to manage the full stack (Docker + Node.js services) easily.

#### Start All Services
Starts Postgres/Mailhog in Docker and launches API/Web/Worker apps.
```powershell
./start-all.ps1
```

#### Stop All Services
Stops Docker containers and terminates all Node.js processes.
```powershell
./stop-all.ps1
```

## Development
To run services individually, check `package.json` scripts.
