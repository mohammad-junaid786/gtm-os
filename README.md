# GTM OS

GTM OS is an open-source, self-hostable web application for planning, executing, measuring, experimenting, and learning from go-to-market strategies.

## Status

This repository currently contains the project foundation only: application tooling, a local PostgreSQL environment, and a server-only Drizzle database access layer. No GTM product features or domain schema have been implemented.

## Tech stack

- Next.js (App Router) and TypeScript
- Tailwind CSS and shadcn/ui configuration
- PostgreSQL, Drizzle ORM, and Drizzle Kit
- Zod, Recharts, ESLint, and npm

## Local development

Prerequisites: Node.js 22+ and Docker Desktop (or another Docker-compatible runtime).

1. Copy `.env.example` to `.env`.
2. Start PostgreSQL: `docker compose up -d`.
3. Install dependencies: `npm install`.
4. Start the app: `npm run dev`.
5. Open [http://localhost:3000](http://localhost:3000).

## Environment

`DATABASE_URL` is the only current environment variable. It is used exclusively by server-side code and Drizzle commands. The `.env.example` value matches the local Docker Compose database; use distinct credentials in shared or production deployments.

## Database

The client lives in `db/index.ts` and is created lazily on the server. The schema entry point is `db/schema.ts`; it intentionally has no domain tables yet.

When a schema is introduced, create and apply migrations with:

```bash
npm run db:generate
npm run db:migrate
```

Useful checks:

```bash
npm run lint
npm run typecheck
npm run build
```