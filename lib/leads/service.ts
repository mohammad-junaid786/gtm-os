import "server-only";
import { and, eq, isNull } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/db";
import { leads } from "@/db/schema";
import { LEAD_STATUSES } from "./types";
import type { CreateLeadInput, LeadResult, LeadRow, UpdateLeadInput } from "./types";

// ---------------------------------------------------------------------------
// Schemas
// ---------------------------------------------------------------------------

const uuidSchema = z.string().uuid();

const createLeadSchema = z.object({
  company: z.string().trim().min(1),
  contact: z.string().trim().min(1),
  role: z.string().trim().optional(),
  email: z.string().trim().optional(),
  website: z.string().trim().optional(),
  source: z.string().trim().optional(),
  icp_score: z.number().int().optional(),
  status: z.enum(LEAD_STATUSES).default("New"),
  owner: z.string().trim().optional(),
  notes: z.string().trim().optional(),
});

const updateLeadSchema = z
  .object({
    company: z.string().trim().min(1).optional(),
    contact: z.string().trim().min(1).optional(),
    role: z.string().trim().optional(),
    email: z.string().trim().optional(),
    website: z.string().trim().optional(),
    source: z.string().trim().optional(),
    icp_score: z.number().int().nullable().optional(),
    status: z.enum(LEAD_STATUSES).optional(),
    owner: z.string().trim().optional(),
    notes: z.string().trim().optional(),
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

export async function createLead(
  productId: string,
  input: CreateLeadInput,
): Promise<LeadResult<LeadRow>> {
  if (!uuidSchema.safeParse(productId).success) {
    return err("PRODUCT_ID_INVALID", "Invalid product ID format");
  }

  const parsed = createLeadSchema.safeParse(input);
  if (!parsed.success) {
    const error = parsed.error.issues[0];
    if (error.path[0] === "company") return err("COMPANY_EMPTY", "Company name is required");
    if (error.path[0] === "contact") return err("CONTACT_EMPTY", "Contact name is required");
    if (error.path[0] === "status") return err("STATUS_INVALID", "Invalid status");
    return err("UNKNOWN", error.message);
  }

  const data = parsed.data;

  try {
    const db = getDb();

    const rows = await db
      .insert(leads)
      .values({
        product_id: productId,
        company: data.company,
        contact: data.contact,
        role: data.role,
        email: data.email,
        website: data.website,
        source: data.source,
        icp_score: data.icp_score,
        status: data.status,
        owner: data.owner,
        notes: data.notes,
      })
      .returning();

    return { ok: true, data: rows[0] };
  } catch {
    return err("UNKNOWN", "Failed to create lead.");
  }
}

export async function getLeadsForProduct(
  productId: string,
): Promise<LeadResult<LeadRow[]>> {
  if (!uuidSchema.safeParse(productId).success) {
    return err("PRODUCT_ID_INVALID", "Invalid product ID format");
  }

  try {
    const db = getDb();
    const rows = await db
      .select()
      .from(leads)
      .where(
        and(
          eq(leads.product_id, productId),
          isNull(leads.archived_at)
        )
      )
      .orderBy(leads.created_at);

    return { ok: true, data: rows };
  } catch {
    return err("UNKNOWN", "Failed to get leads.");
  }
}

export async function getLeadById(
  productId: string,
  leadId: string,
): Promise<LeadResult<LeadRow>> {
  if (!uuidSchema.safeParse(productId).success) {
    return err("PRODUCT_ID_INVALID", "Invalid product ID format");
  }
  if (!uuidSchema.safeParse(leadId).success) {
    return err("LEAD_ID_INVALID", "Invalid lead ID format");
  }

  try {
    const db = getDb();
    const rows = await db
      .select()
      .from(leads)
      .where(
        and(
          eq(leads.id, leadId),
          eq(leads.product_id, productId),
          isNull(leads.archived_at)
        )
      )
      .limit(1);

    if (rows.length === 0) {
      return err("LEAD_NOT_FOUND", "Lead not found or already archived.");
    }
    return { ok: true, data: rows[0] };
  } catch {
    return err("UNKNOWN", "Failed to get lead.");
  }
}

export async function updateLead(
  productId: string,
  leadId: string,
  input: UpdateLeadInput,
): Promise<LeadResult<LeadRow>> {
  if (!uuidSchema.safeParse(productId).success) {
    return err("PRODUCT_ID_INVALID", "Invalid product ID format");
  }
  if (!uuidSchema.safeParse(leadId).success) {
    return err("LEAD_ID_INVALID", "Invalid lead ID format");
  }

  const parsed = updateLeadSchema.safeParse(input);
  if (!parsed.success) {
    const error = parsed.error.issues[0];
    if (error.code === "custom") return err("NO_UPDATE_FIELDS", error.message);
    if (error.path[0] === "company") return err("COMPANY_EMPTY", "Company name is required");
    if (error.path[0] === "contact") return err("CONTACT_EMPTY", "Contact name is required");
    if (error.path[0] === "status") return err("STATUS_INVALID", "Invalid status");
    return err("UNKNOWN", error.message);
  }

  try {
    const db = getDb();
    const rows = await db
      .update(leads)
      .set({
        ...parsed.data,
        updated_at: new Date(),
      })
      .where(
        and(
          eq(leads.id, leadId),
          eq(leads.product_id, productId),
          isNull(leads.archived_at)
        )
      )
      .returning();

    if (rows.length === 0) {
      return err("LEAD_NOT_FOUND", "Lead not found or already archived.");
    }

    return { ok: true, data: rows[0] };
  } catch {
    return err("UNKNOWN", "Failed to update lead.");
  }
}

export async function archiveLead(
  productId: string,
  leadId: string,
): Promise<LeadResult<LeadRow>> {
  if (!uuidSchema.safeParse(productId).success) {
    return err("PRODUCT_ID_INVALID", "Invalid product ID format");
  }
  if (!uuidSchema.safeParse(leadId).success) {
    return err("LEAD_ID_INVALID", "Invalid lead ID format");
  }

  try {
    const db = getDb();

    const checkRows = await db
      .select({ archived_at: leads.archived_at })
      .from(leads)
      .where(and(eq(leads.id, leadId), eq(leads.product_id, productId)))
      .limit(1);

    if (checkRows.length === 0) {
      return err("LEAD_NOT_FOUND", "Lead not found.");
    }
    if (checkRows[0].archived_at !== null) {
      return err("LEAD_ALREADY_ARCHIVED", "Lead is already archived.");
    }

    const rows = await db
      .update(leads)
      .set({ archived_at: new Date(), updated_at: new Date() })
      .where(eq(leads.id, leadId))
      .returning();

    return { ok: true, data: rows[0] };
  } catch {
    return err("UNKNOWN", "Failed to archive lead.");
  }
}
