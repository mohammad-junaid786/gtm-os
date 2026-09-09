import { SidebarNav } from "@/components/layout/sidebar-nav";
import { cn } from "@/lib/utils";
import type { NavSection, NavItem } from "@/lib/navigation";

export function Sidebar({
  onNavigate,
  showBrand = true,
  className,
  sections,
  settingsItem,
}: {
  onNavigate?: () => void;
  showBrand?: boolean;
  className?: string;
  /** Product-scoped nav sections. Uses static sections when omitted. */
  sections?: NavSection[];
  /** Product-scoped settings item. Uses static /settings when omitted. */
  settingsItem?: NavItem;
}) {
  return (
    <div className={cn("flex h-full min-h-0 flex-col", className)}>
      {showBrand ? (
        <div className="flex h-14 shrink-0 items-center border-b border-border px-5">
          <p className="text-sm font-semibold tracking-tight text-foreground">GTM OS</p>
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
