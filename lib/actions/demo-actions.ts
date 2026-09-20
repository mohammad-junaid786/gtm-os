"use server";

import { getCurrentUserId } from "@/lib/routing/current-user";
import { getDb } from "@/db";
import { workspaces, workspaceMembers, products } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { seedDemoWorkspace, DEMO_WORKSPACE_NAME, DEMO_PRODUCT_SLUG } from "@/lib/demo/demo-seeder";

export type CreateDemoResult =
  | { ok: true; redirectUrl: string }
  | { ok: false; error: string };

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

/**
 * Creates or retrieves the demo workspace for the current authenticated user.
 */
export async function createDemoAction(): Promise<CreateDemoResult> {
  const userId = await _deps.getCurrentUserId();
  if (!userId) {
    return { ok: false, error: "Not authenticated" };
  }

  try {
    // Deterministic lookup: Authenticated user + specific demo name + specific demo product slug.
    // This perfectly isolates demo lookup to the current user's membership.
    const existing = await _deps.lookupExistingDemoWorkspace(userId);

    if (existing) {
      // Demo workspace already exists, just return the redirect URL
      return {
        ok: true,
        redirectUrl: `/w/${existing.workspaceSlug}/${DEMO_PRODUCT_SLUG}`,
      };
    }

    // Seed the demo workspace securely
    const { workspaceSlug, productSlug } = await _deps.seedDemoWorkspace(userId);

    return {
      ok: true,
      redirectUrl: `/w/${workspaceSlug}/${productSlug}`,
    };
  } catch (error) {
    console.error("Failed to create demo workspace:", error);
    return { ok: false, error: "An unexpected error occurred while creating the demo environment." };
  }
}
