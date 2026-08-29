import type { LucideIcon } from "lucide-react";
import {
  Building2,
  LayoutDashboard,
  ListOrdered,
  Megaphone,
  Radio,
  Search,
  Settings,
  Target,
  Users,
  Workflow,
} from "lucide-react";

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  description: string;
};

export type NavSection = {
  id: string;
  label: string;
  items: NavItem[];
};

export const navSections: NavSection[] = [
  {
    id: "workspace",
    label: "Workspace",
    items: [
      {
        href: "/",
        label: "Overview",
        icon: LayoutDashboard,
        description: "Workspace snapshot and recent activity.",
      },
      {
        href: "/accounts",
        label: "Accounts",
        icon: Building2,
        description: "Companies and target accounts.",
      },
      {
        href: "/contacts",
        label: "Contacts",
        icon: Users,
        description: "People associated with accounts.",
      },
      {
        href: "/campaigns",
        label: "Campaigns",
        icon: Megaphone,
        description: "Outbound and inbound campaign work.",
      },
    ],
  },
  {
    id: "intelligence",
    label: "Intelligence",
    items: [
      {
        href: "/icp",
        label: "ICP",
        icon: Target,
        description: "Ideal customer profile definitions.",
      },
      {
        href: "/signals",
        label: "Signals",
        icon: Radio,
        description: "Market and account signals.",
      },
      {
        href: "/research",
        label: "Research",
        icon: Search,
        description: "Account and market research.",
      },
    ],
  },
  {
    id: "execution",
    label: "Execution",
    items: [
      {
        href: "/plays",
        label: "Plays",
        icon: Workflow,
        description: "Repeatable go-to-market plays.",
      },
      {
        href: "/sequences",
        label: "Sequences",
        icon: ListOrdered,
        description: "Multi-step outreach sequences.",
      },
    ],
  },
];

export const settingsItem: NavItem = {
  href: "/settings",
  label: "Settings",
  icon: Settings,
  description: "Workspace and application preferences.",
};

export function getAllNavItems(): NavItem[] {
  return [...navSections.flatMap((section) => section.items), settingsItem];
}

export function getNavItemByPathname(pathname: string): NavItem | undefined {
  const items = getAllNavItems();
  const exact = items.find((item) => item.href === pathname);
  if (exact) return exact;
  return items.find(
    (item) => item.href !== "/" && (pathname === item.href || pathname.startsWith(`${item.href}/`)),
  );
}

export function isNavItemActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}
