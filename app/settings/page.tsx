import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { getDb } from "@/db";
import { workspaces, workspaceMembers } from "@/db/schema";
import { eq } from "drizzle-orm";
import { PageHeader } from "@/components/ui/page-header";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { buildProductNav } from "@/lib/navigation";
import { resolveUserDefaultRoute } from "@/lib/routing/default-route";

export const metadata: Metadata = { title: "Settings" };

import { products } from "@/db/schema";
import { asc } from "drizzle-orm";
import { AiSettings } from "@/components/settings/ai-settings";
import { getAiSettingsStatusAction } from "@/lib/ai/actions";

export default async function SettingsPage(
  props: { searchParams?: Promise<{ [key: string]: string | string[] | undefined }> }
) {
  const searchParams = props.searchParams ? await props.searchParams : {};
  const requestedWorkspace = typeof searchParams.w === 'string' ? searchParams.w : undefined;

  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const db = getDb();
  const userWorkspaces = await db
    .select({
      id: workspaces.id,
      name: workspaces.name,
      slug: workspaces.slug,
      role: workspaceMembers.role,
    })
    .from(workspaceMembers)
    .innerJoin(workspaces, eq(workspaceMembers.workspace_id, workspaces.id))
    .where(eq(workspaceMembers.user_id, session.user.id));

  let primaryWorkspace = null;
  if (requestedWorkspace) {
    primaryWorkspace = userWorkspaces.find((w) => w.slug === requestedWorkspace);
  }

  let defaultRoute = "";
  if (!primaryWorkspace) {
    defaultRoute = await resolveUserDefaultRoute(session.user.id);
    const defaultWorkspaceSlug = defaultRoute.match(/^\/w\/([^/]+)/)?.[1];
    primaryWorkspace = userWorkspaces.find((w) => w.slug === defaultWorkspaceSlug) || userWorkspaces[0];
  }

  // If we have a primary workspace but no defaultRoute, build it from the workspace's first product
  if (primaryWorkspace && !defaultRoute) {
    const p = await db.select({ slug: products.slug })
      .from(products)
      .where(eq(products.workspace_id, primaryWorkspace.id))
      .orderBy(asc(products.created_at))
      .limit(1);
    
    if (p.length > 0) {
      defaultRoute = `/w/${primaryWorkspace.slug}/${p[0].slug}`;
    } else {
      defaultRoute = `/w/${primaryWorkspace.slug}`;
    }
  }

  // Fallback if everything else fails
  if (!defaultRoute) {
    defaultRoute = "/onboarding";
  }

  const { sections, settingsItem } = buildProductNav(defaultRoute === "/onboarding" ? "/" : defaultRoute);

  const aiStatus = await getAiSettingsStatusAction();

  return (
    <AppShell
      sections={sections}
      settingsItem={settingsItem}
      workspaceName={primaryWorkspace?.name ?? "GTM OS"}
      productName="Settings"
      workspaces={userWorkspaces}
      currentWorkspaceId={primaryWorkspace?.id}
    >
      <div className="flex flex-col gap-8 max-w-5xl">
        <PageHeader
          eyebrow="SETTINGS"
          title="Account Configuration"
          description="Manage your account preferences and workspace settings."
        />

        <div className="grid gap-6 sm:grid-cols-2">
          <section className="flex flex-col gap-4">
            <h2 className="text-sm font-medium text-foreground tracking-tight">Account Information</h2>
            <div className="rounded-md border border-border bg-background p-6 space-y-4">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Email</p>
                <p className="text-sm text-foreground">{session.user.email ?? "No email provided"}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Authentication Method</p>
                <p className="text-sm text-foreground">Credentials (Password)</p>
              </div>
            </div>
          </section>

          {primaryWorkspace && (
            <section className="flex flex-col gap-4">
              <h2 className="text-sm font-medium text-foreground tracking-tight">Primary Workspace</h2>
              <div className="rounded-md border border-border bg-background p-6 space-y-4">
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Workspace Name</p>
                  <p className="text-sm text-foreground">{primaryWorkspace.name}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Workspace Slug</p>
                  <p className="text-sm text-foreground font-mono">{primaryWorkspace.slug}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Your Role</p>
                  <p className="text-sm text-foreground capitalize">{primaryWorkspace.role}</p>
                </div>
              </div>
            </section>
          )}

          <div className="sm:col-span-2">
            <AiSettings status={aiStatus} />
          </div>
        </div>
      </div>
    </AppShell>
  );
}
