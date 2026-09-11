import "server-only";
import { and, eq, isNull } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/db";
import { icps, personas } from "@/db/schema";
import type {
  CreatePersonaInput,
  PersonaResult,
  PersonaRow,
  UpdatePersonaInput,
} from "./types";

// ---------------------------------------------------------------------------
// Schemas
// ---------------------------------------------------------------------------

const uuidSchema = z.string().uuid();

const createPersonaSchema = z.object({
  icpId: uuidSchema,
  name: z.string().trim().min(1),
  role: z.string().trim().min(1),
  goals: z.array(z.string().trim().min(1)).optional(),
  pain_points: z.array(z.string().trim().min(1)).optional(),
  motivations: z.array(z.string().trim().min(1)).optional(),
  objections: z.array(z.string().trim().min(1)).optional(),
  decision_criteria: z.array(z.string().trim().min(1)).optional(),
  preferred_channels: z.array(z.string().trim().min(1)).optional(),
  messaging_angles: z.array(z.string().trim().min(1)).optional(),
});

const updatePersonaSchema = z
  .object({
    name: z.string().trim().min(1).optional(),
    role: z.string().trim().min(1).optional(),
    goals: z.array(z.string().trim().min(1)).optional(),
    pain_points: z.array(z.string().trim().min(1)).optional(),
    motivations: z.array(z.string().trim().min(1)).optional(),
    objections: z.array(z.string().trim().min(1)).optional(),
    decision_criteria: z.array(z.string().trim().min(1)).optional(),
    preferred_channels: z.array(z.string().trim().min(1)).optional(),
    messaging_angles: z.array(z.string().trim().min(1)).optional(),
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

/**
 * Ensures the given icpId belongs to the given productId AND is not archived.
 * This guarantees product-scoping for Persona operations.
 */
async function verifyActiveIcpForProduct(productId: string, icpId: string): Promise<boolean> {
  const db = getDb();
  const rows = await db
    .select({ id: icps.id })
    .from(icps)
    .where(
      and(
        eq(icps.id, icpId),
        eq(icps.product_id, productId),
        isNull(icps.archived_at)
      )
    )
    .limit(1);
  return rows.length > 0;
}

// ---------------------------------------------------------------------------
// Service operations
// ---------------------------------------------------------------------------

export async function createPersona(
  productId: string,
  input: CreatePersonaInput,
): Promise<PersonaResult<PersonaRow>> {
  if (!uuidSchema.safeParse(productId).success) {
    return err("PRODUCT_ID_INVALID", "Invalid product ID format");
  }

  const parsed = createPersonaSchema.safeParse(input);
  if (!parsed.success) {
    const error = parsed.error.issues[0];
    if (error.path[0] === "icpId") return err("ICP_ID_INVALID", "Invalid ICP ID format");
    if (error.path[0] === "name") return err("NAME_EMPTY", "Persona name is required");
    if (error.path[0] === "role") return err("ROLE_EMPTY", "Persona role is required");
    return err("UNKNOWN", error.message);
  }

  const data = parsed.data;

  try {
    const db = getDb();

    // 1. Verify ICP belongs to this product and is active
    const isIcpValid = await verifyActiveIcpForProduct(productId, data.icpId);
    if (!isIcpValid) {
      return err(
        "ICP_NOT_FOUND_OR_ARCHIVED",
        "The specified ICP does not exist for this product or is archived.",
      );
    }

    // 2. Insert Persona
    const rows = await db
      .insert(personas)
      .values({
        icp_id: data.icpId,
        name: data.name,
        role: data.role,
        goals: data.goals ?? null,
        pain_points: data.pain_points ?? null,
        motivations: data.motivations ?? null,
        objections: data.objections ?? null,
        decision_criteria: data.decision_criteria ?? null,
        preferred_channels: data.preferred_channels ?? null,
        messaging_angles: data.messaging_angles ?? null,
      })
      .returning();

    return { ok: true, data: rows[0] };
  } catch (e) {
    return {
      ok: false,
      error: { code: "UNKNOWN", message: "Failed to create persona.", cause: e },
    };
  }
}

export async function getPersonasForIcp(
  productId: string,
  icpId: string,
): Promise<PersonaResult<PersonaRow[]>> {
  if (!uuidSchema.safeParse(productId).success) {
    return err("PRODUCT_ID_INVALID", "Invalid product ID format");
  }
  if (!uuidSchema.safeParse(icpId).success) {
    return err("ICP_ID_INVALID", "Invalid ICP ID format");
  }

  try {
    const db = getDb();

    // The innerJoin guarantees we only return personas for the specified icpId
    // AND that the icpId actually belongs to the given productId.
    const rows = await db
      .select({
        id: personas.id,
        icp_id: personas.icp_id,
        name: personas.name,
        role: personas.role,
        goals: personas.goals,
        pain_points: personas.pain_points,
        motivations: personas.motivations,
        objections: personas.objections,
        decision_criteria: personas.decision_criteria,
        preferred_channels: personas.preferred_channels,
        messaging_angles: personas.messaging_angles,
        archived_at: personas.archived_at,
        created_at: personas.created_at,
        updated_at: personas.updated_at,
      })
      .from(personas)
      .innerJoin(
        icps,
        and(
          eq(icps.id, personas.icp_id),
          eq(icps.product_id, productId)
        )
      )
      .where(
        and(
          eq(personas.icp_id, icpId),
          isNull(personas.archived_at)
        )
      )
      .orderBy(personas.created_at);

    return { ok: true, data: rows };
  } catch (e) {
    return {
      ok: false,
      error: { code: "UNKNOWN", message: "Failed to get personas.", cause: e },
    };
  }
}

export async function updatePersona(
  productId: string,
  icpId: string,
  personaId: string,
  input: UpdatePersonaInput,
): Promise<PersonaResult<PersonaRow>> {
  if (!uuidSchema.safeParse(productId).success) {
    return err("PRODUCT_ID_INVALID", "Invalid product ID format");
  }
  if (!uuidSchema.safeParse(icpId).success) {
    return err("ICP_ID_INVALID", "Invalid ICP ID format");
  }
  if (!uuidSchema.safeParse(personaId).success) {
    return err("PERSONA_ID_INVALID", "Invalid persona ID format");
  }

  const parsed = updatePersonaSchema.safeParse(input);
  if (!parsed.success) {
    const error = parsed.error.issues[0];
    if (error.code === "custom") return err("NO_UPDATE_FIELDS", error.message);
    if (error.path[0] === "name") return err("NAME_EMPTY", "Persona name is required");
    if (error.path[0] === "role") return err("ROLE_EMPTY", "Persona role is required");
    return err("UNKNOWN", error.message);
  }

  const data = parsed.data;

  try {
    const db = getDb();

    // Verify ICP belongs to this product and is active
    const isIcpValid = await verifyActiveIcpForProduct(productId, icpId);
    if (!isIcpValid) {
      return err(
        "ICP_NOT_FOUND_OR_ARCHIVED",
        "The specified ICP does not exist for this product or is archived.",
      );
    }

    const rows = await db
      .update(personas)
      .set({
        name: data.name,
        role: data.role,
        goals: data.goals,
        pain_points: data.pain_points,
        motivations: data.motivations,
        objections: data.objections,
        decision_criteria: data.decision_criteria,
        preferred_channels: data.preferred_channels,
        messaging_angles: data.messaging_angles,
        updated_at: new Date(),
      })
      .where(
        and(
          eq(personas.id, personaId),
          eq(personas.icp_id, icpId),
          isNull(personas.archived_at)
        )
      )
      .returning();

    if (rows.length === 0) {
      return err("PERSONA_NOT_FOUND", "Persona not found or already archived.");
    }

    return { ok: true, data: rows[0] };
  } catch (e) {
    return {
      ok: false,
      error: { code: "UNKNOWN", message: "Failed to update persona.", cause: e },
    };
  }
}

export async function archivePersona(
  productId: string,
  icpId: string,
  personaId: string,
): Promise<PersonaResult<PersonaRow>> {
  if (!uuidSchema.safeParse(productId).success) {
    return err("PRODUCT_ID_INVALID", "Invalid product ID format");
  }
  if (!uuidSchema.safeParse(icpId).success) {
    return err("ICP_ID_INVALID", "Invalid ICP ID format");
  }
  if (!uuidSchema.safeParse(personaId).success) {
    return err("PERSONA_ID_INVALID", "Invalid persona ID format");
  }

  try {
    const db = getDb();

    // Verify ICP belongs to this product and is active
    const isIcpValid = await verifyActiveIcpForProduct(productId, icpId);
    if (!isIcpValid) {
      return err(
        "ICP_NOT_FOUND_OR_ARCHIVED",
        "The specified ICP does not exist for this product or is archived.",
      );
    }

    const checkRows = await db
      .select({ archived_at: personas.archived_at })
      .from(personas)
      .where(and(eq(personas.id, personaId), eq(personas.icp_id, icpId)))
      .limit(1);

    if (checkRows.length === 0) {
      return err("PERSONA_NOT_FOUND", "Persona not found.");
    }

    if (checkRows[0].archived_at !== null) {
      return err("PERSONA_ALREADY_ARCHIVED", "Persona is already archived.");
    }

    const rows = await db
      .update(personas)
      .set({ archived_at: new Date(), updated_at: new Date() })
      .where(eq(personas.id, personaId))
      .returning();

    return { ok: true, data: rows[0] };
  } catch (e) {
    return {
      ok: false,
      error: { code: "UNKNOWN", message: "Failed to archive persona.", cause: e },
    };
  }
}
