import { cn } from "@/lib/utils";

/**
 * PageHeader — Establishes consistent page hierarchy across the application.
 *
 * Usage:
 * <PageHeader
 *   eyebrow="STRATEGY"
 *   title="Ideal Customer Profile"
 *   description="Define the companies most likely to get value from your product."
 * />
 */
export function PageHeader({
  eyebrow,
  title,
  description,
  className,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  className?: string;
}) {
  return (
    <div className={cn("space-y-1.5", className)}>
      {eyebrow && (
        <p className="font-mono text-[10px] font-medium tracking-[0.12em] text-foreground-muted uppercase">
          {eyebrow}
        </p>
      )}
      <h1 className="font-display text-xl font-semibold tracking-tight text-foreground">
        {title}
      </h1>
      {description && (
        <p className="max-w-2xl text-sm leading-relaxed text-foreground-secondary">
          {description}
        </p>
      )}
    </div>
  );
}

/**
 * SectionHeader — Lightweight section heading inside a page.
 */
export function SectionHeader({
  title,
  description,
  className,
}: {
  title: string;
  description?: string;
  className?: string;
}) {
  return (
    <div className={cn("space-y-0.5", className)}>
      <h2 className="text-sm font-semibold text-foreground">{title}</h2>
      {description && (
        <p className="text-xs text-foreground-secondary">{description}</p>
      )}
    </div>
  );
}

/**
 * MetaLabel — Compact technical metadata label + value pair.
 * Uses DM Mono for the value text.
 *
 * Usage:
 * <MetaLabel label="TYPE" value="Interview" />
 */
export function MetaLabel({
  label,
  value,
  className,
}: {
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div className={cn("space-y-0.5", className)}>
      <p className="text-[9px] font-semibold tracking-[0.14em] uppercase text-foreground-muted">
        {label}
      </p>
      <p className="font-mono text-xs text-foreground">{value}</p>
    </div>
  );
}

/**
 * PageDivider — Subtle horizontal rule for separating page sections.
 */
export function PageDivider({ className }: { className?: string }) {
  return <hr className={cn("border-border", className)} />;
}
