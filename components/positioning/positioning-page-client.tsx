"use client";

/**
 * PositioningPageClient — client shell for the Positioning page.
 *
 * Reads the resolved productId from ProductContextProvider, fetches the
 * active positioning via a server action, and renders either PositioningView
 * (if a positioning record exists) or PositioningEmpty (if not).
 *
 * Server/client boundary:
 *   - productId is obtained from useProductContext() — already resolved
 *     server-side by the product layout and passed as a serializable value.
 *   - Positioning data is fetched via loadPositioningAction() — a server action
 *     that calls getPositioningForProduct() on the server. No DB access here.
 *   - Mutations go through createPositioningAction / updatePositioningAction
 *     in PositioningForm.
 */
import { useEffect, useState } from "react";
import { useProductContext } from "@/lib/product-context";
import { PositioningView, PositioningEmpty } from "@/components/positioning/positioning-view";
import { loadPositioningAction } from "@/lib/positioning/actions";
import type { PositioningRow } from "@/lib/positioning/types";

type LoadState =
  | { status: "loading" }
  | { status: "empty" }
  | { status: "loaded"; positioning: PositioningRow }
  | { status: "error"; message: string };

export function PositioningPageClient() {
  const { productId, productName } = useProductContext();
  const [state, setState] = useState<LoadState>({ status: "loading" });

  useEffect(() => {
    let cancelled = false;
    loadPositioningAction(productId).then((result) => {
      if (cancelled) return;
      if (!result.ok) {
        setState({ status: "error", message: result.error.message });
        return;
      }
      const activePositioning = result.data ?? null;
      setState(
        activePositioning !== null
          ? { status: "loaded", positioning: activePositioning }
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
          Positioning
        </h1>
        <p className="max-w-2xl text-sm leading-relaxed text-muted">
          How{" "}
          <span className="font-medium text-foreground">{productName}</span>{" "}
          is uniquely placed in the market — who it is for, what problem it
          solves, and why it is the best choice over alternatives.
        </p>
      </div>

      {/* Positioning content */}
      {state.status === "loading" && (
        <p className="text-sm text-muted">Loading...</p>
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
        <PositioningEmpty
          productId={productId}
          onCreated={(pos) => setState({ status: "loaded", positioning: pos })}
        />
      )}

      {state.status === "loaded" && (
        <PositioningView
          positioning={state.positioning}
          productId={productId}
        />
      )}
    </div>
  );
}