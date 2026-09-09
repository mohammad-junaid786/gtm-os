"use client";

/**
 * ProductContextConsumer — thin client bridge for the product overview page.
 *
 * Reads the resolved workspace/product context from ProductContextProvider
 * and forwards the display values to OverviewDashboard. This is a client
 * component so it can call useProductContext() — no DB access occurs here.
 */
import { useProductContext } from "@/lib/product-context";
import { OverviewDashboard } from "@/components/overview-dashboard";

export function ProductContextConsumer() {
  const { workspaceName, productName } = useProductContext();
  return <OverviewDashboard workspaceName={workspaceName} productName={productName} />;
}
