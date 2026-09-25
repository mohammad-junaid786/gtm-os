import { SidebarNav } from "@/components/layout/sidebar-nav";
import { cn } from "@/lib/utils";
import type { NavSection, NavItem } from "@/lib/navigation";
import { WorkspaceSwitcher } from "./workspace-switcher";
import Image from "next/image";

export function Sidebar({
  onNavigate,
  showBrand = true,
  className,
  sections,
  settingsItem,
  workspaces,
  currentWorkspaceId,
  currentProductSlug,
  productName,
}: {
  onNavigate?: () => void;
  showBrand?: boolean;
  className?: string;
  /** Product-scoped nav sections. Uses static sections when omitted. */
  sections?: NavSection[];
  /** Product-scoped settings item. Uses static /settings when omitted. */
  settingsItem?: NavItem;
  workspaces?: { id: string; name: string; slug: string }[];
  currentWorkspaceId?: string;
  currentProductSlug?: string;
  productName?: string;
}) {
  return (
    <div className={cn("flex h-full min-h-0 flex-col", className)}>
      {showBrand ? (
        <div className="flex shrink-0 flex-col border-b border-border">
          <div className="flex h-12 items-center px-5 gap-2">
            <Image src="/logo/gtm-os-logo.svg" alt="GTM OS Logo" width={20} height={20} className="shrink-0" />
            <p className="font-display text-sm font-semibold tracking-tight text-foreground">GTM OS</p>
          </div>
          {workspaces && workspaces.length > 0 && (
            <WorkspaceSwitcher
              workspaces={workspaces}
              currentWorkspaceId={currentWorkspaceId}
              currentProductSlug={currentProductSlug}
              productName={productName}
            />
          )}
        </div>
      ) : null}
      <SidebarNav
        onNavigate={onNavigate}
        sections={sections}
        settingsItem={settingsItem}
      />
    </div>
  );
}
