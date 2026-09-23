export type NavItem = {
  href: string;
  label: string;
  icon: string;
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
        icon: "LayoutDashboard",
        description: "Workspace snapshot and recent activity.",
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
        icon: "Target",
        description: "Ideal customer profile definitions.",
      },
      {
        href: "/research",
        label: "Research",
        icon: "Search",
        description: "Account and market research.",
      },
    ],
  },
  {
    id: "execution",
    label: "Execution",
    items: [
      {
        href: "/leads",
        label: "Leads",
        icon: "Building2",
        description: "Target accounts and contacts.",
      },
      {
        href: "/campaigns",
        label: "Campaigns",
        icon: "Megaphone",
        description: "Outbound and inbound campaign work.",
      },
      {
        href: "/experiments",
        label: "Experiments",
        icon: "Beaker",
        description: "GTM experiments and hypotheses.",
      },
    ],
  },
];

export const settingsItem: NavItem = {
  href: "/settings",
  label: "Settings",
  icon: "Settings",
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

  const match = b.match(/^\/w\/([^/]+)/);
  const workspaceSlug = match ? match[1] : null;
  const settingsHref = workspaceSlug ? `/settings?w=${workspaceSlug}` : "/settings";

  return {
    sections: [
      {
        id: "product",
        label: "Product",
        items: [
          {
            href: b,
            label: "Overview",
            icon: "LayoutDashboard",
            description: "Product snapshot and recent activity.",
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
            icon: "Target",
            description: "Ideal customer profile for this product.",
          },
          {
            href: `${b}/strategy/personas`,
            label: "Personas",
            icon: "Users",
            description: "Buyer roles and messaging within the ICP.",
          },
          {
            href: `${b}/strategy/positioning`,
            label: "Positioning",
            icon: "MessageSquare",
            description: "How your product is uniquely positioned in the market.",
          },
          {
            href: `${b}/strategy/competitors`,
            label: "Competitors",
            icon: "Swords",
            description: "Track and analyze your competitive landscape.",
          },
        ],
      },
      {
        id: "intelligence",
        label: "Intelligence",
        items: [
          {
            href: `${b}/research`,
            label: "Research",
            icon: "Search",
            description: "Account and market research.",
          },
        ],
      },
      {
        id: "execution",
        label: "Execution",
        items: [
          {
            href: `${b}/execution/leads`,
            label: "Leads",
            icon: "Building2",
            description: "Target accounts and contacts.",
          },
          {
            href: `${b}/execution/campaigns`,
            label: "Campaigns",
            icon: "Megaphone",
            description: "Outbound and inbound campaign work.",
          },
          {
            href: `${b}/execution/experiments`,
            label: "Experiments",
            icon: "Beaker",
            description: "GTM experiments and hypotheses.",
          },
        ],
      },
      {
        id: "measurement",
        label: "Measurement",
        items: [
          {
            href: `${b}/analytics`,
            label: "Analytics",
            icon: "BarChart2",
            description: "Performance metrics for your go-to-market execution.",
          },
          {
            href: `${b}/learnings`,
            label: "Learnings",
            icon: "Lightbulb",
            description: "Strategic insights and action items.",
          },
        ],
      },
    ],
    settingsItem: {
      href: settingsHref,
      label: "Settings",
      icon: "Settings",
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
  const baseHref = href.split("?")[0];
  if (baseHref === "/") return pathname === "/";
  if (pathname === baseHref) return true;

  // Overview routes have exactly /w/[workspaceSlug]/[productSlug] (3 segments after /)
  // e.g. /w/demo/product
  // Test if it's EXACTLY the product root
  const isProductRoot = /^\/w\/[^/]+\/[^/]+$/.test(baseHref);
  if (isProductRoot) return false; // Exact match was already checked above

  // Settings is a global route that should only match exact or sub-routes under it
  if (baseHref === "/settings") return pathname.startsWith("/settings");

  return pathname.startsWith(`${baseHref}/`);
}
