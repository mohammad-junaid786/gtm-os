"use server";

import { getCurrentUserId } from "@/lib/routing/current-user";
import { getDb } from "@/db";
import { workspaces, workspaceMembers, products } from "@/db/schema";
import { and, eq, isNull, asc } from "drizzle-orm";
import { z } from "zod";

const SwitchSchema = z.object({
  targetWorkspaceId: z.string().uuid(),
  currentProductSlug: z.string().optional(),
});

export async function switchWorkspaceAction(targetWorkspaceId: string, currentProductSlug?: string) {
  const userId = await getCurrentUserId();
  if (!userId) {
    return { error: "Not authenticated", url: null };
  }

  const parsed = SwitchSchema.safeParse({ targetWorkspaceId, currentProductSlug });
  if (!parsed.success) {
    return { error: "Invalid parameters", url: null };
  }

  const db = getDb();
  
  // 1. Verify user is a member of the target workspace
  const workspaceRows = await db
    .select({ slug: workspaces.slug })
    .from(workspaces)
    .innerJoin(workspaceMembers, eq(workspaces.id, workspaceMembers.workspace_id))
    .where(
      and(
        eq(workspaces.id, targetWorkspaceId),
        eq(workspaceMembers.user_id, userId)
      )
    )
    .limit(1);

  if (workspaceRows.length === 0) {
    return { error: "Workspace not found or unauthorized", url: null };
  }

  const workspaceSlug = workspaceRows[0].slug;

  // 2. See if the current product slug exists in the target workspace and is active
  if (currentProductSlug) {
    const matchedProduct = await db
      .select({ slug: products.slug })
      .from(products)
      .where(
        and(
          eq(products.workspace_id, targetWorkspaceId),
          eq(products.slug, currentProductSlug),
          isNull(products.archived_at)
        )
      )
      .limit(1);

    if (matchedProduct.length > 0) {
      return { ok: true, url: `/w/${workspaceSlug}/${matchedProduct[0].slug}` };
    }
  }

  // 3. Fallback: Find the first active product in the target workspace
  const firstProduct = await db
    .select({ slug: products.slug })
    .from(products)
    .where(
      and(
        eq(products.workspace_id, targetWorkspaceId),
        isNull(products.archived_at)
      )
    )
    .orderBy(asc(products.created_at))
    .limit(1);

  if (firstProduct.length > 0) {
    return { ok: true, url: `/w/${workspaceSlug}/${firstProduct[0].slug}` };
  }

  // 4. No products exist in the target workspace
  return { ok: true, url: `/w/${workspaceSlug}` };
}
