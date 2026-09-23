import { SidebarNav } from "@/components/layout/sidebar-nav";
import { cn } from "@/lib/utils";
import type { NavSection, NavItem } from "@/lib/navigation";
import { WorkspaceSwitcher } from "./workspace-switcher";

export function Sidebar({
  onNavigate,
  showBrand = true,
  className,
  sections,
  settingsItem,
  workspaces,
  currentWorkspaceId,
  currentProductSlug,
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
}) {
  return (
    <div className={cn("flex h-full min-h-0 flex-col", className)}>
      {showBrand ? (
        <div className="flex shrink-0 flex-col border-b border-border">
          <div className="flex h-12 items-center px-5 gap-2">
            <div className="flex h-5 w-5 items-center justify-center rounded-sm bg-primary">
              <span className="text-[9px] font-bold leading-none text-primary-foreground tracking-tight">G</span>
            </div>
            <p className="font-display text-sm font-semibold tracking-tight text-foreground">GTM OS</p>
          </div>
          {workspaces && workspaces.length > 0 && (
            <WorkspaceSwitcher
              workspaces={workspaces}
              currentWorkspaceId={currentWorkspaceId}
              currentProductSlug={currentProductSlug}
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
