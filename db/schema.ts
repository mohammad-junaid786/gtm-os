import {
  pgTable,
  uuid,
  text,
  timestamp,
  uniqueIndex,
  index,
  check,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";


// ---------------------------------------------------------------------------
// workspaces
// ---------------------------------------------------------------------------

export const workspaces = pgTable(
  "workspaces",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updated_at: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("workspaces_slug_unique").on(t.slug),
  ],
);

// ---------------------------------------------------------------------------
// workspace_members
// ---------------------------------------------------------------------------

export const workspaceMembers = pgTable(
  "workspace_members",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    workspace_id: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    /** Opaque internal principal ID. No FK — users table does not exist yet. */
    user_id: uuid("user_id").notNull(),
    role: text("role").notNull(),
    created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updated_at: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    // One membership per workspace+user
    uniqueIndex("workspace_members_workspace_id_user_id_unique").on(
      t.workspace_id,
      t.user_id,
    ),
    // Exactly one owner per workspace (partial unique index)
    uniqueIndex("workspace_members_one_owner_per_workspace")
      .on(t.workspace_id)
      .where(sql`${t.role} = 'owner'`),
    // Efficient lookups by user
    index("workspace_members_user_id_idx").on(t.user_id),
    // Role must be 'owner' or 'member'
    check("workspace_members_role_check", sql`${t.role} IN ('owner', 'member')`),
  ],
);

// ---------------------------------------------------------------------------
// products
// ---------------------------------------------------------------------------

export const products = pgTable(
  "products",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    workspace_id: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "restrict" }),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    /** NULL → active; non-NULL → archived. Products are never hard-deleted. */
    archived_at: timestamp("archived_at", { withTimezone: true }),
    created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updated_at: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    // Slug unique per workspace (includes archived rows deliberately)
    uniqueIndex("products_workspace_id_slug_unique").on(t.workspace_id, t.slug),
    // Efficient filtering by workspace + archive status
    index("products_workspace_id_archived_at_idx").on(
      t.workspace_id,
      t.archived_at,
    ),
  ],
);

// ---------------------------------------------------------------------------
// icps (Ideal Customer Profiles)
//
// Ownership hierarchy: workspace → product → ICP.
//
// Design decisions (Stage 6):
// - One ICP per product at MVP. Enforced at BOTH the service layer (pre-insert
//   check for friendlier errors) AND the database level (partial unique index:
//   UNIQUE(product_id) WHERE archived_at IS NULL). The DB constraint is the
//   final authority and prevents races. The schema allows multiple archived
//   ICPs per product without constraint.
// - ICP is product-scoped: product_id is the only ownership column needed.
//   workspace_id would be redundant since products already carry workspace_id.
// - archived_at follows the same soft-delete pattern as products.
//   ICPs are archived rather than hard-deleted to preserve strategic history.
// - FK uses ON DELETE RESTRICT because products are archived, not hard-deleted.
//   A product row is never physically removed, so CASCADE is not required.
// - Pain points, goals, buying signals, and disqualifiers are stored as text
//   arrays to allow structured multi-value input while remaining simple to
//   query and display. Future AI enrichment can use these arrays directly.
// - business_model uses a check constraint for the allowed values.
// ---------------------------------------------------------------------------

export const icps = pgTable(
  "icps",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    product_id: uuid("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "restrict" }),

    // ── Identity ─────────────────────────────────────────────────────────────
    name: text("name").notNull(),
    description: text("description"),

    // ── Firmographics ────────────────────────────────────────────────────────
    /** E.g. "SaaS", "Financial Services", "Healthcare" */
    industry: text("industry"),
    /** Rough company size band, e.g. "11-50", "51-200", "201-1000" */
    company_size: text("company_size"),
    /** E.g. "North America", "EMEA", "Global" */
    geography: text("geography"),
    /** Allowed values: b2b | b2c | b2b2c | marketplace */
    business_model: text("business_model"),

    // ── Needs & signals (stored as arrays for structured multi-value input) ──
    /** Free-form pain points the ICP experiences */
    pain_points: text("pain_points").array(),
    /** Goals/outcomes the ICP is trying to achieve */
    goals: text("goals").array(),
    /** Observable signals indicating ICP fit */
    buying_signals: text("buying_signals").array(),
    /** Signals that disqualify an account from this ICP */
    disqualifiers: text("disqualifiers").array(),

    // ── Freeform ─────────────────────────────────────────────────────────────
    notes: text("notes"),

    // ── Lifecycle ────────────────────────────────────────────────────────────
    /** NULL → active; non-NULL → archived. ICPs are never hard-deleted. */
    archived_at: timestamp("archived_at", { withTimezone: true }),
    created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updated_at: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    // Fast lookup of all ICPs for a product
    index("icps_product_id_idx").on(t.product_id),
    // One active ICP per product enforced at the database level.
    // Allows multiple archived ICPs (no constraint when archived_at IS NOT NULL).
    // This partial unique index is the final authority on the invariant;
    // the service layer also checks before insert for a friendlier error.
    uniqueIndex("icps_one_active_per_product")
      .on(t.product_id)
      .where(sql`${t.archived_at} IS NULL`),
    // business_model is constrained if present
    check(
      "icps_business_model_check",
      sql`${t.business_model} IS NULL OR ${t.business_model} IN ('b2b', 'b2c', 'b2b2c', 'marketplace')`,
    ),
  ],
);