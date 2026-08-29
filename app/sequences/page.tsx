import type { Metadata } from "next";
import { PagePlaceholder } from "@/components/page-placeholder";

export const metadata: Metadata = { title: "Sequences" };

export default function SequencesPage() {
  return (
    <PagePlaceholder
      title="Sequences"
      description="Multi-step outreach sequences will live here. This section is reserved for a later phase."
    />
  );
}
