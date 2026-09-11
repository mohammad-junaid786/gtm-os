"use server";

import { authorizeProductAction } from "@/lib/routing/authorize-action";
import {
  createCampaign,
  getCampaignsForProduct,
  updateCampaign,
  archiveCampaign,
} from "./service";
import type { CreateCampaignInput, CampaignResult, CampaignRow, UpdateCampaignInput } from "./types";

export async function loadCampaignsAction(
  productId: string,
): Promise<CampaignResult<CampaignRow[]>> {
  const auth = await authorizeProductAction(productId);
  if (!auth.ok) {
    return { ok: false, error: { code: "UNKNOWN", message: "Not authorized." } };
  }
  return getCampaignsForProduct(auth.productId);
}

export async function createCampaignAction(
  productId: string,
  input: CreateCampaignInput,
): Promise<CampaignResult<CampaignRow>> {
  const auth = await authorizeProductAction(productId);
  if (!auth.ok) {
    return { ok: false, error: { code: "UNKNOWN", message: "Not authorized." } };
  }
  return createCampaign(auth.productId, input);
}

export async function updateCampaignAction(
  productId: string,
  campaignId: string,
  input: UpdateCampaignInput,
): Promise<CampaignResult<CampaignRow>> {
  const auth = await authorizeProductAction(productId);
  if (!auth.ok) {
    return { ok: false, error: { code: "UNKNOWN", message: "Not authorized." } };
  }
  return updateCampaign(auth.productId, campaignId, input);
}

export async function archiveCampaignAction(
  productId: string,
  campaignId: string,
): Promise<CampaignResult<CampaignRow>> {
  const auth = await authorizeProductAction(productId);
  if (!auth.ok) {
    return { ok: false, error: { code: "UNKNOWN", message: "Not authorized." } };
  }
  return archiveCampaign(auth.productId, campaignId);
}
