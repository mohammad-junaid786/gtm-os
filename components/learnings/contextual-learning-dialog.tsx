"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { LearningForm } from "./learning-form";
import type { LearningRow } from "@/lib/learnings/types";

export interface ContextualLearningDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productId: string;
  sourceType: string;
  sourceId?: string | null;
  sourceDisplayName: string;
  sourceContext?: string;
  onSuccess: (learning: LearningRow) => void;
}

export function ContextualLearningDialog({
  open,
  onOpenChange,
  productId,
  sourceType,
  sourceId,
  sourceDisplayName,
  sourceContext,
  onSuccess,
}: ContextualLearningDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Log Learning</DialogTitle>
          <DialogDescription>
            Capture an insight and define next steps based on this {sourceType}.
          </DialogDescription>
        </DialogHeader>
        
        <div className="mt-4">
          <LearningForm
            key={sourceId ?? sourceType}
            productId={productId}
            prefilledSourceType={sourceType}
            prefilledSourceId={sourceId}
            sourceDisplayName={sourceDisplayName}
            sourceContext={sourceContext}
            onSuccess={(learning) => {
              onSuccess(learning);
              onOpenChange(false);
            }}
            onCancel={() => onOpenChange(false)}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
