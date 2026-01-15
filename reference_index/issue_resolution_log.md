# Issue-Resolution Log

This log tracks significant technical issues encountered and the solutions implemented to resolve them. It serves as a knowledge base and historical record for the Hotbray Portal.

| Date | Issue Description | Root Cause | Resolution | Status |
| :--- | :--- | :--- | :--- | :--- |
| 2026-01-15 | Prisma Client initialization error: `requires either "adapter" or "accelerateUrl"` | Prisma 7.2.0 deprecated the `url` field in `schema.prisma` in favor of adapters or Prisma Accelerate config. | Downgraded project to Prisma 6.11.0, which retains the standard PostgreSQL connection pattern. | Resolved |
| 2026-01-15 | API server getting "stuck" or unresponsive on startup during route loading. | Dynamic route loading in Fastify was causing race conditions or module resolution hangs in the TS environment. | Refactored `apps/api/src/index.ts` to use explicit static imports for all route modules. | Resolved |
| 2026-01-15 | SSR Page Lint errors: `db` imported from `@repo/db` failed. | Migration from older turborepo structure to local workspace `db` dependency was incomplete in page files. | Corrected imports to `import db from 'db'` and updated workspace dependency in `package.json`. | Resolved |

## Detailed Records

### Prisma 7 Configuration Conflict
- **Symptoms**: `PrismaClientConstructorValidationError` on API startup.
- **Investigation**: Attempted to use `prisma.config.ts`, but found it forced adapter requirements which reversed our goal of a simplified standalone DB client. 
- **Learning**: Prisma 7's new configuration architecture is optimized for edge/serverless compute but adds overhead for standard Dockerized Node.js servers. 
- **Action**: Standardized on Prisma 6.x across the monorepo.
