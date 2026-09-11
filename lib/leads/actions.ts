"use server";

import { authorizeProductAction } from "@/lib/routing/authorize-action";
import {
  createLead,
  getLeadsForProduct,
  updateLead,
  archiveLead,
} from "./service";
import type { CreateLeadInput, LeadResult, LeadRow, UpdateLeadInput } from "./types";

export async function loadLeadsAction(
  productId: string,
): Promise<LeadResult<LeadRow[]>> {
  const auth = await authorizeProductAction(productId);
  if (!auth.ok) {
    return { ok: false, error: { code: "UNKNOWN", message: "Not authorized." } };
  }
  return getLeadsForProduct(auth.productId);
}

export async function createLeadAction(
  productId: string,
  input: CreateLeadInput,
): Promise<LeadResult<LeadRow>> {
  const auth = await authorizeProductAction(productId);
  if (!auth.ok) {
    return { ok: false, error: { code: "UNKNOWN", message: "Not authorized." } };
  }
  return createLead(auth.productId, input);
}

export async function updateLeadAction(
  productId: string,
  leadId: string,
  input: UpdateLeadInput,
): Promise<LeadResult<LeadRow>> {
  const auth = await authorizeProductAction(productId);
  if (!auth.ok) {
    return { ok: false, error: { code: "UNKNOWN", message: "Not authorized." } };
  }
  return updateLead(auth.productId, leadId, input);
}

export async function archiveLeadAction(
  productId: string,
  leadId: string,
): Promise<LeadResult<LeadRow>> {
  const auth = await authorizeProductAction(productId);
  if (!auth.ok) {
    return { ok: false, error: { code: "UNKNOWN", message: "Not authorized." } };
  }
  return archiveLead(auth.productId, leadId);
}
