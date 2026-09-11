import type { Metadata } from "next";
import { CampaignsPageClient } from "@/components/campaigns/campaigns-page-client";

export const metadata: Metadata = { title: "Campaigns" };

interface CampaignsPageProps {
  params: Promise<{ workspaceSlug: string; productSlug: string }>;
}

export default async function CampaignsPage({ params }: CampaignsPageProps) {
  await params;
  return <CampaignsPageClient />;
}
