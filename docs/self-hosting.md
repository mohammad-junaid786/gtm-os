# Self-Hosting GTM OS

GTM OS is designed to be self-hostable. It relies on Next.js for the full stack, PostgreSQL for the database, and standard OAuth providers for authentication.

## Prerequisites

- **Node.js**: v18 or newer.
- **PostgreSQL**: v14 or newer.
- **Git**: For cloning the repository.

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd gtm-os
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure Environment**
   Copy the example environment file and fill in your values.
   ```bash
   cp .env.example .env.local
   ```
   *See the Environment Variables section below for details.*

4. **Configure PostgreSQL**
   Ensure your PostgreSQL instance is running and create a database for GTM OS. Set the `DATABASE_URL` environment variable.

5. **Run Migrations**
   Before starting the application, you must apply the database schema.
   ```bash
   npm run db:push
   ```
   *Note: This command pushes the Drizzle schema directly to the database.*

6. **Start Development Server**
   ```bash
   npm run dev
   ```

## Environment Variables

### Database Connection
- `DATABASE_URL`: The PostgreSQL connection string. 
  *(Example: `postgresql://user:password@localhost:5432/gtm_os`)*

### Authentication (Auth.js)
- `AUTH_SECRET`: A random string used to encrypt session cookies. Generate one using `openssl rand -base64 32`.
- `AUTH_GITHUB_ID` / `AUTH_GITHUB_SECRET`: GitHub OAuth credentials.
- `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET`: Google OAuth credentials.

## Database Migrations
Drizzle ORM is used for database interactions. When first setting up the project, or after pulling new updates, ensure your database schema is up to date:
```bash
npm run db:push
```

## AI / Bring Your Own Key (BYOK)
AI capabilities in GTM OS (e.g., generating drafts, contextual insights) are **entirely optional**. The core application functions completely without an AI provider.

If you wish to enable AI:
- The architecture is provider-agnostic but natively configured via the UI.
- **API keys remain server-side**: You must configure AI settings in the Workspace Settings UI.
- Never expose your AI keys in client-side variables or commit them to the repository.

## Production Deployment

To run GTM OS in production:

1. **Build the application**
   ```bash
   npm run build
   ```

2. **Start the production server**
   ```bash
   npm start
   ```

## Common Setup Problems

- **Missing `DATABASE_URL`**: The application and tests that require a database will fail or skip gracefully. Ensure PostgreSQL is running and the URL is correct.
- **Unapplied Migrations**: If you see relation errors, ensure you've run `npm run db:push`.
- **Authentication Misconfiguration**: If you cannot log in, verify that your OAuth callback URLs match your host, and that `AUTH_SECRET` is set.
