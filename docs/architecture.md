# Architecture

GTM OS is a single self-hostable Next.js App Router application backed by PostgreSQL.

## Current boundaries

- `app/` contains routes, layouts, and page-level UI composition.
- `components/` is reserved for reusable UI, including future shadcn/ui components.
- `lib/` contains shared helpers and server environment validation.
- `db/` owns the server-only Drizzle client and schema entry point.
- `drizzle/` contains generated migrations produced by `drizzle-kit generate`.

The database client is server-only and reads `DATABASE_URL` only at runtime. No current environment values are exposed to client bundles.

---

## Part 3 – Stage 1: Data-Model Foundation

Stage 1 introduces the three core domain tables: `workspaces`, `workspace_members`, and `products`. No authentication, no provisioning logic, and no UI integration are included at this stage.

### Workspace model

A workspace is the top-level organizational unit. It has a human-readable `name` and a URL-safe `slug` that is globally unique across the system. No owner column exists on the workspace row itself; ownership is expressed through membership roles. No `created_by` or `default_product_id` fields are present. The workspace slug is immutable by convention (no slug history table).

### Workspace slug uniqueness

`workspaces.slug` carries a unique constraint enforced by the database. Slug uniqueness is global (not scoped to any parent entity).

### Workspace membership model

`workspace_members` is a join table between workspaces and principals. Each row records one principal's role in one workspace.

- `workspace_id` is a FK to `workspaces.id` with `ON DELETE CASCADE`. Deleting a workspace removes all its membership rows automatically.
- `user_id` is a plain UUID column with **no foreign key**. It is an opaque internal principal ID. No `users` table exists yet. Authentication is deferred to a later stage.
- `role` is a text column restricted to exactly two values — `'owner'` and `'member'` — enforced by a `CHECK` constraint.
- A composite unique index on `(workspace_id, user_id)` prevents duplicate memberships.
- A partial unique index on `workspace_id WHERE role = 'owner'` enforces that exactly one member per workspace holds the owner role.
- A secondary index on `user_id` supports efficient "all workspaces for a user" queries.

### Owner role

Exactly one workspace member may hold the `'owner'` role per workspace. This is enforced at the database level by a partial unique index, not application logic. Ownership cannot be shared. The owner role is not stored on the workspace row.

### Opaque UUID user_id / no users table

`workspace_members.user_id` references future user identities but carries no FK today. This design allows the membership model to be established independently of any auth provider decision. A users table and auth integration are explicitly deferred.

### Product tenancy

Each product belongs to exactly one workspace via `products.workspace_id` (FK to `workspaces.id`). The FK uses `ON DELETE RESTRICT`, which means a workspace cannot be deleted while it has products. Products must be explicitly archived and eventually cleaned up before workspace deletion becomes possible.

### Product slug uniqueness

`(workspace_id, slug)` is unique within a workspace. The same slug may be used in a different workspace. Uniqueness includes archived products — once a slug is taken in a workspace, it remains taken even after the product is archived.

### Product archiving

Products are never hard-deleted. Archiving is represented by the `archived_at` column:

- `archived_at IS NULL` → the product is active.
- `archived_at IS NOT NULL` → the product is archived (timestamp records when it was archived).

There is no `is_default` flag and no product ACL or product membership model at this stage.

### Foreign key behaviour summary

| FK column | References | ON DELETE |
|---|---|---|
| `workspace_members.workspace_id` | `workspaces.id` | CASCADE |
| `products.workspace_id` | `workspaces.id` | RESTRICT |

### Authentication deferred

No authentication system has been chosen or installed. Clerk, Auth.js, Better Auth, Supabase Auth, and Firebase Auth are all explicitly excluded from Stage 1. Authentication will be addressed in a later stage.

### Routing/context deferred

Workspace-scoped and product-scoped routing (e.g. `/w/[workspaceSlug]/[productSlug]`) and workspace context switching are deferred to Stage 4. No routing changes were made in Stage 1.


---

## Part 3 – Stage 2: Workspace Creation & Membership

Stage 2 adds the server-side domain logic for creating workspaces and their initial owner membership. No UI integration and no new routes are introduced at this stage.

### Module layout

```
lib/workspace/
  slug.ts       – Pure slug utilities (no DB, fully testable)
  types.ts      – Domain types (inputs, outputs, error union)
  service.ts    – Server-only service functions
  index.ts      – Barrel re-export
  slug.test.ts  – Unit tests for slug utilities
```

### Slug resolution

Slugs are derived from the workspace name when not explicitly supplied. The normalisation pipeline is:

