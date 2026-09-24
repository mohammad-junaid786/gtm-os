<div align="center">
  <img src="public/logo/gtm-os-logo.svg" alt="GTM OS" width="220" />
</div>

<br />

**GTM OS** is an open-source, self-hostable web application for planning, executing, measuring, experimenting, and learning from go-to-market strategies.

The core GTM loop is:

`PLAN → EXECUTE → MEASURE → LEARN → IMPROVE → PLAN AGAIN`

GTM OS provides a structured, self-owned alternative to scattered spreadsheets and disconnected SaaS tools. It is built for founders, indie hackers, early-stage startups, small GTM teams, growth/marketing teams, analysts, and researchers.

Core functionality works without an AI provider. AI features are optional.

---

## Current Status

The project has successfully implemented its foundational MVP architecture, including robust data isolation, authentication, and a modern UI/UX redesign. We are currently in an active product refinement phase. 

**Currently Implemented:**
- Core MVP architecture
- Core GTM modules
- Authentication (Auth.js / NextAuth)
- Welcome, authentication, and onboarding experiences
- AI architecture and drafting
- Search functionality
- Demo Mode
- UI/UX redesign
- Continued refinement and product polish in progress

*Note: GTM OS is under active development and is not yet designated as fully production-ready.*

---

## Core Capabilities

### Workspace and Product
- **Workspace Architecture**: Workspace membership provides the authorization boundary for workspace-scoped access.
- **Workspace Membership**: Managed user access to isolated data.
- **Product Management**: Create, manage, and archive products.
- **Product-Scoped Routing**: Routes are structured as `/w/[workspaceSlug]/[productSlug]`.
- **Workspace Switching**: UI context switching between workspaces.
- **Workspace Lifecycle**: Workspace creation and management workflows.
- **Product Archiving**: Archived products are not routable.

### Authentication and Onboarding
- **Powered by Auth.js / NextAuth**: Secure session management.
- **Sign In & Sign Up**: Full credential-based entry.
- **Welcome Experience**: The root route (`/`) intentionally displays the GTM OS Welcome page even when a user is already authenticated.
- **Smart "Get Started" Flow**:
  - Logged-out user → Sign In
  - Authenticated user without a workspace → Onboarding (Workspace/Product setup)
  - Authenticated user with a workspace → Existing/default workspace
- **Workspace & Product Setup**: Streamlined onboarding flow for new users.
- **Demo Mode**: Instant generation of a representative workspace.

### Strategy
- **ICP** (Ideal Customer Profile)
- **Personas**
- **Positioning**

### Market / Research
- **Competitors**
- **Research Library**

### Execution
- **Leads**
- **Campaigns**
- **Experiments**

### Analytics / Learning
- **Analytics**: A read-only aggregation layer that visualizes data over existing domain tables. It does not use standalone analytics persistence tables.
- **Funnel & Performance Measurements**
- **Learnings**: Create contextual learnings from anywhere in the application (Experiments, Campaigns, Research, Leads, Analytics).
- **Action Item Promotion**: Easily promote learning action items into new Campaigns or Experiments to close the GTM loop.

### Search
- **Product-Scoped Global Search**: Searches across GTM entities including ICPs, Personas, Competitors, Research, Leads, Campaigns, Experiments, and Learnings.
- **Database-Backed**: Uses fast, direct database querying. There is no vector database, no embeddings, and no external search APIs required.

### AI (Optional)
- **Provider-Agnostic**: Supports OpenAI-compatible APIs and local Ollama deployments.
- **Server-Side Security**: Configured entirely on the server (`AI_PROVIDER`, `AI_MODEL`, `AI_API_KEY`, `AI_BASE_URL`). AI keys must never be exposed to the client.
- **AI Drafting**: Can generate content drafts for ICP, Personas, and Positioning.
- **Safe Persistence**: AI generates drafts for user review and editing only. It does not directly bypass normal application persistence or authorization boundaries.
- **Settings Diagnostics**: The Settings UI includes real-time AI configuration status and connection testing.

### Demo Mode
- Requires authentication but does **not** require an AI API key.
- Deterministically generates a real, fully isolated demo workspace and product for the authenticated user containing representative GTM data.
- It respects normal application data boundaries.
- **Not a shared sandbox**: Every user gets their own securely isolated instance of demo data.

