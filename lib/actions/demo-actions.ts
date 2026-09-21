"use server";

import { _deps } from "@/lib/demo/demo-deps";
import { DEMO_PRODUCT_SLUG } from "@/lib/demo/demo-seeder";

export type CreateDemoResult =
  | { ok: true; redirectUrl: string }
  | { ok: false; error: string };

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