1. Lowercase the input.
2. Replace whitespace, underscores, and common punctuation with hyphens.
3. Strip any remaining non-`[a-z0-9-]` characters (handles Unicode).
4. Collapse consecutive hyphens to one.
5. Strip leading/trailing hyphens.
6. Truncate to 63 characters (DNS label limit).

An explicitly provided slug goes through the same normalisation. An empty result after normalisation is a validation error (`SLUG_INVALID`), not a database operation.

### Transaction boundary

`createWorkspace` inserts the `workspaces` row and the initial owner `workspace_members` row inside a single Drizzle transaction. The database is never left with a workspace that has no owner.

### Error model

The service returns a `WorkspaceResult<T>` discriminated union (`{ ok: true, data }` | `{ ok: false, error }`). The `WorkspaceServiceError` union has these codes:

| Code | Cause |
|---|---|
| `SLUG_CONFLICT` | PostgreSQL unique violation on `workspaces.slug` |
| `SLUG_INVALID` | Slug is empty or malformed after normalisation |
| `NAME_EMPTY` | Workspace name is an empty string |
| `OWNER_ID_INVALID` | `ownerId` is not a valid UUID |
| `UNKNOWN` | Unexpected database or runtime error |

### owner_id / authentication deferred

`createWorkspace` accepts an `ownerId: string` (UUID). Callers are responsible for supplying a valid principal ID. No auth check is performed inside the service — this is intentional, matching Stage 1's decision to defer authentication.

### Testing

The slug utilities in `lib/workspace/slug.ts` are pure functions with 27 unit tests covering normalisation edge cases, validation, and error paths. Tests run via Node.js built-in `node:test` runner with `tsx` for TypeScript support — no new test framework dependency.

Run tests: `npm test`


---

## Part 3 – Stage 3: Product CRUD

Stage 3 adds the server-side domain/service layer for creating, reading, updating, and archiving products within a workspace. No UI, routing, or auth is introduced.

### Module layout

```
lib/product/
  types.ts          – Domain types (inputs, outputs, error union) — no server-only
  service.ts        – Server-only service functions (workspace-scoped)
  index.ts          – Barrel re-export
  product.test.ts   – Unit/validation tests
lib/test-setup/
  server-only-stub.cjs – CJS shim that stubs server-only for the test runner
```

### Workspace-scoping requirement (IDOR prevention)

Every product service method requires an explicit `workspaceId`. A product ID alone is **never** accepted as sufficient context. This prevents cross-workspace data access (Insecure Direct Object Reference).

```
// Correct — always workspace-scoped
getProductById(workspaceId, productId)
updateProduct(workspaceId, productId, input)
archiveProduct(workspaceId, productId)
getProductsForWorkspace(workspaceId)
createProduct({ workspaceId, name, slug? })

// Rejected — product ID alone is not implemented
getProductById(productId)  // ← does not exist
```

A product in workspace A is indistinguishable from a non-existent product when queried with workspace B's context — `PRODUCT_NOT_FOUND` is returned in both cases. This is intentional: callers must not be able to determine whether a productId exists in a different workspace.

### Archive semantics

Products are **never hard-deleted**. "Deleting" a product means archiving it:

- `archived_at IS NULL` → active product
- `archived_at IS NOT NULL` → archived product

`getProductsForWorkspace` excludes archived products (filters `archived_at IS NULL`). `getProductById` returns both active and archived products — callers check `archived_at` if needed. Archived products cannot be updated (`PRODUCT_ALREADY_ARCHIVED`). Archiving an already-archived product also returns `PRODUCT_ALREADY_ARCHIVED`. Product restoration is not implemented at this stage.

### Slug uniqueness

Product slugs are unique per workspace: `UNIQUE(workspace_id, slug)`. The same slug is allowed in different workspaces. The constraint includes archived products — an archived product's slug remains reserved and cannot be reused by a new product in the same workspace. This decision was made deliberately to avoid slug reuse confusion and URL collisions in future routing stages.

Slug normalisation uses the shared `lib/workspace/slug.ts` utilities (same 6-step pipeline as workspace slugs).

### Slug lifecycle

| Operation | Slug behavior |
|---|---|
| `createProduct` (no slug) | Derived from `name` via `slugFromName` |
| `createProduct` (explicit slug) | Normalised and validated; used as-is |
| `updateProduct` (no slug) | **Existing slug is preserved** — name change does NOT change the slug |
| `updateProduct` (explicit slug) | Normalised, validated, and updated; DB enforces uniqueness |
| `archiveProduct` | Slug is unchanged and remains reserved |

