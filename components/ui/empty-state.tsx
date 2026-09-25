import { cn } from "@/lib/utils";

export function EmptyState({
  title,
  description,
  className,
}: {
  title: string;
  description: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center gap-2 rounded-xl border border-dashed border-border-subtle bg-surface-subtle/50 px-6 py-12",
        className,
      )}
    >
      <p className="text-sm font-semibold text-foreground">{title}</p>
      <p className="max-w-md text-sm leading-relaxed text-foreground-secondary">{description}</p>
    </div>
  );
}
