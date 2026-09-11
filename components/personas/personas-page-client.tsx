"use client";

import { useEffect, useState } from "react";
import { useProductContext } from "@/lib/product-context";
import { loadIcpAction } from "@/lib/icp/actions";
import { loadPersonasAction } from "@/lib/personas/actions";
import { PersonaList } from "./persona-list";
import type { IcpRow } from "@/lib/icp/types";
import type { PersonaRow } from "@/lib/personas/types";
import Link from "next/link";

type LoadState =
  | { status: "loading" }
  | { status: "no_icp" }
  | { status: "loaded"; icp: IcpRow; personas: PersonaRow[] }
  | { status: "error"; message: string };

export function PersonasPageClient() {
  const { productId, workspaceSlug, productSlug } = useProductContext();
  const [state, setState] = useState<LoadState>({ status: "loading" });

  useEffect(() => {
    let cancelled = false;

    async function fetchData() {
      // 1. Fetch active ICP
      const icpResult = await loadIcpAction(productId);
      if (cancelled) return;

      if (!icpResult.ok) {
        setState({ status: "error", message: icpResult.error.message });
        return;
      }

      const activeIcp = icpResult.data ?? null;
      if (!activeIcp) {
        setState({ status: "no_icp" });
        return;
      }

      // 2. Fetch personas for the ICP
      const personasResult = await loadPersonasAction(productId, activeIcp.id);
      if (cancelled) return;

      if (!personasResult.ok) {
        setState({ status: "error", message: personasResult.error.message });
        return;
      }

      setState({
        status: "loaded",
        icp: activeIcp,
        personas: personasResult.data,
      });
    }

    fetchData();

    return () => {
      cancelled = true;
    };
  }, [productId]);

  return (
    <div className="space-y-8">
      <div className="space-y-1">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          Personas
        </h1>
        <p className="max-w-2xl text-sm leading-relaxed text-muted">
          The specific roles and buyers within your target accounts. Map their goals, pain points, and decision criteria to align your messaging.
        </p>
      </div>

      {state.status === "loading" && (
        <p className="text-sm text-muted">Loading…</p>
      )}

      {state.status === "error" && (
        <div
          role="alert"
          className="border border-border bg-surface/40 px-5 py-6 text-sm text-foreground"
        >
          {state.message}
        </div>
      )}

      {state.status === "no_icp" && (
        <div className="flex flex-col items-center justify-center rounded-md border border-dashed border-border py-16 text-center">
          <p className="mb-4 text-sm text-foreground">
            You need to define an Ideal Customer Profile (ICP) before creating personas.
          </p>
          <Link
            href={`/w/${workspaceSlug}/${productSlug}/strategy/icp`}
            className="rounded-sm bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Go to ICP Builder
          </Link>
        </div>
      )}

      {state.status === "loaded" && (
        <PersonaList
          productId={productId}
          icpId={state.icp.id}
          personas={state.personas}
        />
      )}
    </div>
  );
}
