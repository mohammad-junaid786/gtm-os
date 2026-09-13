"use server";

import { getCurrentUserId } from "@/lib/routing/current-user";
import { getDb } from "@/db";
import { workspaces, products, workspaceMembers } from "@/db/schema";
import { z } from "zod";
import { redirect } from "next/navigation";
import { resolveUserDefaultRoute } from "@/lib/routing/default-route";


const OnboardingSchema = z.object({
  workspaceName: z.string().min(2, "Workspace name is too short."),
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

  const workspaceName = formData.get("workspaceName") as string;
  const productName = formData.get("productName") as string;

  const parsed = OnboardingSchema.safeParse({ workspaceName, productName });
  if (!parsed.success) {
    return { error: parsed.error.errors[0].message };
  }

  const wSlug = toSlug(workspaceName) || "workspace";
  const pSlug = toSlug(productName) || "product";

  try {
    const db = getDb();
    // We should ideally use a transaction, but let's just insert sequentially for MVP
    const wResult = await db
      .insert(workspaces)
      .values({
        name: workspaceName,
        slug: wSlug + "-" + Math.random().toString(36).substring(2, 6), // prevent collisions easily for MVP
      })
      .returning();

    const newWorkspace = wResult[0];

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

  } catch (error) {
    console.error(error);
    return { error: "Failed to create workspace." };
  }

  const route = await resolveUserDefaultRoute(userId);
  redirect(route);
}
