# GTM OS

An open-source, self-hostable web application for planning, executing, measuring, experimenting, and learning from go-to-market strategies.

> 🚀 **MVP implementation complete through Stage 17.** The foundational architecture and core GTM modules are fully implemented.

---

## What is GTM OS?

GTM OS is a structured workspace for go-to-market work. The core idea is a repeatable loop:

```
PLAN → EXECUTE → MEASURE → LEARN → IMPROVE → PLAN AGAIN
```

Target users are founders, indie hackers, early-stage startups, and small GTM teams who want a structured, self-owned alternative to scattered spreadsheets and disconnected SaaS tools.

GTM OS is designed so the core application works without paid AI APIs. AI features are optional and provider-agnostic.

---

## Core capabilities

MVP implementation complete through Stage 17. GTM OS includes the following modules:

- **Workspace / Product**: Isolated data boundaries and product management.
- **Authentication**: Seamless membership-aware routing.
- **Strategy**: ICP, Personas, Positioning.
- **Market**: Competitors, Research Library.
- **Execution**: Leads, Campaigns, Experiments.
- **Measurement**: Analytics and Learnings.
- **AI Drafting**: Integrated AI capabilities for Strategy modules.
- **Demo Mode**: Instant onboarding with representative data.

### Demo Mode

Demo Mode is available directly from onboarding.
- It requires authentication but does not require an AI API key.
- It creates a real, fully isolated demo workspace and product for the authenticated user using normal application data boundaries.
- The generated data is deterministic and internally coherent.
- Note: It is an isolated sandbox for the individual user, not a public playground.

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
- [x] ICP (Ideal Customer Profile)
- [x] Personas
- [x] Execution (plays, sequences, campaigns, leads)
- [x] Analytics and measurement
- [x] Learnings
- [x] Authentication integration
- [x] Positioning
- [x] Competitors
- [x] Research library
- [x] AI architecture (optional, provider-agnostic)
- [x] AI features (BYOK, local Ollama support)
- [x] Demo mode

### Future Work

Future capabilities beyond the MVP are still in planning.

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

`.env.example` documents the required variables. Currently only one is needed for core functionality:

```
DATABASE_URL=postgresql://user:password@localhost:5432/gtm_os
```

`DATABASE_URL` is read exclusively by server-side code and Drizzle CLI commands. It is never exposed to the client bundle.

Optional AI configuration requires additional server-side environment variables (`AI_PROVIDER`, `AI_BASE_URL`, `AI_API_KEY`, `AI_MODEL`), but the application functions normally without them.

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

PostgreSQL is the only supported database. Drizzle ORM is used for schema definition, migrations, and queries. The schema covers workspaces, products, and persistent GTM domain models (ICP, Personas, Positioning, Competitors, Research, Leads, Campaigns, Experiments, Learnings).

Note: Analytics is a read-only aggregation layer over existing domain data and does not have its own analytics tables.

Migrations live in `drizzle/` and are generated with `npm run db:generate` and applied with `npm run db:migrate`.

---

## AI Architecture

AI is an optional copilot. Core functionality does not require an AI provider.

- **Provider Abstraction**: Switchable between OpenAI-compatible APIs and local Ollama.
- **Server-side Config**: Keys are never exposed to the client (BYOK).
- **Drafting**: Generates drafts for ICP, Personas, and Positioning using workspace context.
- **Safe Persistence**: AI generates drafts only; normal application forms handle actual data persistence.

---

## Open source

GTM OS is being built as an open-source, self-hostable project. The core modules are being developed incrementally. As the codebase stabilizes, contribution guidelines and a formal license will be added.

If you are exploring the codebase, the best starting points are:

- [`docs/architecture.md`](docs/architecture.md) — design decisions and stage-by-stage implementation notes
- [`db/schema.ts`](db/schema.ts) — current database schema
- [`lib/workspace/`](lib/workspace/) — workspace domain services
- [`lib/product/`](lib/product/) — product domain services
- [`lib/routing/`](lib/routing/) — route resolver and auth seam
- [`lib/ai/`](lib/ai/) — AI capabilities and provider abstraction
- [`lib/demo/`](lib/demo/) — Demo Mode isolation and seeding