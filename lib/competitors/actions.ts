"use server";

import { authorizeProductAction } from "@/lib/routing/authorize-action";
import {
  createCompetitor,
  listCompetitorsForProduct,
  updateCompetitor,
  archiveCompetitor,
} from "./service";
import type {
  CreateCompetitorInput,
  UpdateCompetitorInput,
  CompetitorResult,
  CompetitorRow,
} from "./types";

export async function loadCompetitorsAction(
  clientProductId: string,
): Promise<CompetitorResult<CompetitorRow[]>> {
  const auth = await authorizeProductAction(clientProductId);
  if (!auth.ok) return auth.result;

  return listCompetitorsForProduct(auth.productId);
}

export async function createCompetitorAction(
  input: CreateCompetitorInput,
): Promise<CompetitorResult<CompetitorRow>> {
  const auth = await authorizeProductAction(input.productId);
  if (!auth.ok) return auth.result;

  return createCompetitor({ ...input, productId: auth.productId });
}

export async function updateCompetitorAction(
  clientProductId: string,
  competitorId: string,
  input: UpdateCompetitorInput,
): Promise<CompetitorResult<CompetitorRow>> {
  const auth = await authorizeProductAction(clientProductId);
  if (!auth.ok) return auth.result;

  return updateCompetitor(auth.productId, competitorId, input);
}

export async function archiveCompetitorAction(
  clientProductId: string,
  competitorId: string,
): Promise<CompetitorResult<CompetitorRow>> {
  const auth = await authorizeProductAction(clientProductId);
  if (!auth.ok) return auth.result;

  return archiveCompetitor(auth.productId, competitorId);
}
