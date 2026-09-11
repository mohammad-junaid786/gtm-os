/**
 * Domain types for Experiments operations.
 * 
 * Budget is stored as integer cents.
 */

export const EXPERIMENT_STATUSES = ["Idea", "Planned", "Running", "Completed", "Archived"] as const;
export type ExperimentStatus = (typeof EXPERIMENT_STATUSES)[number];

export interface ExperimentRow {
  id: string;
  product_id: string;
  name: string;
  hypothesis: string | null;
  goal: string | null;
  audience: string | null;
  channel: string | null;
  variant: string | null;
  primary_metric: string | null;
  secondary_metrics: string[] | null;
  start_date: Date | null;
  end_date: Date | null;
  budget: number | null; // cents
  status: string;

  archived_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

export interface CreateExperimentInput {
  name: string;
  hypothesis?: string;
  goal?: string;
  audience?: string;
  channel?: string;
  variant?: string;
  primary_metric?: string;
  secondary_metrics?: string[];
  start_date?: Date;
  end_date?: Date;
  budget?: number; // cents
  status?: ExperimentStatus;
}

export interface UpdateExperimentInput {
  name?: string;
  hypothesis?: string | null;
  goal?: string | null;
  audience?: string | null;
  channel?: string | null;
  variant?: string | null;
  primary_metric?: string | null;
  secondary_metrics?: string[] | null;
  start_date?: Date | null;
  end_date?: Date | null;
  budget?: number | null; // cents
  status?: ExperimentStatus;
}

export type ExperimentResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: ExperimentServiceError };

export type ExperimentServiceError =
  | { code: "PRODUCT_ID_INVALID"; message: string }
  | { code: "EXPERIMENT_ID_INVALID"; message: string }
  | { code: "NAME_EMPTY"; message: string }
  | { code: "STATUS_INVALID"; message: string }
  | { code: "EXPERIMENT_NOT_FOUND"; message: string }
  | { code: "EXPERIMENT_ALREADY_ARCHIVED"; message: string }
  | { code: "NO_UPDATE_FIELDS"; message: string }
  | { code: "UNKNOWN"; message: string; cause?: unknown };
