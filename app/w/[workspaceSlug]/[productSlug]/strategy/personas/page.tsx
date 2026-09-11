import type { Metadata } from "next";
import { PersonasPageClient } from "@/components/personas/personas-page-client";

export const metadata: Metadata = { title: "Personas" };

interface PersonasPageProps {
  params: Promise<{ workspaceSlug: string; productSlug: string }>;
}

export default async function PersonasPage({ params }: PersonasPageProps) {
  // params is needed to satisfy Next.js route convention; the product context
  // (including productId) is provided by the layout via ProductContextProvider.
  // We await params to follow Next.js 15+ async params convention.
  await params;

  return <PersonasPageClient />;
}
