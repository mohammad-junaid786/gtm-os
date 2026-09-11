import type { Metadata } from "next";
import { LeadsPageClient } from "@/components/leads/leads-page-client";

export const metadata: Metadata = { title: "Leads" };

interface LeadsPageProps {
  params: Promise<{ workspaceSlug: string; productSlug: string }>;
}

export default async function LeadsPage({ params }: LeadsPageProps) {
  await params;
  return <LeadsPageClient />;
}
