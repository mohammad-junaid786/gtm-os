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
      productName="Settings"
      workspaces={userWorkspaces}
      currentWorkspaceId={primaryWorkspace?.id}
    >
      <div className="flex flex-col max-w-5xl space-y-12 pb-16">
        <PageHeader
          eyebrow="SETTINGS"
          title="Account Configuration"
          description="Manage your account preferences and workspace settings."
        />

        <div className="space-y-12">
          {/* Account Information */}
          <section className="flex flex-col md:flex-row gap-6 md:gap-12">
            <div className="md:w-1/3 shrink-0">
              <h2 className="text-base font-semibold text-foreground tracking-tight">Account</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Your personal authentication details.
              </p>
            </div>
            <div className="flex-1 rounded-xl border border-border-subtle bg-surface shadow-sm overflow-hidden">
              <div className="p-6 space-y-6">
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-1">Email</p>
                  <p className="text-sm text-foreground">{session.user.email ?? "No email provided"}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-1">Authentication Method</p>
                  <p className="text-sm text-foreground">Credentials (Password)</p>
                </div>
              </div>
            </div>
          </section>

          {/* Primary Workspace */}
          {primaryWorkspace && (
            <section className="flex flex-col md:flex-row gap-6 md:gap-12">
              <div className="md:w-1/3 shrink-0">
                <h2 className="text-base font-semibold text-foreground tracking-tight">Workspace</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Details about your active workspace.
                </p>
              </div>
              <div className="flex-1 rounded-xl border border-border-subtle bg-surface shadow-sm overflow-hidden">
                <div className="p-6 space-y-6">
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-1">Workspace Name</p>
                    <p className="text-sm text-foreground">{primaryWorkspace.name}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-1">Workspace Slug</p>
                    <p className="text-sm text-foreground font-mono bg-surface-subtle inline-block px-2 py-0.5 rounded-md border border-border mt-1">{primaryWorkspace.slug}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-1">Your Role</p>
                    <p className="text-sm text-foreground capitalize inline-flex items-center px-2 py-0.5 rounded-md bg-primary/10 text-primary border border-primary/20 font-medium mt-1">{primaryWorkspace.role}</p>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* AI Settings Component */}
          <AiSettings status={aiStatus} />
        </div>
      </div>
    </AppShell>
  );
}
