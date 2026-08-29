import type { Metadata } from "next";
import { PagePlaceholder } from "@/components/page-placeholder";

export const metadata: Metadata = { title: "Campaigns" };

export default function CampaignsPage() {
  return (
    <PagePlaceholder
      title="Campaigns"
      description="Campaign planning and status will live here. This section is reserved for a later phase."
    />
  );
}
