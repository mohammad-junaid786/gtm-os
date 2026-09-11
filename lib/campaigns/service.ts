import "server-only";
import { and, eq, isNull } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/db";
import { campaigns } from "@/db/schema";
import { CAMPAIGN_STATUSES } from "./types";
import type { CreateCampaignInput, CampaignResult, CampaignRow, UpdateCampaignInput } from "./types";

// ---------------------------------------------------------------------------
// Schemas
// ---------------------------------------------------------------------------

const uuidSchema = z.string().uuid();

const createCampaignSchema = z.object({
  name: z.string().trim().min(1),
  objective: z.string().trim().optional(),
  audience: z.string().trim().optional(),
  channel: z.string().trim().optional(),
  start_date: z.date().optional(),
  end_date: z.date().optional(),
  budget: z.number().int().optional(),
  status: z.enum(CAMPAIGN_STATUSES).default("Planned"),
});

const updateCampaignSchema = z
  .object({
    name: z.string().trim().min(1).optional(),
    objective: z.string().trim().nullable().optional(),
    audience: z.string().trim().nullable().optional(),
    channel: z.string().trim().nullable().optional(),
    start_date: z.date().nullable().optional(),
    end_date: z.date().nullable().optional(),
    budget: z.number().int().nullable().optional(),
    status: z.enum(CAMPAIGN_STATUSES).optional(),
    impressions: z.number().int().min(0).optional(),
    clicks: z.number().int().min(0).optional(),
    leads_generated: z.number().int().min(0).optional(),
    qualified_leads: z.number().int().min(0).optional(),
    conversions: z.number().int().min(0).optional(),
    revenue: z.number().int().min(0).optional(),
    spend: z.number().int().min(0).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided for update",
  });

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function err<T extends string>(code: T, message: string): { ok: false; error: { code: T; message: string; cause?: unknown } } {
  return { ok: false, error: { code, message } };
}

// ---------------------------------------------------------------------------
// Service operations
// ---------------------------------------------------------------------------

export async function createCampaign(
  productId: string,
  input: CreateCampaignInput,
): Promise<CampaignResult<CampaignRow>> {
  if (!uuidSchema.safeParse(productId).success) {
    return err("PRODUCT_ID_INVALID", "Invalid product ID format");
  }

  const parsed = createCampaignSchema.safeParse(input);
  if (!parsed.success) {
    const error = parsed.error.issues[0];
    if (error.path[0] === "name") return err("NAME_EMPTY", "Campaign name is required");
    if (error.path[0] === "status") return err("STATUS_INVALID", "Invalid status");
    return err("UNKNOWN", error.message);
  }

  const data = parsed.data;

  try {
    const db = getDb();

    const rows = await db
      .insert(campaigns)
      .values({
        product_id: productId,
        name: data.name,
        objective: data.objective,
        audience: data.audience,
        channel: data.channel,
        start_date: data.start_date,
        end_date: data.end_date,
        budget: data.budget,
        status: data.status,
      })
      .returning();

    return { ok: true, data: rows[0] };
  } catch {
    return err("UNKNOWN", "Failed to create campaign.");
  }
}

export async function getCampaignsForProduct(
  productId: string,
): Promise<CampaignResult<CampaignRow[]>> {
  if (!uuidSchema.safeParse(productId).success) {
    return err("PRODUCT_ID_INVALID", "Invalid product ID format");
  }

  try {
    const db = getDb();
    const rows = await db
      .select()
      .from(campaigns)
      .where(
        and(
          eq(campaigns.product_id, productId),
          isNull(campaigns.archived_at)
        )
      )
      .orderBy(campaigns.created_at);

    return { ok: true, data: rows };
  } catch {
    return err("UNKNOWN", "Failed to get campaigns.");
  }
}

export async function getCampaignById(
  productId: string,
  campaignId: string,
): Promise<CampaignResult<CampaignRow>> {
  if (!uuidSchema.safeParse(productId).success) {
    return err("PRODUCT_ID_INVALID", "Invalid product ID format");
  }
  if (!uuidSchema.safeParse(campaignId).success) {
    return err("CAMPAIGN_ID_INVALID", "Invalid campaign ID format");
  }

  try {
    const db = getDb();
    const rows = await db
      .select()
      .from(campaigns)
      .where(
        and(
          eq(campaigns.id, campaignId),
          eq(campaigns.product_id, productId),
          isNull(campaigns.archived_at)
        )
      )
      .limit(1);

    if (rows.length === 0) {
      return err("CAMPAIGN_NOT_FOUND", "Campaign not found or already archived.");
    }
    return { ok: true, data: rows[0] };
  } catch {
    return err("UNKNOWN", "Failed to get campaign.");
  }
}

export async function updateCampaign(
  productId: string,
  campaignId: string,
  input: UpdateCampaignInput,
): Promise<CampaignResult<CampaignRow>> {
  if (!uuidSchema.safeParse(productId).success) {
    return err("PRODUCT_ID_INVALID", "Invalid product ID format");
  }
  if (!uuidSchema.safeParse(campaignId).success) {
    return err("CAMPAIGN_ID_INVALID", "Invalid campaign ID format");
  }

  const parsed = updateCampaignSchema.safeParse(input);
  if (!parsed.success) {
    const error = parsed.error.issues[0];
    if (error.code === "custom") return err("NO_UPDATE_FIELDS", error.message);
    if (error.path[0] === "name") return err("NAME_EMPTY", "Campaign name is required");
    if (error.path[0] === "status") return err("STATUS_INVALID", "Invalid status");
    return err("UNKNOWN", error.message);
  }

  try {
    const db = getDb();
    const rows = await db
      .update(campaigns)
      .set({
        ...parsed.data,
        updated_at: new Date(),
      })
      .where(
        and(
          eq(campaigns.id, campaignId),
          eq(campaigns.product_id, productId),
          isNull(campaigns.archived_at)
        )
      )
      .returning();

    if (rows.length === 0) {
      return err("CAMPAIGN_NOT_FOUND", "Campaign not found or already archived.");
    }

    return { ok: true, data: rows[0] };
  } catch {
    return err("UNKNOWN", "Failed to update campaign.");
  }
}

export async function archiveCampaign(
  productId: string,
  campaignId: string,
): Promise<CampaignResult<CampaignRow>> {
  if (!uuidSchema.safeParse(productId).success) {
    return err("PRODUCT_ID_INVALID", "Invalid product ID format");
  }
  if (!uuidSchema.safeParse(campaignId).success) {
    return err("CAMPAIGN_ID_INVALID", "Invalid campaign ID format");
  }

  try {
    const db = getDb();

    const checkRows = await db
      .select({ archived_at: campaigns.archived_at })
      .from(campaigns)
      .where(and(eq(campaigns.id, campaignId), eq(campaigns.product_id, productId)))
      .limit(1);

    if (checkRows.length === 0) {
      return err("CAMPAIGN_NOT_FOUND", "Campaign not found.");
    }
    if (checkRows[0].archived_at !== null) {
      return err("CAMPAIGN_ALREADY_ARCHIVED", "Campaign is already archived.");
    }

    const rows = await db
      .update(campaigns)
      .set({ archived_at: new Date(), updated_at: new Date() })
      .where(eq(campaigns.id, campaignId))
      .returning();

    return { ok: true, data: rows[0] };
  } catch {
    return err("UNKNOWN", "Failed to archive campaign.");
  }
}
