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

function NavLink({ item, onNavigate }: { item: NavItem; onNavigate?: () => void }) {
  const pathname = usePathname();
  const active = isNavItemActive(pathname, item.href);
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex items-center gap-2.5 rounded-sm px-2 py-1.5 text-[13px] transition-colors",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
        active ? "bg-foreground/5 text-foreground" : "text-muted hover:bg-foreground/5 hover:text-foreground",
      )}
    >
      <span
        className={cn("h-4 w-0.5 shrink-0 rounded-full", active ? "bg-accent" : "bg-transparent")}
        aria-hidden="true"
      />
      <Icon className="size-3.5 shrink-0" aria-hidden="true" />
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
  /**
   * Navigation sections to render. Defaults to the static flat-route sections.
   * Pass the result of buildProductNav(basePath).sections for product-scoped nav.
   */
  sections?: NavSection[];
  /**
   * Settings nav item. Defaults to the static /settings item.
   * Pass buildProductNav(basePath).settingsItem for product-scoped nav.
   */
  settingsItem?: NavItem;
}) {
  return (
    <nav aria-label="Primary" className="flex h-full flex-col">
      <div className="flex-1 space-y-6 overflow-y-auto px-3 py-4">
        {sections.map((section) => (
          <div key={section.id}>
            <p className="px-2.5 pb-2 text-[11px] font-medium tracking-[0.08em] text-muted uppercase">
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
