import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";

export function PagePlaceholder({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="space-y-8">
      <PageHeader
        title={title}
        description={description}
      />
      <EmptyState
        title="Not available yet"
        description="This section is part of the application structure. Functionality will be added in a later phase."
      />
    </div>
  );
}
