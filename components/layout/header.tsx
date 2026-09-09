"use client";

import { useSyncExternalStore } from "react";
import { usePathname } from "next/navigation";
import { Menu, Search, X } from "lucide-react";
import { Kbd } from "@/components/ui/kbd";
import { getNavItemByPathname } from "@/lib/navigation";

function subscribe() {
  return () => undefined;
}

function getMacSnapshot() {
  return /Mac|iPhone|iPad/.test(navigator.platform) || /Mac/.test(navigator.userAgent);
}

export function Header({
  onOpenMobileNav,
  mobileNavOpen,
  productName,
  workspaceName,
}: {
  onOpenMobileNav: () => void;
  mobileNavOpen: boolean;
  /**
   * When provided (product-scoped shell), the product name is shown in the
   * workspace indicator in the top-right corner.
   */
  productName?: string;
  /**
   * When provided (product-scoped shell), the workspace name is shown as a
   * label next to the workspace indicator.
   */
  workspaceName?: string;
}) {
  const pathname = usePathname();
  const current = getNavItemByPathname(pathname);
  const title = current?.label ?? productName ?? "GTM OS";
  const isMac = useSyncExternalStore(subscribe, getMacSnapshot, () => false);
  const shortcut = isMac ? "⌘K" : "Ctrl K";

  return (
    <header className="flex h-14 shrink-0 items-center gap-3 border-b border-border bg-background px-4 md:px-6">
      <button
        type="button"
        className="inline-flex size-8 items-center justify-center rounded-sm text-muted hover:bg-foreground/5 hover:text-foreground md:hidden"
        onClick={onOpenMobileNav}
        aria-controls="mobile-sidebar"
        aria-expanded={mobileNavOpen}
        aria-label="Open navigation"
      >
        <Menu className="size-4" aria-hidden="true" />
      </button>

      <p className="min-w-0 flex-1 truncate text-sm font-medium tracking-tight text-foreground">{title}</p>

      <button
        type="button"
        className="hidden h-8 max-w-xs min-w-44 items-center gap-2 rounded-sm border border-border bg-surface px-2.5 text-left text-sm text-muted sm:inline-flex"
        aria-label="Search (not available yet)"
      >
        <Search className="size-3.5 shrink-0" aria-hidden="true" />
        <span className="flex-1 truncate">Search</span>
        <Kbd>{shortcut}</Kbd>
      </button>

      <button
        type="button"
        className="inline-flex size-8 items-center justify-center rounded-sm border border-border text-muted sm:hidden"
        aria-label="Search (not available yet)"
      >
        <Search className="size-3.5" aria-hidden="true" />
      </button>

      <div className="flex items-center gap-2">
        {workspaceName ? (
          <span className="hidden max-w-28 truncate text-xs text-muted sm:inline" title={workspaceName}>
            {workspaceName}
          </span>
        ) : (
          <span className="hidden text-xs text-muted sm:inline">Workspace</span>
        )}
        <div
          className="flex size-7 items-center justify-center rounded-sm border border-border bg-surface text-[11px] font-medium text-muted"
          aria-label={workspaceName ? `Workspace: ${workspaceName}` : "User profile placeholder"}
        >
          {workspaceName ? workspaceName.charAt(0).toUpperCase() : "—"}
        </div>
      </div>
    </header>
  );
}

export function MobileNavCloseButton({ onClose }: { onClose: () => void }) {
  return (
    <button
      type="button"
      className="inline-flex size-8 items-center justify-center rounded-sm text-muted hover:bg-foreground/5 hover:text-foreground"
      onClick={onClose}
      aria-label="Close navigation"
    >
      <X className="size-4" aria-hidden="true" />
    </button>
  );
}
