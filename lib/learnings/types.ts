import { z } from "zod";

export const SOURCE_TYPES = ["campaign", "experiment", "lead", "research", "competitor", "analytics", "other"] as const;
export type SourceType = typeof SOURCE_TYPES[number];

export const CONFIDENCE_LEVELS = ["low", "medium", "high"] as const;
export type ConfidenceLevel = typeof CONFIDENCE_LEVELS[number];

export const IMPACT_LEVELS = ["low", "medium", "high"] as const;
export type ImpactLevel = typeof IMPACT_LEVELS[number];

export interface LearningRow {
  id: string;
  product_id: string;
  title: string;
  insight: string;
  source_type: string | null;
  source_id: string | null;
  confidence_level: string | null;
  impact_level: string | null;
  action_items: string[] | null;
  archived_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

export const createLearningSchema = z.object({
  title: z.string().min(1, "Title is required").max(255),
  insight: z.string().min(1, "Insight is required").max(5000),
  source_type: z.enum(SOURCE_TYPES).nullable().optional(),
  source_id: z.string().uuid("Invalid source ID").nullable().optional(),
  confidence_level: z.enum(CONFIDENCE_LEVELS).nullable().optional(),
  impact_level: z.enum(IMPACT_LEVELS).nullable().optional(),
  action_items: z.array(z.string().min(1)).nullable().optional(),
});

export type CreateLearningInput = z.infer<typeof createLearningSchema>;

export const updateLearningSchema = createLearningSchema.partial();

export type UpdateLearningInput = z.infer<typeof updateLearningSchema>;

export type LearningServiceError =
  | "PRODUCT_ID_INVALID"
  | "LEARNING_ID_INVALID"
  | "LEARNING_NOT_FOUND"
  | "LEARNING_ALREADY_ARCHIVED"
  | "NO_UPDATE_FIELDS"
  | "INVALID_INPUT"
  | "SOURCE_NOT_FOUND_IN_PRODUCT"
  | "UNKNOWN";

export type LearningResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: LearningServiceError };