Slugs are intentionally **stable after creation** unless the caller explicitly provides a new one. This makes URLs predictable and avoids breaking references when product names are edited.

### Error model

The product service returns a `ProductResult<T>` discriminated union:

| Code | Cause |
|---|---|
| `WORKSPACE_ID_INVALID` | `workspaceId` is not a valid UUID |
| `PRODUCT_ID_INVALID` | `productId` is not a valid UUID |
| `NAME_EMPTY` | Product name is empty or missing |
| `SLUG_INVALID` | Slug is empty or malformed after normalisation |
| `SLUG_CONFLICT` | PostgreSQL unique violation on `(workspace_id, slug)` |
| `PRODUCT_NOT_FOUND` | Product does not exist in this workspace (or belongs to another workspace) |
| `PRODUCT_ALREADY_ARCHIVED` | Attempted update or re-archive of an archived product |
| `NO_UPDATE_FIELDS` | `updateProduct` called with no fields to change |
| `UNKNOWN` | Unexpected database or runtime error |

### getDb() error handling

All DB access is wrapped in `try/catch` so that infrastructure errors (missing `DATABASE_URL`, connection failures) surface as `UNKNOWN` rather than unhandled throws. This is important for testability: validation-only paths return typed errors before `getDb()` is ever called.

### Testing

41 tests in `lib/product/product.test.ts` across 11 suites. All tests are deterministic and require no live database:

- Slug normalisation (6 tests) — shared pipeline with workspace slugs
- `isValidSlug` for product slugs (7 tests)
- `slugFromName` for products (3 tests)
- `createProduct` validation paths (5 tests)
- `updateProduct` input validation (4 tests)
- `updateProduct` slug behavior (4 tests) — verify preservation vs. derivation distinction
- `archiveProduct` validation paths (2 tests)
- `getProductById` validation paths (2 tests)
- `getProductsForWorkspace` validation paths (1 test)
- Workspace-scoping contract / function arity (5 tests)
- Archive semantics / `ProductRow` type shape (2 tests)

The `server-only` package is stubbed at test runner startup via `lib/test-setup/server-only-stub.cjs`, which is pre-loaded via `--require` in the `npm test` script. This allows service modules to be statically imported in tests while running in plain Node.js.

Run tests: `npm test`


---

## Part 3 – Stage 4: Routing + Workspace/Product Context

Stage 4 introduces the secure route resolution layer that maps URL parameters to fully-resolved domain objects. No authentication, no UI redesign, and no product CRUD UI are introduced.

### URL structure

```
/w/[workspaceSlug]/[productSlug]
```

Example: `/w/acme/acme-analytics`

The route resolves through:

```
URL params (workspaceSlug, productSlug)
  + userId (from future auth seam)
→ resolveProductContext()
→ { workspace: WorkspaceRow, product: ProductRow (active) }
→ page renders
```

### Module layout

```
lib/routing/
  types.ts          – Domain types (ProductContext, RouteResolutionError) — no server-only
  resolver.ts       – Server-only resolvers (resolveWorkspaceForUser, getProductBySlug,
                       resolveProductContext)
  current-user.ts   – Auth seam (server-only; returns null until auth is configured)
  index.ts          – Barrel re-export
  resolver.test.ts  – Validation/contract tests (no live DB required)

app/w/
  [workspaceSlug]/
    [productSlug]/
      layout.tsx    – Minimal layout (root AppShell still wraps it; Stage 5 migrates this)
      page.tsx      – Product page; calls notFound() until auth is wired up
```

### Why `getWorkspaceBySlug` is not a security boundary

`getWorkspaceBySlug` (Stage 2) looks up a workspace by slug alone. It does NOT check whether the requesting user is a member of that workspace. Using it as a gate would allow any caller who knows a workspace slug to access its data — a significant authorization hole.

Stage 4 replaces this with `resolveWorkspaceForUser(userId, workspaceSlug)`, which performs a JOIN through `workspace_members`:

```sql
SELECT workspaces.*
FROM   workspace_members
JOIN   workspaces ON workspace_members.workspace_id = workspaces.id
WHERE  workspace_members.user_id = $userId
AND    workspaces.slug = $normalizedSlug
LIMIT  1;
```

If either the workspace does not exist OR the user is not a member, `NOT_FOUND` is returned. The two cases are indistinguishable to callers.

### Membership-aware workspace resolver

`resolveWorkspaceForUser(userId, workspaceSlug)`:

