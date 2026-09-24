"use client";

import { useEffect, useState, useMemo, KeyboardEvent as ReactKeyboardEvent, useTransition, useRef } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Search, LayoutDashboard, Database } from "lucide-react";
import { useRouter } from "next/navigation";
import { NavSection } from "@/lib/navigation";
import { cn } from "@/lib/utils";
import { IconMap } from "./sidebar-nav";
import { useOptionalProductContext } from "@/lib/product-context";
import { searchProductEntitiesAction, SearchResults, SearchResultItem } from "@/lib/search/actions";

type MixedSearchResult = 
  | { type: "nav"; href: string; label: string; sectionLabel?: string; icon?: string }
  | { type: "entity"; entityType: string; href: string; title: string; subtitle?: string };

export function CommandMenu({
  open,
  onOpenChange,
  sections = [],
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sections?: NavSection[];
}) {
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const router = useRouter();

  const productCtx = useOptionalProductContext();
  const [isPending, startTransition] = useTransition();
  const [searchResults, setSearchResults] = useState<SearchResults | null>(null);
  
  // Debounce search
  useEffect(() => {
    if (!productCtx) {
      return;
    }

    const trimmed = query.trim();
    if (trimmed.length < 2) {
      return;
    }

    const timer = setTimeout(() => {
      startTransition(async () => {
        const res = await searchProductEntitiesAction(
          productCtx.workspaceSlug,
          productCtx.productSlug,
          productCtx.productId,
          trimmed
        );
        if (res.ok && res.data) {
          setSearchResults(res.data);
        } else {
          setSearchResults(null);
        }
      });
    }, 250);

    return () => clearTimeout(timer);
  }, [query, productCtx]);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        onOpenChange(!open);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [open, onOpenChange]);

  const navItems = useMemo(() => {
    return sections.flatMap((s) =>
      s.items.map((i) => ({ ...i, sectionLabel: s.label }))
    );
  }, [sections]);

  const filteredNavItems = useMemo(() => {
    if (!query) return navItems;
    return navItems.filter((item) =>
      item.label.toLowerCase().includes(query.toLowerCase())
    );
  }, [navItems, query]);

  const mixedItems: MixedSearchResult[] = useMemo(() => {
    const list: MixedSearchResult[] = [];
    
    // Add nav items
    for (const item of filteredNavItems) {
      list.push({ type: "nav", href: item.href, label: item.label, sectionLabel: item.sectionLabel, icon: item.icon as string });
    }

    // Add entity items if we have them
    if (searchResults) {
      const addEntities = (arr: SearchResultItem[], label: string) => {
        for (const item of arr) {
          list.push({
            type: "entity",
            entityType: label,
            href: item.href,
            title: item.title,
            subtitle: item.subtitle
          });
        }
      };

      addEntities(searchResults.icps, "ICP");
      addEntities(searchResults.personas, "Persona");
      addEntities(searchResults.positioning || [], "Positioning"); // in case we added it
      addEntities(searchResults.competitors, "Competitor");
      addEntities(searchResults.research, "Research");
      addEntities(searchResults.leads, "Lead");
      addEntities(searchResults.campaigns, "Campaign");
      addEntities(searchResults.experiments, "Experiment");
      addEntities(searchResults.learnings, "Learning");
    }

    return list;
  }, [filteredNavItems, searchResults]);

  const handleKeyDown = (e: ReactKeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % Math.max(1, mixedItems.length));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + mixedItems.length) % Math.max(1, mixedItems.length));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (mixedItems[selectedIndex]) {
        router.push(mixedItems[selectedIndex].href);
        onOpenChange(false);
      }
    }
  };

  const scrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    // Scroll selected item into view if it changes
    const container = scrollRef.current;
    if (!container) return;
    const selectedEl = container.children[selectedIndex] as HTMLElement;
    if (selectedEl) {
      const containerTop = container.scrollTop;
      const containerBottom = containerTop + container.clientHeight;
      const elTop = selectedEl.offsetTop;
      const elBottom = elTop + selectedEl.clientHeight;

      if (elTop < containerTop) {
        container.scrollTop = elTop;
      } else if (elBottom > containerBottom) {
        container.scrollTop = elBottom - container.clientHeight;
      }
    }
  }, [selectedIndex, mixedItems]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="p-0 overflow-hidden max-w-xl sm:rounded-xl">
        <div className="flex items-center border-b px-3">
          <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
          <input
            className="flex h-12 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
            placeholder="Type a command or search entities..."
            value={query}
            onChange={(e) => {
              const val = e.target.value;
              setQuery(val);
              setSelectedIndex(0);
              if (val.trim().length < 2) {
                setSearchResults(null);
              }
            }}
            onKeyDown={handleKeyDown}
            autoFocus
          />
          {isPending && <div className="text-xs text-muted-foreground ml-2">Searching...</div>}
        </div>
        <div ref={scrollRef} className="max-h-[300px] overflow-y-auto p-2">
          {mixedItems.length === 0 ? (
            <div className="py-6 text-center text-sm text-muted-foreground">
              {query.length >= 2 ? "No results found." : "No navigation items found."}
            </div>
          ) : (
            <div className="flex flex-col gap-1">
              {mixedItems.map((item, index) => {
                if (item.type === "nav") {
                  const Icon = (item.icon ? IconMap[item.icon] || LayoutDashboard : LayoutDashboard) as React.ElementType<{ className?: string }>;
                  return (
                    <button
                      key={`nav-${item.href}-${index}`}
                      onClick={() => {
                        router.push(item.href);
                        onOpenChange(false);
                      }}
                      className={cn(
                        "flex cursor-pointer items-center rounded-md px-2 py-2 text-sm text-left select-none outline-none",
                        index === selectedIndex
                          ? "bg-accent text-accent-foreground"
                          : "hover:bg-accent/50 text-foreground"
                      )}
                    >
                      <Icon className="mr-2 h-4 w-4" />
                      <span className="flex-1">{item.label}</span>
                      {item.sectionLabel && (
                        <span className="text-xs text-muted-foreground">
                          {item.sectionLabel}
                        </span>
                      )}
                    </button>
                  );
                } else {
                  return (
                    <button
                      key={`entity-${item.entityType}-${item.title}-${index}`}
                      onClick={() => {
                        router.push(item.href);
                        onOpenChange(false);
                      }}
                      className={cn(
                        "flex cursor-pointer items-center rounded-md px-2 py-2 text-sm text-left select-none outline-none",
                        index === selectedIndex
                          ? "bg-accent text-accent-foreground"
                          : "hover:bg-accent/50 text-foreground"
                      )}
                    >
                      <Database className="mr-2 h-4 w-4 opacity-70" />
                      <div className="flex-1 overflow-hidden">
                        <div className="truncate">{item.title}</div>
                        {item.subtitle && (
                          <div className="truncate text-xs opacity-70">{item.subtitle}</div>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground ml-2 px-1.5 py-0.5 rounded-sm bg-foreground/5">
                        {item.entityType}
                      </span>
                    </button>
                  );
                }
              })}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
