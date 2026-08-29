import type { Metadata } from "next";
import { PagePlaceholder } from "@/components/page-placeholder";

export const metadata: Metadata = { title: "ICP" };

export default function IcpPage() {
  return (
    <PagePlaceholder
      title="ICP"
      description="Ideal customer profile definitions will live here. This section is reserved for a later phase."
    />
  );
}
