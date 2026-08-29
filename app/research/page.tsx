import type { Metadata } from "next";
import { PagePlaceholder } from "@/components/page-placeholder";

export const metadata: Metadata = { title: "Research" };

export default function ResearchPage() {
  return (
    <PagePlaceholder
      title="Research"
      description="Account and market research will live here. This section is reserved for a later phase."
    />
  );
}
