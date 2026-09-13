import type { Metadata } from "next";
import { LearningsPageClient } from "@/components/learnings/learnings-page-client";

export const metadata: Metadata = { title: "Learnings" };

export default async function LearningsPage({
  params,
}: {
  params: Promise<{ workspaceSlug: string; productSlug: string }>;
}) {
  await params;
  return <LearningsPageClient />;
}