1. Validates `userId` as a UUID before DB access → `USER_ID_INVALID`
2. Normalises and validates `workspaceSlug` → `WORKSPACE_SLUG_INVALID`
3. JOINs `workspace_members` and `workspaces` — one round-trip
4. Returns `NOT_FOUND` for both "workspace missing" and "user not a member"
5. Returns the resolved `WorkspaceRow` on success

### Workspace-scoped product lookup

`getProductBySlug(workspaceId, productSlug)`:

- Requires `workspaceId` — product slugs are NEVER resolved globally
- Normalises and validates `productSlug` before DB access
- Returns both active and archived products (caller decides)
- `resolveProductContext` rejects archived products explicitly

### Product context resolver

`resolveProductContext({ userId, workspaceSlug, productSlug })` orchestrates:

1. `resolveWorkspaceForUser` — validate userId, then establish membership
2. `getProductBySlug(workspace.id, productSlug)` — workspace-scoped
3. Reject archived products (`archived_at IS NOT NULL`) → `NOT_FOUND`
4. Return `{ workspace, product }` — both canonical DB objects, never raw URL values

All negative outcomes (invalid user, bad slug, no membership, no product, archived product) return `NOT_FOUND`. Callers cannot distinguish failure reasons.

### NOT_FOUND generic error policy

| Actual failure reason | Returned error code |
|---|---|
| `userId` is not a UUID | `USER_ID_INVALID` |
| `workspaceSlug` normalises to empty | `WORKSPACE_SLUG_INVALID` |
| Workspace does not exist | `NOT_FOUND` |
| Workspace exists but user is not a member | `NOT_FOUND` |
| Product does not exist in workspace | `NOT_FOUND` |
| Product exists but is archived | `NOT_FOUND` |
| DB/infra error | `UNKNOWN` |

`USER_ID_INVALID` and `WORKSPACE_SLUG_INVALID` surface from `resolveProductContext` so that callers can distinguish malformed inputs from legitimate not-found states. These fire before any DB access.

### Explicit userId requirement

Every resolver requires an explicit `userId`. There is no fallback, no first-workspace-for-user shortcut, and no default principal. If `userId` is not available (auth not configured), the call must not be made.

### Authentication seam

`lib/routing/current-user.ts` exports `getCurrentUserId(): Promise<string | null>`. Currently returns `null`. The product route page calls it first:

```ts
const userId = await getCurrentUserId();
if (!userId) notFound();  // no fake user, no bypass
```

When a real auth provider is chosen, only `getCurrentUserId` needs to change. The resolver chain, membership check, and route structure remain identical.

### Archived products not routable

`resolveProductContext` rejects products with `archived_at IS NOT NULL`. Archived products return the same `NOT_FOUND` as missing products — the UI cannot distinguish them. Archived products may be accessed by admin tooling via `getProductBySlug` directly (which returns all products), but they will never resolve through the standard product route.

### No database schema changes

Stage 4 uses the existing `workspaces`, `workspace_members`, and `products` tables from Stage 1. No migration was created.

### Testing

20 tests in `lib/routing/resolver.test.ts` across 6 suites. All tests are deterministic and require no live database:

- `resolveWorkspaceForUser` input validation (6 tests)
- `getProductBySlug` input validation (5 tests)
- `resolveProductContext` orchestration (4 tests)
- `ProductContext` type shape (2 tests)
- Cross-workspace scoping contract (1 test)
- Slug normalisation in resolvers (2 tests)

Run tests: `npm test`


---

## Part 3 – Stage 5: Product-Scoped Application Shell

Stage 5 connects the Stage 4 workspace/product routing context to the GTM OS application shell and Overview dashboard. The shell is now genuinely product-scoped — no fake users, no hardcoded IDs.

### Root layout vs product layout responsibilities

| Concern | Root layout (`app/layout.tsx`) | Product layout (`app/w/[workspaceSlug]/[productSlug]/layout.tsx`) |
|---|---|---|
| HTML/body structure | ✅ | — |
| Google Fonts | ✅ | — |
| Global CSS | ✅ | — |
| Auth + context resolution | — | ✅ |
| AppShell rendering | — | ✅ |
| Product-scoped navigation | — | ✅ |
| ProductContextProvider | — | ✅ |

The root layout no longer mounts `AppShell`. Pre-product-context routes (`/`, `/accounts`, etc.) render without the shell — they are pre-authentication placeholders and have no resolved product context.

### AppShell is now product-scoped

`AppShell` is mounted exclusively inside the product route layout. It receives:

