"use server";

import { authorizeProductAction } from "@/lib/routing/authorize-action";
import {
  createResearchItem,
  listResearchItemsForProduct,
  updateResearchItem,
  archiveResearchItem,
} from "./service";
import type {
  CreateResearchInput,
  UpdateResearchInput,
  ResearchResult,
  ResearchItemRow,
} from "./types";

export async function loadResearchItemsAction(
  clientProductId: string,
): Promise<ResearchResult<ResearchItemRow[]>> {
  const auth = await authorizeProductAction(clientProductId);
  if (!auth.ok) return auth.result;

  return listResearchItemsForProduct(auth.productId);
}

export async function createResearchItemAction(
  input: CreateResearchInput,
): Promise<ResearchResult<ResearchItemRow>> {
  const auth = await authorizeProductAction(input.productId);
  if (!auth.ok) return auth.result;

  return createResearchItem({ ...input, productId: auth.productId });
}

export async function updateResearchItemAction(
  clientProductId: string,
  researchItemId: string,
  input: UpdateResearchInput,
): Promise<ResearchResult<ResearchItemRow>> {
  const auth = await authorizeProductAction(clientProductId);
  if (!auth.ok) return auth.result;

  return updateResearchItem(auth.productId, researchItemId, input);
}

export async function archiveResearchItemAction(
  clientProductId: string,
  researchItemId: string,
): Promise<ResearchResult<ResearchItemRow>> {
  const auth = await authorizeProductAction(clientProductId);
  if (!auth.ok) return auth.result;

  return archiveResearchItem(auth.productId, researchItemId);
}
