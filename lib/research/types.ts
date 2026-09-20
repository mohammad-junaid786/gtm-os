import { z } from "zod";

export interface ResearchItemRow {
  id: string;
  product_id: string;
  competitor_id: string | null;
  title: string;
  type: string;
  source_name: string | null;
  source_url: string | null;
  content: string | null;
  date_researched: string | null; // PostgreSQL date maps to 'YYYY-MM-DD' string in Drizzle
  archived_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

const websiteSchema = z
  .string()
  .url("Website must be a valid URL.")
  .refine(
    (url) => url.startsWith("http://") || url.startsWith("https://"),
    { message: "Website must use http or https." },
  )
  .nullable()
  .optional()
  .or(z.literal(""));

const optionalText = (maxLen: number) =>
  z.string().max(maxLen).nullable().optional();

// PostgreSQL date fields expect a YYYY-MM-DD string
const dateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Must be YYYY-MM-DD format.")
  .nullable()
  .optional()
  .or(z.literal(""));

export const researchTypes = ["interview", "article", "report", "competitor_analysis", "other"] as const;

export const createResearchSchema = z.object({
  productId: z.string().uuid(),
  competitorId: z.string().uuid().nullable().optional(),
  title: z.string().min(1, "Title is required.").max(255),
  type: z.enum(researchTypes, {
    errorMap: () => ({ message: "Invalid research type." }),
  }),
  source_name: optionalText(255),
  source_url: websiteSchema,
  content: optionalText(10000),
  date_researched: dateSchema,
});

export const updateResearchSchema = z.object({
  competitorId: z.string().uuid().nullable().optional(),
  title: z.string().min(1, "Title is required.").max(255).optional(),
  type: z.enum(researchTypes, {
    errorMap: () => ({ message: "Invalid research type." }),
  }).optional(),
  source_name: optionalText(255),
  source_url: websiteSchema,
  content: optionalText(10000),
  date_researched: dateSchema,
}).refine(
  (data) => Object.values(data).some((val) => val !== undefined),
  { message: "At least one field must be provided for update." },
);

export type CreateResearchInput = z.infer<typeof createResearchSchema>;
export type UpdateResearchInput = z.infer<typeof updateResearchSchema>;

export type ResearchServiceError =
  | { code: "UNAUTHORIZED"; message: string }
  | { code: "PRODUCT_ID_INVALID"; message: string }
  | { code: "RESEARCH_ITEM_ID_INVALID"; message: string }
  | { code: "COMPETITOR_ID_INVALID"; message: string }
  | { code: "COMPETITOR_NOT_FOUND"; message: string }
  | { code: "COMPETITOR_ARCHIVED"; message: string }
  | { code: "RESEARCH_ITEM_NOT_FOUND"; message: string }
  | { code: "RESEARCH_ITEM_ALREADY_ARCHIVED"; message: string }
  | { code: "WEBSITE_INVALID"; message: string }
  | { code: "NO_UPDATE_FIELDS"; message: string }
  | { code: "UNKNOWN"; message: string; cause?: unknown };

export type ResearchResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: ResearchServiceError };

export function fail(error: ResearchServiceError): { ok: false; error: ResearchServiceError } {
  return { ok: false, error };
}
