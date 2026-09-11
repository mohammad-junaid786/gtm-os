"use client";

import { useEffect, useState } from "react";
import { useProductContext } from "@/lib/product-context";
import { loadExperimentsAction } from "@/lib/experiments/actions";
import { ExperimentList } from "./experiment-list";
import type { ExperimentRow } from "@/lib/experiments/types";

type LoadState =
  | { status: "loading" }
  | { status: "loaded"; experiments: ExperimentRow[] }
  | { status: "error"; message: string };

export function ExperimentsPageClient() {
  const { productId } = useProductContext();
  const [state, setState] = useState<LoadState>({ status: "loading" });

  useEffect(() => {
    let cancelled = false;
    loadExperimentsAction(productId).then((res) => {
      if (cancelled) return;
      if (!res.ok) setState({ status: "error", message: res.error.message });
      else setState({ status: "loaded", experiments: res.data });
    });
    return () => { cancelled = true; };
  }, [productId]);

  return (
    <div className="space-y-8">
      <div className="space-y-1">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">Experiments</h1>
        <p className="max-w-2xl text-sm leading-relaxed text-muted">
          Design, run, and track go-to-market experiments and hypotheses.
        </p>
      </div>

      {state.status === "loading" && <p className="text-sm text-muted">Loading…</p>}
      {state.status === "error" && (
        <div role="alert" className="border border-border bg-surface/40 px-5 py-6 text-sm text-foreground">
          {state.message}
        </div>
      )}
      {state.status === "loaded" && <ExperimentList productId={productId} experiments={state.experiments} />}
    </div>
  );
}
