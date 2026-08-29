import type { Metadata } from "next";
import { PagePlaceholder } from "@/components/page-placeholder";

export const metadata: Metadata = { title: "Signals" };

export default function SignalsPage() {
  return (
    <PagePlaceholder
      title="Signals"
      description="Market and account signals will live here. This section is reserved for a later phase."
    />
  );
}