- `sections` — product-scoped nav from `buildProductNav(basePath)`
- `settingsItem` — product-scoped settings link
- `workspaceName` — shown in the header workspace indicator
- `productName` — used as fallback header title

All props are optional; the component's original static-nav behavior is preserved for backward compatibility.

### ProductContext propagation

The server layout resolves the full domain context (`WorkspaceRow` + `ProductRow`) and extracts a **serializable subset** to pass to the client:

```
Server layout (server component)
  → resolveProductContext() [DB access, server-only]
  → extract { workspaceId, workspaceName, workspaceSlug,
               productId, productName, productSlug }
  → <ProductContextProvider value={...}> (client component)
      → useProductContext() available in any child client component
```

No raw DB objects, no server-only modules, and no secrets cross the server/client boundary. Only plain strings are passed to the client.

### ProductContextProvider + useProductContext

`lib/product-context.tsx` exports:

- `ProductContextProvider` — wraps the product shell with resolved context
- `useProductContext()` — hook for client components to access workspace/product display values
- `ProductContextValue` — the serializable context shape

### Product-scoped navigation

`lib/navigation.ts` exports `buildProductNav(basePath)` which returns nav sections and a settings item with all hrefs prefixed by `basePath` (e.g. `/w/acme/acme-analytics`):

```
/w/[workspaceSlug]/[productSlug]          → Overview
/w/[workspaceSlug]/[productSlug]/accounts → Accounts (placeholder)
/w/[workspaceSlug]/[productSlug]/contacts → Contacts (placeholder)
...
/w/[workspaceSlug]/[productSlug]/settings → Settings (placeholder)
```

Future module pages are added to `buildProductNav` — they appear in the sidebar automatically. Static `navSections` (flat routes) are preserved for backward compat.

### SidebarNav / Sidebar / Header

`SidebarNav` and `Sidebar` now accept optional `sections` and `settingsItem` props (default: static flat-route nav).

`Header` now accepts optional `workspaceName` and `productName` props. When `workspaceName` is provided:
- The top-right indicator shows the workspace's first letter (avatar-style)
- The workspace name is shown as a label next to the indicator

### Overview is now product-aware

`OverviewDashboard` accepts optional `workspaceName` and `productName` props. When provided:
- `<h1>` shows the product name
- The description shows `workspace · product — go-to-market overview`

The product overview page (`page.tsx`) does NOT duplicate context resolution. Instead it renders `ProductContextConsumer` — a thin `"use client"` component that reads from `ProductContextProvider` and forwards `workspaceName` + `productName` to `OverviewDashboard`.

```
layout.tsx (server) → resolveProductContext → ProductContextProvider
page.tsx (server)   → ProductContextConsumer (client)
                    → useProductContext()
                    → OverviewDashboard({ workspaceName, productName })
```

### Pre-product-context routes

The existing flat routes (`/`, `/accounts`, `/campaigns`, etc.) were NOT deleted. They render without AppShell (no shell = no sidebar, no header). They remain as pre-authentication entry points. A future auth integration can redirect authenticated users from `/` to their product route.

### Authentication behavior

The product layout calls `getCurrentUserId()` — the Stage 4 auth seam — first. Since auth is not yet implemented:
1. `getCurrentUserId()` returns `null`
2. The layout calls `notFound()` immediately
3. The product shell and all child pages are unreachable

No fake user, no bypass, no hardcoded workspace/product IDs. Once `getCurrentUserId` is connected to a real auth provider, the full product shell resolves without architectural rewrites.

### Module layout

```
lib/
  navigation.ts             – buildProductNav(basePath) added
  product-context.tsx       – ProductContextProvider, useProductContext

components/
  layout/
    app-shell.tsx           – accepts sections/settingsItem/workspaceName/productName
    sidebar.tsx             – forwards sections/settingsItem to SidebarNav
    sidebar-nav.tsx         – accepts sections/settingsItem props (defaults preserved)
    header.tsx              – accepts workspaceName/productName props
    product-context-consumer.tsx – thin client bridge for the overview page
  overview-dashboard.tsx    – accepts workspaceName/productName props

app/
  layout.tsx                – root layout: HTML/body/fonts/CSS only (no AppShell)
  page.tsx                  – standalone landing page (no AppShell)
  w/
    [workspaceSlug]/
      [productSlug]/
        layout.tsx          – auth → resolve context → AppShell → ProductContextProvider
        page.tsx            – product overview via ProductContextConsumer
```

### No new dependencies

Stage 5 uses only existing project dependencies. No Redux, Zustand, Jotai, or other global state libraries were added.

Run tests: `npm test`