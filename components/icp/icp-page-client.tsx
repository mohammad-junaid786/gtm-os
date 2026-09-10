"use client";

/**
 * IcpPageClient — client shell for the ICP page.
 *
 * Reads the resolved productId from ProductContextProvider, fetches the
 * active ICP via a server action, and renders either IcpView (if an ICP
 * exists) or IcpEmpty (if not).
 *
 * Server/client boundary:
 *   - productId is obtained from useProductContext() — already resolved
 *     server-side by the product layout and passed as a serializable value.
 *   - ICP data is fetched via loadIcpAction() — a server action that calls
 *     getIcpsForProduct() on the server. No DB access in this component.
 *   - Mutations go through createIcpAction / updateIcpAction in IcpForm.
 */
import { useEffect, useState } from "react";
import { useProductContext } from "@/lib/product-context";
import { IcpView, IcpEmpty } from "@/components/icp/icp-view";
import { loadIcpAction } from "@/lib/icp/actions";
import type { IcpRow } from "@/lib/icp/types";

type LoadState =
  | { status: "loading" }
  | { status: "empty" }
  | { status: "loaded"; icp: IcpRow }
  | { status: "error"; message: string };

export function IcpPageClient() {
  const { productId, productName } = useProductContext();
  const [state, setState] = useState<LoadState>({ status: "loading" });

  useEffect(() => {
    let cancelled = false;
    loadIcpAction(productId).then((result) => {
      if (cancelled) return;
      if (!result.ok) {
        setState({ status: "error", message: result.error.message });
        return;
      }
      const activeIcp = result.data ?? null;
      setState(
        activeIcp !== null
          ? { status: "loaded", icp: activeIcp }
          : { status: "empty" },
      );
    });
    return () => { cancelled = true; };
  }, [productId]);

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div className="space-y-1">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          Ideal Customer Profile
        </h1>
        <p className="max-w-2xl text-sm leading-relaxed text-muted">
          The type of company that gets the most value from{" "}
          <span className="font-medium text-foreground">{productName}</span> and is most
          likely to buy. A clear ICP aligns positioning, messaging, and targeting.
        </p>
      </div>

      {/* ICP content */}
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

      {state.status === "empty" && (
        <IcpEmpty
          productId={productId}
          onCreated={(icp) => setState({ status: "loaded", icp })}
        />
      )}

      {state.status === "loaded" && (
        <IcpView
          icp={state.icp}
          productId={productId}
        />
      )}
    </div>
  );
}
