"use client";

import { useState, useSyncExternalStore } from "react";
import { usePathname } from "next/navigation";
import { Menu, Search, X } from "lucide-react";
import { Kbd } from "@/components/ui/kbd";
import { Button } from "@/components/ui/button";
import { getNavItemByPathname, NavSection } from "@/lib/navigation";
import { logoutAction } from "@/lib/actions/auth-actions";
import { CommandMenu } from "./command-menu";

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
  sections,
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
  sections?: NavSection[];
}) {
  const pathname = usePathname();
  const current = getNavItemByPathname(pathname);
  const title = current?.label ?? productName ?? "GTM OS";
  const isMac = useSyncExternalStore(subscribe, getMacSnapshot, () => false);
  const shortcut = isMac ? "⌘K" : "Ctrl K";
  
  const [commandOpen, setCommandOpen] = useState(false);

  return (
    <header className="flex h-14 shrink-0 items-center gap-4 border-b border-border bg-background px-4 md:px-6">
      <Button
        variant="ghost"
        size="icon"
        className="md:hidden text-muted-foreground"
        onClick={onOpenMobileNav}
        aria-controls="mobile-sidebar"
        aria-expanded={mobileNavOpen}
        aria-label="Open navigation"
      >
        <Menu className="size-4" aria-hidden="true" />
      </Button>

      <h1 className="font-display min-w-0 flex-1 truncate text-lg font-medium tracking-tight text-foreground">
        {title}
      </h1>

      <div className="flex flex-1 justify-end items-center gap-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setCommandOpen(true)}
          className="hidden h-8 w-full max-w-[200px] justify-start gap-2 px-2.5 text-muted-foreground sm:inline-flex font-normal"
          aria-label="Search navigation"
        >
          <Search className="size-3.5 shrink-0" aria-hidden="true" />
          <span className="flex-1 truncate text-left">Search</span>
          <Kbd className="bg-transparent border-none text-[10px] text-muted-foreground shadow-none px-0">{shortcut}</Kbd>
        </Button>

        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCommandOpen(true)}
          className="size-8 text-muted-foreground sm:hidden"
          aria-label="Search navigation"
        >
          <Search className="size-3.5" aria-hidden="true" />
        </Button>
        
        <CommandMenu open={commandOpen} onOpenChange={setCommandOpen} sections={sections} />

        <div className="h-4 w-px bg-border hidden sm:block" />

        <div className="flex items-center gap-2 pl-1">
          {workspaceName && (
            <span className="hidden max-w-[120px] truncate text-xs font-medium text-foreground sm:inline" title={workspaceName}>
              {workspaceName}
            </span>
          )}
          <div
            className="flex size-6 items-center justify-center rounded-full bg-muted text-[10px] font-bold text-muted-foreground"
            aria-label={workspaceName ? `Workspace: ${workspaceName}` : "User profile placeholder"}
          >
            {workspaceName ? workspaceName.charAt(0).toUpperCase() : "U"}
          </div>
        </div>

        <form action={logoutAction}>
          <Button
            type="submit"
            variant="ghost"
            size="sm"
            className="text-xs text-muted-foreground hover:text-foreground h-8 px-2"
          >
            Sign out
          </Button>
        </form>
      </div>
    </header>
  );
}

export function MobileNavCloseButton({ onClose }: { onClose: () => void }) {
  return (
    <button
      type="button"
      className="inline-flex size-8 items-center justify-center rounded-sm text-muted-foreground hover:bg-foreground/5 hover:text-foreground"
      onClick={onClose}
      aria-label="Close navigation"
    >
      <X className="size-4" aria-hidden="true" />
    </button>
  );
}
