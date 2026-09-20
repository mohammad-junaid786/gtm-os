import type { Metadata } from "next";
import { CompetitorsPageClient } from "@/components/competitors/competitors-page-client";

export const metadata: Metadata = { title: "Competitors" };

interface CompetitorsPageProps {
  params: Promise<{ workspaceSlug: string; productSlug: string }>;
}

export default async function CompetitorsPage({ params }: CompetitorsPageProps) {
  await params;
  return <CompetitorsPageClient />;
}
