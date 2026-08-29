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
        "flex flex-col items-start gap-2 border border-dashed border-border bg-surface/40 px-5 py-8",
        className,
      )}
    >
      <p className="text-sm font-medium text-foreground">{title}</p>
      <p className="max-w-lg text-sm leading-relaxed text-muted">{description}</p>
    </div>
  );
}
