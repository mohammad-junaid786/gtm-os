import { getCurrentUserId } from "@/lib/routing/current-user";
import { getDb } from "@/db";
import { workspaces, workspaceMembers, products } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { seedDemoWorkspace, DEMO_WORKSPACE_NAME, DEMO_PRODUCT_SLUG } from "@/lib/demo/demo-seeder";

export const _deps = {
  getCurrentUserId,
  lookupExistingDemoWorkspace: async (userId: string) => {
    const db = getDb();
    const existing = await db
      .select({
        workspaceSlug: workspaces.slug,
      })
      .from(workspaces)
      .innerJoin(workspaceMembers, eq(workspaces.id, workspaceMembers.workspace_id))
      .innerJoin(products, eq(workspaces.id, products.workspace_id))
      .where(
        and(
          eq(workspaceMembers.user_id, userId),
          eq(workspaces.name, DEMO_WORKSPACE_NAME),
          eq(products.slug, DEMO_PRODUCT_SLUG)
        )
      )
      .limit(1);
    
    return existing.length > 0 ? existing[0] : null;
  },
  seedDemoWorkspace
};
