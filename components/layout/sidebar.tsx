import { SidebarNav } from "@/components/layout/sidebar-nav";
import { cn } from "@/lib/utils";

export function Sidebar({
  onNavigate,
  showBrand = true,
  className,
}: {
  onNavigate?: () => void;
  showBrand?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("flex h-full min-h-0 flex-col", className)}>
      {showBrand ? (
        <div className="flex h-14 shrink-0 items-center border-b border-border px-5">
          <p className="text-sm font-semibold tracking-tight text-foreground">GTM OS</p>
        </div>
      ) : null}
      <SidebarNav onNavigate={onNavigate} />
    </div>
  );
}
