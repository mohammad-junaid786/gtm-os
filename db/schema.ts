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