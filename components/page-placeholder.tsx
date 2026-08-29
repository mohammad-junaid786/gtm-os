import { EmptyState } from "@/components/ui/empty-state";

export function PagePlaceholder({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">{title}</h1>
        <p className="max-w-2xl text-sm leading-relaxed text-muted">{description}</p>
      </div>
      <EmptyState
        title="Not available yet"
        description="This section is part of the application structure. Functionality will be added in a later phase."
      />
    </div>
  );
}
