# Architecture

GTM OS is a single self-hostable Next.js App Router application backed by PostgreSQL.

## Current boundaries

- `app/` contains routes, layouts, and page-level UI composition.
- `components/` is reserved for reusable UI, including future shadcn/ui components.
- `lib/` contains shared helpers and server environment validation.
- `db/` owns the server-only Drizzle client and schema entry point.
- `drizzle/` will contain generated migrations once domain tables are introduced.

The database client is server-only and reads `DATABASE_URL` only at runtime. No current environment values are exposed to client bundles. No GTM domain model or product feature is included in this foundation.