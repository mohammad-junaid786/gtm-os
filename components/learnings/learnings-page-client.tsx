"use client";

import { useEffect, useState } from "react";
import { loadLearningsAction } from "@/lib/learnings/actions";
import type { LearningRow } from "@/lib/learnings/types";
import { useProductContext } from "@/lib/product-context";
import { LearningList } from "./learning-list";

export function LearningsPageClient() {
  const { productId } = useProductContext();
  const [learnings, setLearnings] = useState<LearningRow[] | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    loadLearningsAction(productId).then((result) => {
      if (!active) return;
      if (result.ok) {
        setLearnings(result.data);
      } else {
        setErrorMsg(result.error);
      }
    });
    return () => {
      active = false;
    };
  }, [productId]);

  if (errorMsg) {
    return (
      <div className="rounded-md border border-red-500/20 bg-red-500/10 p-6 text-center text-sm text-red-600">
        Error loading learnings: {errorMsg}
      </div>
    );
  }

  if (learnings === null) {
    return (
      <div className="flex h-32 items-center justify-center text-sm text-muted">
        Loading learnings...
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-foreground">Learnings</h1>
        <p className="mt-1 text-sm text-muted">
          Document strategic insights, review past performance, and plan next steps.
        </p>
      </div>

      <LearningList productId={productId} learnings={learnings} />
    </div>
  );
}
