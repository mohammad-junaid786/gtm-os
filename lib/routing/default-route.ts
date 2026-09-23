import { getDb } from "@/db";
import { workspaceMembers, workspaces, products } from "@/db/schema";
import { eq, isNull, and, asc, desc, sql } from "drizzle-orm";

export const _deps = {
  getDb,
};

export async function resolveUserDefaultRoute(userId: string) {
  const db = _deps.getDb();
  // Find the first workspace they are a member of
  const members = await db
    .select({
      workspaceId: workspaceMembers.workspace_id,
      workspaceSlug: workspaces.slug,
    })
    .from(workspaceMembers)
    .innerJoin(workspaces, eq(workspaceMembers.workspace_id, workspaces.id))
    .where(eq(workspaceMembers.user_id, userId))
    .orderBy(
      asc(sql`CASE WHEN ${workspaces.slug} LIKE 'demo-%' THEN 1 ELSE 0 END`),
      desc(workspaces.created_at)
    )
    .limit(1);

  if (members.length === 0) {
    return "/onboarding";
  }

  const workspace = members[0];

  // Find the first active product in that workspace
  const prods = await db
    .select({ slug: products.slug })
    .from(products)
    .where(and(eq(products.workspace_id, workspace.workspaceId), isNull(products.archived_at)))
    .limit(1);

  if (prods.length === 0) {
    return "/onboarding";
  }

  return `/w/${workspace.workspaceSlug}/${prods[0].slug}`;
}
