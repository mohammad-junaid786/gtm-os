import type { Metadata } from "next";
import { ExperimentsPageClient } from "@/components/experiments/experiments-page-client";

export const metadata: Metadata = { title: "Experiments" };

interface ExperimentsPageProps {
  params: Promise<{ workspaceSlug: string; productSlug: string }>;
}

export default async function ExperimentsPage({ params }: ExperimentsPageProps) {
  await params;
  return <ExperimentsPageClient />;
}
