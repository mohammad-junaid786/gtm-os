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
  sections,
}: {
  onOpenMobileNav: () => void;
  mobileNavOpen: boolean;
  /**
   * When provided (product-scoped shell), the product name is shown in the
   * workspace indicator in the top-right corner.
   */
  productName?: string;
  sections?: NavSection[];
}) {
  const pathname = usePathname();
  const current = getNavItemByPathname(pathname);
  const title = current?.label ?? productName ?? "GTM OS";
  const isMac = useSyncExternalStore(subscribe, getMacSnapshot, () => false);
  const shortcut = isMac ? "⌘K" : "Ctrl K";
  
  const [commandOpen, setCommandOpen] = useState(false);

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-border bg-background px-4 md:px-6">
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden text-muted-foreground shrink-0"
          onClick={onOpenMobileNav}
          aria-controls="mobile-sidebar"
          aria-expanded={mobileNavOpen}
          aria-label="Open navigation"
        >
          <Menu className="size-4" aria-hidden="true" />
        </Button>

        <div className="hidden md:block h-4 w-1 rounded-full bg-primary shrink-0" aria-hidden="true" />
        <h1 className="font-display min-w-0 truncate text-[15px] font-semibold tracking-tight text-foreground">
          {title}
        </h1>
      </div>

      <div className="flex items-center justify-end gap-2 sm:gap-4 shrink-0">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setCommandOpen(true)}
          className="hidden h-8 w-full max-w-[240px] justify-start gap-2 px-3 text-muted-foreground bg-surface hover:bg-surface-subtle border-border-subtle shadow-sm sm:inline-flex font-normal rounded-md transition-colors"
          aria-label="Search navigation"
        >
          <Search className="size-3.5 shrink-0" aria-hidden="true" />
          <span className="flex-1 truncate text-left text-[13px]">Search</span>
          <Kbd className="bg-transparent border-none text-[10px] text-muted-foreground shadow-none px-0">{shortcut}</Kbd>
        </Button>

        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCommandOpen(true)}
          className="size-8 text-muted-foreground hover:text-foreground sm:hidden"
          aria-label="Search navigation"
        >
          <Search className="size-4" aria-hidden="true" />
        </Button>
        
        <CommandMenu open={commandOpen} onOpenChange={setCommandOpen} sections={sections} />

        <div className="h-4 w-px bg-border-subtle hidden sm:block mx-1" />

        <div className="flex items-center gap-3">
          <div
            className="flex size-7 items-center justify-center rounded-full bg-primary/10 text-[11px] font-semibold text-primary"
            aria-label="User profile"
          >
            U
          </div>

          <form action={logoutAction}>
            <Button
              type="submit"
              variant="ghost"
              size="sm"
              className="text-[13px] font-medium text-muted-foreground hover:text-foreground hover:bg-surface-subtle h-8 px-2.5 rounded-md transition-colors"
            >
              Sign out
            </Button>
          </form>
        </div>
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
