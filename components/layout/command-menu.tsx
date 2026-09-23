"use client";

import { useEffect, useState, useMemo, KeyboardEvent as ReactKeyboardEvent } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Search, LayoutDashboard } from "lucide-react";
import { useRouter } from "next/navigation";
import { NavSection } from "@/lib/navigation";
import { cn } from "@/lib/utils";
import { IconMap } from "./sidebar-nav";

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

  const items = useMemo(() => {
    return sections.flatMap((s) =>
      s.items.map((i) => ({ ...i, sectionLabel: s.label }))
    );
  }, [sections]);

  const filteredItems = useMemo(() => {
    if (!query) return items;
    return items.filter((item) =>
      item.label.toLowerCase().includes(query.toLowerCase())
    );
  }, [items, query]);

  // Selected index is reset when query changes via onChange
  
  const handleKeyDown = (e: ReactKeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % Math.max(1, filteredItems.length));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filteredItems.length) % Math.max(1, filteredItems.length));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (filteredItems[selectedIndex]) {
        router.push(filteredItems[selectedIndex].href);
        onOpenChange(false);
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="p-0 overflow-hidden max-w-xl sm:rounded-xl">
        <div className="flex items-center border-b px-3">
          <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
          <input
            className="flex h-12 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
            placeholder="Type a command or search..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
            autoFocus
          />
        </div>
        <div className="max-h-[300px] overflow-y-auto p-2">
          {filteredItems.length === 0 ? (
            <div className="py-6 text-center text-sm text-muted-foreground">
              No results found.
            </div>
          ) : (
            <div className="flex flex-col gap-1">
              {filteredItems.map((item, index) => {
                const Icon = (IconMap[item.icon as string] || LayoutDashboard) as React.ElementType<{ className?: string }>;
                return (
                  <button
                    key={item.href}
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
              })}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
