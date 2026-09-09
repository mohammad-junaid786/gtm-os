# GTM OS

An open-source, self-hostable web application for planning, executing, measuring, experimenting, and learning from go-to-market strategies.

> 🚧 **Early development.** The foundational architecture is in place. GTM domain modules are being built incrementally.

---

## What is GTM OS?

GTM OS is a structured workspace for go-to-market work. The core idea is a repeatable loop:

```
PLAN → EXECUTE → MEASURE → LEARN → IMPROVE → PLAN AGAIN
```

Target users are founders, indie hackers, early-stage startups, and small GTM teams who want a structured, self-owned alternative to scattered spreadsheets and disconnected SaaS tools.

GTM OS is designed so the core application works without paid AI APIs. AI features will be optional and provider-agnostic.

---

## Current status

Stages 1–5 of the build are complete. The foundational architecture is in place:

- workspace and product data models
- server-side domain services (workspace creation, product CRUD)
- secure product-scoped routing (`/w/[workspaceSlug]/[productSlug]`)
- membership-aware workspace resolution
- product-scoped application shell
- product-aware Overview foundation

**Authentication is not yet implemented.** The routing layer is designed so a future authentication provider can supply the current user ID without requiring any rewrite of the resolver or shell architecture. Until then, the product-scoped route resolves to a 404.

---

## Architecture

```
User
  ↓
Workspace (membership-verified)
  ↓
Product (workspace-scoped, active only)
  ↓
GTM modules
  ↓
PLAN → EXECUTE → MEASURE → LEARN → IMPROVE
```

Each product belongs to a workspace. Routes are resolved through workspace membership — bare workspace slug lookup is intentionally not a security boundary. A product must be active (not archived) to be routable through the normal application flow.

For implementation details, see [docs/architecture.md](docs/architecture.md).

---

## Tech stack

| Layer | Technology |
|---|---|
| Framework | Next.js (App Router), TypeScript |
| Styling | Tailwind CSS, shadcn/ui |
| Database | PostgreSQL, Drizzle ORM |
| Validation | Zod |
| Charts | Recharts |
| Testing | Node.js built-in test runner, tsx |
| Linting | ESLint |

---

## Roadmap

### Completed

- [x] Project foundation (Next.js, TypeScript, Tailwind, PostgreSQL, Drizzle)
- [x] Workspace data model and membership model
- [x] Workspace creation service and slug utilities
- [x] Product data model (create, read, update, archive)
- [x] Workspace-scoped product access and IDOR prevention
- [x] Secure product-scoped routing (`/w/[workspaceSlug]/[productSlug]`)
- [x] Membership-aware workspace resolver
- [x] Product-scoped application shell and navigation
- [x] Product-aware Overview foundation

### Upcoming

- [ ] Authentication integration
- [ ] ICP (Ideal Customer Profile)
- [ ] Personas
- [ ] Positioning
- [ ] Competitors
- [ ] Research library
- [ ] Execution (plays, sequences, campaigns)
- [ ] Analytics and measurement
- [ ] Learnings
- [ ] AI architecture (optional, provider-agnostic)
- [ ] AI features (BYOK, local Ollama support)
- [ ] Demo mode
- [ ] Open-source polish and contribution guide

---

## Getting started

### Prerequisites

- Node.js 22 or later
- PostgreSQL 14 or later (local installation)

### Setup

```bash
# 1. Clone the repository
git clone https://github.com/mohammad-junaid786/gtm-os.git
cd gtm-os

# 2. Install dependencies
npm install

# 3. Configure environment
cp .env.example .env
# Edit .env and set DATABASE_URL to your local PostgreSQL connection string

# 4. Run database migrations
npm run db:migrate

# 5. Start the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Environment variables

`.env.example` documents the required variables. Currently only one is needed:

```
DATABASE_URL=postgresql://user:password@localhost:5432/gtm_os
```

`DATABASE_URL` is read exclusively by server-side code and Drizzle CLI commands. It is never exposed to the client bundle.

### Available scripts

```bash
npm run dev          # Start development server
npm run build        # Production build
npm run start        # Start production server

npm test             # Run unit tests (Node.js built-in runner)
npm run typecheck    # TypeScript type check (tsc --noEmit)
npm run lint         # ESLint

npm run db:generate  # Generate Drizzle migrations from schema
npm run db:migrate   # Apply pending migrations
npm run db:studio    # Open Drizzle Studio (database browser)
```

---

## Database

PostgreSQL is the only supported database. Drizzle ORM is used for schema definition, migrations, and queries. The schema currently defines three tables:

- `workspaces` — top-level organizational unit with a globally unique slug
- `workspace_members` — membership join table; `user_id` is an opaque UUID (no users table yet)
- `products` — workspace-scoped products with slug uniqueness per workspace; archived, never hard-deleted

Migrations live in `drizzle/` and are generated with `npm run db:generate` and applied with `npm run db:migrate`.

---

## AI direction

AI is intentionally optional and will not be required for core GTM functionality. Planned approach:

- **BYOK** (Bring Your Own Key) — users provide their own API keys
- **Provider abstraction** — switchable between OpenAI, Anthropic, and others
- **Local inference** — Ollama support planned for fully offline use
- The core application will remain fully functional without any AI configuration

None of this is implemented yet.

---

## Open source

GTM OS is being built as an open-source, self-hostable project. The core modules are being developed incrementally. As the codebase stabilizes, contribution guidelines and a formal license will be added.

If you are exploring the codebase, the best starting points are:

- [`docs/architecture.md`](docs/architecture.md) — design decisions and stage-by-stage implementation notes
- [`db/schema.ts`](db/schema.ts) — current database schema
- [`lib/workspace/`](lib/workspace/) — workspace domain services
- [`lib/product/`](lib/product/) — product domain services
- [`lib/routing/`](lib/routing/) — route resolver and auth seam