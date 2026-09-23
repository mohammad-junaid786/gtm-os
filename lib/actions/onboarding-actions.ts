"use server";

import { getCurrentUserId } from "@/lib/routing/current-user";
import { getDb } from "@/db";
import { workspaces, products, workspaceMembers } from "@/db/schema";
import { z } from "zod";
import { redirect } from "next/navigation";
import { resolveUserDefaultRoute } from "@/lib/routing/default-route";


import { eq, and } from "drizzle-orm";

const OnboardingSchema = z.object({
  workspaceName: z.string().min(2, "Workspace name is too short.").optional(),
  productName: z.string().min(2, "Product name is too short."),
});

// A simple slugify if it doesn't exist in utils, but I'll implement a fallback
function toSlug(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

export async function submitOnboardingAction(formData: FormData) {
  const userId = await getCurrentUserId();
  if (!userId) {
    return { error: "Not authenticated" };
  }

  const mode = formData.get("mode") as string | null;
  const workspaceId = formData.get("workspaceId") as string | null;
  
  const workspaceName = formData.get("workspaceName") as string | null;
  const productName = formData.get("productName") as string;

  const parsed = OnboardingSchema.safeParse({ workspaceName: workspaceName || undefined, productName });
  if (!parsed.success) {
    return { error: parsed.error.errors[0].message };
  }

  const pSlug = toSlug(productName) || "product";
  const db = getDb();
  let targetWorkspaceSlug = "";

  try {
    if (mode === "create-product" && workspaceId) {
      // Validate they are a member
      const memberships = await db
        .select({ slug: workspaces.slug })
        .from(workspaceMembers)
        .innerJoin(workspaces, eq(workspaceMembers.workspace_id, workspaces.id))
        .where(and(eq(workspaceMembers.user_id, userId), eq(workspaceMembers.workspace_id, workspaceId)))
        .limit(1);

      if (memberships.length === 0) {
        return { error: "Not authorized to create a product in this workspace." };
      }
      targetWorkspaceSlug = memberships[0].slug;

      await db.insert(products).values({
        workspace_id: workspaceId,
        name: productName,
        slug: pSlug + "-" + Math.random().toString(36).substring(2, 6),
      });
    } else {
      if (!workspaceName) return { error: "Workspace name is required." };
      const wSlug = toSlug(workspaceName) || "workspace";
      const wResult = await db
        .insert(workspaces)
        .values({
          name: workspaceName,
          slug: wSlug + "-" + Math.random().toString(36).substring(2, 6), // prevent collisions easily for MVP
        })
        .returning();

      const newWorkspace = wResult[0];
      targetWorkspaceSlug = newWorkspace.slug;

      await db.insert(workspaceMembers).values({
        workspace_id: newWorkspace.id,
        user_id: userId,
        role: "owner",
      });

      await db
        .insert(products)
        .values({
          workspace_id: newWorkspace.id,
          name: productName,
          slug: pSlug,
        });
    }
  } catch (error) {
    console.error(error);
    return { error: "Failed to create resource." };
  }

  // If creating a product specifically from a workspace, redirect to it directly.
  if (mode === "create-product" && targetWorkspaceSlug) {
    redirect(`/w/${targetWorkspaceSlug}`);
  }

  const route = await resolveUserDefaultRoute(userId);
  redirect(route);
}
