"use client";

import { useEffect, useState } from "react";
import { loadLearningsAction } from "@/lib/learnings/actions";
import type { LearningRow } from "@/lib/learnings/types";
import { useProductContext } from "@/lib/product-context";
import { PageHeader } from "@/components/ui/page-header";
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
      <div className="flex h-32 items-center justify-center text-sm text-muted-foreground">
        Loading learnings...
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="INTELLIGENCE"
        title="Learnings"
        description="Document strategic insights, review past performance, and plan next steps."
      />

      <LearningList productId={productId} learnings={learnings} />
    </div>
  );
}