### UI/UX
GTM OS features a modern UI/UX redesign built for clarity and focus:
- Clean light/white interface with a vibrant blue primary accent.
- Powered by `DM Sans` and `DM Mono` typography.
- Restrained borders, gentle radii, and subtle shadows.
- Product-scoped application shell.
- Updated Welcome and Auth experiences.
- Responsive two-column authentication/entry layout for desktop and mobile.

---

## Architecture

```
User
↓
Authentication
↓
Workspace
↓
Product
↓
GTM Modules
↓
PLAN → EXECUTE → MEASURE → LEARN → IMPROVE
```

**Key Security and Architectural Principles:**
- Workspace membership is actively verified when resolving workspace context.
- Product access is strictly scoped to the authorized workspace.
- Cross-product and cross-workspace context access is rejected by domain services.
- Bare workspace slug lookup is not treated as a security boundary.
- Archived products are not normally routable.
- Domain services perform their own authorization checks.
- AI drafts cannot bypass normal application persistence.
- Server-side secrets remain securely server-side.
- Demo data is strictly isolated per authenticated user.

Current product route pattern: `/w/[workspaceSlug]/[productSlug]`

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js (App Router), TypeScript |
| Styling | Tailwind CSS, shadcn/ui |
| Database | PostgreSQL, Drizzle ORM |
| Validation | Zod |
| Charts | Recharts |
| Authentication | Auth.js / NextAuth |
| Testing | Node.js built-in test runner, tsx |
| Linting | ESLint |

---

## Roadmap

### Current Focus
- UI refinement and visual polish
- GTM workflow improvements
- Navigation and information architecture
- Authentication and onboarding polish
- Search experience
- AI experience improvements
- Product stability
- Documentation and open-source project polish

### Future Possibilities
- Advanced GTM analytics
- Expanded experiments
- Additional research capabilities
- More AI-assisted workflows
- Integrations
- Collaboration features
- Advanced permissions

---

## Getting Started

### Prerequisites
- Node.js 22+
- PostgreSQL 14+
- Git

### Setup

```bash
# 1. Clone the repository
git clone https://github.com/mohammad-junaid786/gtm-os.git
cd gtm-os

# 2. Install dependencies
npm install

# 3. Configure environment
cp .env.example .env.local
# Edit .env.local and set your DATABASE_URL and Auth secrets
```

### Environment Variables
`DATABASE_URL` is required for core functionality.
```env
DATABASE_URL=your-postgresql-connection-string
AUTH_SECRET=your-auth-secret
```
AI environment variables (`AI_PROVIDER`, `AI_BASE_URL`, `AI_API_KEY`, `AI_MODEL`) are entirely optional.

### Run

```bash
# Run database migrations
npm run db:push

# Start the development server
npm run dev
```

### Available Scripts
```bash
npm run dev          # Start development server
npm run build        # Production build
npm run start        # Start production server

npm run lint         # ESLint
npm run typecheck    # TypeScript type check (tsc --noEmit)
npm test             # Run unit tests (Node.js built-in runner)

npm run db:generate  # Generate Drizzle migrations from schema
npm run db:push      # Push schema directly to database
npm run db:studio    # Open Drizzle Studio (database browser)
```

---

## Database

GTM OS is built exclusively on PostgreSQL and Drizzle ORM. 

The main domain models include:
- `workspaces` and `workspace_members`
- `products`
- `icps`, `personas`, `positioning`
- `competitors`, `research_library` (Research)
- `leads`, `campaigns`, `experiments`
- `learnings`

*Note: Analytics is computed dynamically as a read-only aggregation layer over these existing domain tables. There are no standalone analytics tables.*

---

## Open Source

GTM OS is an open-source, self-hostable project under active development. 

Useful repository entry points for exploring the codebase:
- [`docs/architecture.md`](docs/architecture.md)
- [`db/schema.ts`](db/schema.ts)
- [`lib/workspace/`](lib/workspace/)
- [`lib/product/`](lib/product/)
- [`lib/routing/`](lib/routing/)
- [`lib/ai/`](lib/ai/)
- [`lib/search/`](lib/search/)
- [`lib/demo/`](lib/demo/)