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