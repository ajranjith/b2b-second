# Reference Index System

This directory contains dependency maps for the Hotbray Portal. Use these files to perform impact analysis whenever core components are modified.

## How to use this index

1. **Find the component you are changing** (e.g., a Prisma Model change).
2. **Open the corresponding index file** (e.g., [database.md](./database.md)).
3. **Audit the listed consumers** to ensure they won't break with your changes.
4. **Update the index** if you add new dependencies or move files.

## Available Indices

- **[database.md](./database.md)**: Tracks dependencies on the `db` workspace and Prisma schema.
- **[business_rules.md](./business_rules.md)**: Tracks dependencies on the `rules` package.
- **[api_endpoints.md](./api_endpoints.md)**: Maps API routes to their implementations.
- **[issue_resolution_log.md](./issue_resolution_log.md)**: Historical record of technical issues and their fixes.
