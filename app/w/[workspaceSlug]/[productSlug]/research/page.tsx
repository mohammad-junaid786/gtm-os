import type { Metadata } from "next";
import { ResearchPageClient } from "@/components/research/research-page-client";

export const metadata: Metadata = { title: "Research Library" };

interface ResearchPageProps {
  params: Promise<{ workspaceSlug: string; productSlug: string }>;
}

export default async function ResearchPage({ params }: ResearchPageProps) {
  // Await params to follow Next.js 15+ async params convention.
  // productId is available to the client via useProductContext().
  await params;

  return <ResearchPageClient />;
}
