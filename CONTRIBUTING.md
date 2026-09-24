# Contributing to GTM OS

Thank you for your interest in contributing to GTM OS! This guide will help you understand the project structure, how to set up your local development environment, and the expectations for pull requests.

## Project Purpose
GTM OS is an open-source Operating System for Go-To-Market teams. It provides a structured loop: **Plan → Execute → Measure → Learn → Improve → Plan Again**. 

Our goal is to build a robust, secure, and intuitive tool for managing strategy, execution, and analytics without the bloat of traditional enterprise CRMs.

## Repository Structure
- `app/`: Next.js App Router pages and API routes.
- `components/`: React components, organized by domain (e.g., `campaigns`, `learnings`).
- `lib/`: Core domain logic, server actions, and type definitions.
- `db/`: Drizzle ORM schema and database configuration.
- `docs/`: Architecture and self-hosting documentation.

## Local Development

### Prerequisites
- Node.js (v18+)
- PostgreSQL (v14+)

### Setup
1. Clone the repository and run `npm install`.
2. Copy `.env.example` to `.env.local` and configure your environment variables, including `DATABASE_URL`.
3. Push the database schema: `npm run db:push`.
4. Start the development server: `npm run dev`.

## Verification Commands
Before submitting a pull request, ensure your code meets the quality standards by running:

- **Typecheck**: `npm run typecheck`
- **Lint**: `npm run lint`
- **Tests**: `npm test`
- **Build**: `npm run build`

*Note on Tests: Database integration tests are designed to gracefully skip if `DATABASE_URL` is not provided in your test environment. Do not falsely report skipped tests as passing in your pull requests.*

## Architecture Expectations

### Server/Client Boundaries
- Data fetching and mutations must happen exclusively via Server Actions (`"use server"`) or server components.
- Client components (`"use client"`) should only be used for interactive UI and managing local state.

### Security and Isolation
- **Product & Workspace Isolation**: Every domain entity (campaigns, personas, learnings) must be strictly scoped to a `product_id`. Workspaces act as the primary authorization boundary.
- **Server-Only Secrets**: Never expose API keys or Auth secrets in the client bundle.
- **Source Entity Validation**: When linking entities (e.g., Learnings to Campaigns), ensure cross-product referencing is rejected.

### AI Development Rules
- AI is an **optional** enhancement (BYOK - Bring Your Own Key).
- AI keys remain strictly server-side.
- AI must never bypass authorization or product isolation.
- Core application functionality must always work perfectly without AI configured.

## Contribution Expectations
- **Keep changes focused**: Do not bundle unrelated refactoring into feature PRs.
- **Avoid premature complexity**: Stick to the current product blueprint. Do not introduce deferred features (e.g., task management, billing) casually.
- **Preserve security boundaries**: Maintain the integrity of workspace and product isolation.
- **Test your changes**: Add tests for new logic and ensure you run all verification commands before opening a PR.
