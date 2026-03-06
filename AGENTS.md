# Agent Guardrails

This file contains important guardrails and context for AI agents working on this codebase.

## Project Structure

- `apps/`: Deployable applications (web, api, worker).
- `packages/`: Shared libraries.
- `infra/`: Infrastructure configuration.

## Rules

- **Do not** import from `apps` into `packages`.
- **Do** use `pnpm` for package management.
- **Do** follow the architecture defined in `docs/architecture.md`.
- **Do not** commit secrets.
