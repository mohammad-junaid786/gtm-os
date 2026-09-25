"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  isNavItemActive,
  navSections,
  settingsItem as defaultSettingsItem,
  type NavItem,
  type NavSection,
} from "@/lib/navigation";
import { cn } from "@/lib/utils";

import {
  Building2,
  LayoutDashboard,
  ListOrdered,
  Megaphone,
  MessageSquare,
  Radio,
  Search,
  Settings,
  Swords,
  Target,
  Users,
  Workflow,
  Beaker,
  BarChart2,
  Lightbulb,
} from "lucide-react";

export const IconMap: Record<string, React.ElementType> = {
  Building2,
  LayoutDashboard,
  ListOrdered,
  Megaphone,
  MessageSquare,
  Radio,
  Search,
  Settings,
  Swords,
  Target,
  Users,
  Workflow,
  Beaker,
  BarChart2,
  Lightbulb,
};

function NavLink({ item, onNavigate }: { item: NavItem; onNavigate?: () => void }) {
  const pathname = usePathname();
  const active = isNavItemActive(pathname, item.href);
  const Icon = IconMap[item.icon] || LayoutDashboard;

  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-[13px] transition-colors duration-150",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
        active
          ? "bg-primary-muted text-primary font-medium"
          : "text-foreground-secondary hover:bg-surface-subtle hover:text-foreground font-medium"
      )}
    >
      <Icon
        className={cn("size-[16px] shrink-0", active ? "text-primary" : "text-foreground-muted")}
        aria-hidden="true"
      />
      <span className="truncate">{item.label}</span>
    </Link>
  );
}

export function SidebarNav({
  onNavigate,
  sections = navSections,
  settingsItem = defaultSettingsItem,
}: {
  onNavigate?: () => void;
  sections?: NavSection[];
  settingsItem?: NavItem;
}) {
  return (
    <nav aria-label="Primary" className="flex h-full flex-col">
      <div className="flex-1 space-y-5 overflow-y-auto px-3 py-5">
        {sections.map((section) => (
          <div key={section.id}>
            <p className="mb-1 px-2.5 text-[10px] font-medium tracking-wider text-foreground-muted uppercase">
              {section.label}
            </p>
            <ul className="space-y-0.5">
              {section.items.map((item) => (
                <li key={item.href}>
                  <NavLink item={item} onNavigate={onNavigate} />
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-border px-3 py-3">
        <NavLink item={settingsItem} onNavigate={onNavigate} />
      </div>
    </nav>
  );
}
