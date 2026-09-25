import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function StatCard({
  label,
  value,
  hint,
  className,
}: {
  label: string;
  value: string;
  hint?: string;
  className?: string;
}) {
  return (
    <Card className={cn("bg-surface shadow-sm rounded-xl border border-border-subtle", className)}>
      <CardHeader className="pb-2">
        <CardTitle className="text-xs font-semibold tracking-wider text-foreground-muted uppercase">
          {label}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="font-mono text-3xl font-medium tracking-tight text-foreground">{value}</p>
        {hint ? <p className="mt-1.5 text-xs text-foreground-secondary">{hint}</p> : null}
      </CardContent>
    </Card>
  );
}
