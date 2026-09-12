import type { Metadata } from "next";
import { AnalyticsPageClient } from "@/components/analytics/analytics-page-client";

export const metadata: Metadata = {
  title: "Analytics | GTM OS",
  description: "Performance metrics for your go-to-market execution.",
};

export default function AnalyticsPage() {
  return <AnalyticsPageClient />;
}
