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

// ---------------------------------------------------------------------------
// Static nav sections — used by the legacy flat routes (pre-product-context).
// When the product context is available, use buildProductNav() instead.
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Product-scoped nav builder (Stage 5+)
//
// Generates navigation sections whose hrefs are prefixed with the product
// base path: /w/[workspaceSlug]/[productSlug]
//
// Usage:
//   const { sections, settings } = buildProductNav("/w/acme/acme-analytics");
//
// Future module pages should be added here (e.g. /strategy, /research)
// rather than as top-level flat routes.
// ---------------------------------------------------------------------------

export interface ProductNavConfig {
  sections: NavSection[];
  settingsItem: NavItem;
}

/**
 * Build product-scoped navigation items for a given product base path.
 *
 * @param basePath - The product base path, e.g. "/w/acme/acme-analytics"
 */
export function buildProductNav(basePath: string): ProductNavConfig {
  const b = basePath.replace(/\/$/, ""); // strip trailing slash

  return {
    sections: [
      {
        id: "product",
        label: "Product",
        items: [
          {
            href: b,
            label: "Overview",
            icon: LayoutDashboard,
            description: "Product snapshot and recent activity.",
          },
          {
            href: `${b}/accounts`,
            label: "Accounts",
            icon: Building2,
            description: "Companies and target accounts.",
          },
          {
            href: `${b}/contacts`,
            label: "Contacts",
            icon: Users,
            description: "People associated with accounts.",
          },
          {
            href: `${b}/campaigns`,
            label: "Campaigns",
            icon: Megaphone,
            description: "Outbound and inbound campaign work.",
          },
        ],
      },
      {
        id: "strategy",
        label: "Strategy",
        items: [
          {
            href: `${b}/strategy/icp`,
            label: "ICP",
            icon: Target,
            description: "Ideal customer profile for this product.",
          },
        ],
      },
      {
        id: "intelligence",
        label: "Intelligence",
        items: [
          {
            href: `${b}/signals`,
            label: "Signals",
            icon: Radio,
            description: "Market and account signals.",
          },
          {
            href: `${b}/research`,
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
            href: `${b}/plays`,
            label: "Plays",
            icon: Workflow,
            description: "Repeatable go-to-market plays.",
          },
          {
            href: `${b}/sequences`,
            label: "Sequences",
            icon: ListOrdered,
            description: "Multi-step outreach sequences.",
          },
        ],
      },
    ],
    settingsItem: {
      href: `${b}/settings`,
      label: "Settings",
      icon: Settings,
      description: "Workspace and application preferences.",
    },
  };
}

// ---------------------------------------------------------------------------
// Helpers (used by both static and product-scoped nav)
// ---------------------------------------------------------------------------

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
  // Exact match or sub-path match
  return pathname === href || pathname.startsWith(`${href}/`);
}
