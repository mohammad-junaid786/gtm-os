/**
 * Domain types for Leads operations.
 */

export const LEAD_STATUSES = [
  "New",
  "Contacted",
  "Engaged",
  "Qualified",
  "Opportunity",
  "Won",
  "Lost",
] as const;

export type LeadStatus = (typeof LEAD_STATUSES)[number];

export interface LeadRow {
  id: string;
  product_id: string;
  company: string;
  contact: string;
  role: string | null;
  email: string | null;
  website: string | null;
  source: string | null;
  icp_score: number | null;
  status: string;
  owner: string | null;
  notes: string | null;
  archived_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

export interface CreateLeadInput {
  company: string;
  contact: string;
  role?: string;
  email?: string;
  website?: string;
  source?: string;
  icp_score?: number;
  status?: LeadStatus;
  owner?: string;
  notes?: string;
}

export interface UpdateLeadInput {
  company?: string;
  contact?: string;
  role?: string;
  email?: string;
  website?: string;
  source?: string;
  icp_score?: number | null;
  status?: LeadStatus;
  owner?: string;
  notes?: string;
}

export type LeadResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: LeadServiceError };

export type LeadServiceError =
  | { code: "PRODUCT_ID_INVALID"; message: string }
  | { code: "LEAD_ID_INVALID"; message: string }
  | { code: "COMPANY_EMPTY"; message: string }
  | { code: "CONTACT_EMPTY"; message: string }
  | { code: "STATUS_INVALID"; message: string }
  | { code: "LEAD_NOT_FOUND"; message: string }
  | { code: "LEAD_ALREADY_ARCHIVED"; message: string }
  | { code: "NO_UPDATE_FIELDS"; message: string }
  | { code: "UNKNOWN"; message: string; cause?: unknown };
