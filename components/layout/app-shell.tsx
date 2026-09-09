"use client";

import { type ReactNode, useEffect, useId, useState } from "react";
import { Header, MobileNavCloseButton } from "@/components/layout/header";
import { Sidebar } from "@/components/layout/sidebar";
import type { NavSection, NavItem } from "@/lib/navigation";

interface AppShellProps {
  children: ReactNode;
  /**
   * Product-scoped navigation sections. When omitted, the shell renders
   * the static flat-route sections (for pre-product-context routes).
   */
  sections?: NavSection[];
  /**
   * Product-scoped settings nav item.
   */
  settingsItem?: NavItem;
  /**
   * Workspace display name — shown in the header workspace indicator.
   */
  workspaceName?: string;
  /**
   * Product display name — used as a fallback header title.
   */
  productName?: string;
}

export function AppShell({
  children,
  sections,
  settingsItem,
  workspaceName,
  productName,
}: AppShellProps) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const titleId = useId();
  const sidebarId = "mobile-sidebar";

  useEffect(() => {
    if (!mobileNavOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMobileNavOpen(false);
    };

    document.addEventListener("keydown", onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [mobileNavOpen]);

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-50 focus:bg-surface focus:px-3 focus:py-2 focus:text-sm"
      >
        Skip to content
      </a>

      <aside className="sticky top-0 hidden h-screen w-56 shrink-0 border-r border-border bg-sidebar md:flex md:flex-col">
        <Sidebar sections={sections} settingsItem={settingsItem} />
      </aside>

      {mobileNavOpen ? (
        <div className="fixed inset-0 z-40 md:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/60"
            aria-label="Close navigation overlay"
            onClick={() => setMobileNavOpen(false)}
          />
          <div
            id={sidebarId}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            className="relative flex h-full w-64 max-w-[85vw] flex-col border-r border-border bg-sidebar"
          >
            <div className="flex h-14 shrink-0 items-center justify-between border-b border-border px-4">
              <p id={titleId} className="text-sm font-semibold tracking-tight">
                GTM OS
              </p>
              <MobileNavCloseButton onClose={() => setMobileNavOpen(false)} />
            </div>
            <Sidebar
              showBrand={false}
              onNavigate={() => setMobileNavOpen(false)}
              sections={sections}
              settingsItem={settingsItem}
            />
          </div>
        </div>
      ) : null}

      <div className="flex min-w-0 flex-1 flex-col">
        <Header
          mobileNavOpen={mobileNavOpen}
          onOpenMobileNav={() => setMobileNavOpen(true)}
          workspaceName={workspaceName}
          productName={productName}
        />
        <main id="main-content" className="min-w-0 flex-1 overflow-x-hidden px-4 py-6 md:px-6">
          {children}
        </main>
      </div>
    </div>
  );
}
