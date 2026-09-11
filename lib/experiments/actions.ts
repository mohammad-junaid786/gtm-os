"use server";

import { authorizeProductAction } from "@/lib/routing/authorize-action";
import {
  createExperiment,
  getExperimentsForProduct,
  updateExperiment,
  archiveExperiment,
} from "./service";
import type { CreateExperimentInput, ExperimentResult, ExperimentRow, UpdateExperimentInput } from "./types";

export async function loadExperimentsAction(
  productId: string,
): Promise<ExperimentResult<ExperimentRow[]>> {
  const auth = await authorizeProductAction(productId);
  if (!auth.ok) {
    return { ok: false, error: { code: "UNKNOWN", message: "Not authorized." } };
  }
  return getExperimentsForProduct(auth.productId);
}

export async function createExperimentAction(
  productId: string,
  input: CreateExperimentInput,
): Promise<ExperimentResult<ExperimentRow>> {
  const auth = await authorizeProductAction(productId);
  if (!auth.ok) {
    return { ok: false, error: { code: "UNKNOWN", message: "Not authorized." } };
  }
  return createExperiment(auth.productId, input);
}

export async function updateExperimentAction(
  productId: string,
  experimentId: string,
  input: UpdateExperimentInput,
): Promise<ExperimentResult<ExperimentRow>> {
  const auth = await authorizeProductAction(productId);
  if (!auth.ok) {
    return { ok: false, error: { code: "UNKNOWN", message: "Not authorized." } };
  }
  return updateExperiment(auth.productId, experimentId, input);
}

export async function archiveExperimentAction(
  productId: string,
  experimentId: string,
): Promise<ExperimentResult<ExperimentRow>> {
  const auth = await authorizeProductAction(productId);
  if (!auth.ok) {
    return { ok: false, error: { code: "UNKNOWN", message: "Not authorized." } };
  }
  return archiveExperiment(auth.productId, experimentId);
}
