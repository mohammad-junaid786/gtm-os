"use server";

import { authorizeProductAction } from "../routing/authorize-action";
import {
  createLearning,
  getLearningsForProduct,
  updateLearning,
  archiveLearning,
} from "./service";
import type {
  LearningRow,
  CreateLearningInput,
  UpdateLearningInput,
  LearningResult,
} from "./types";

export async function loadLearningsAction(
  clientProductId: string
): Promise<LearningResult<LearningRow[]>> {
  const auth = await authorizeProductAction(clientProductId);
  if (!auth.ok) {
    return { ok: false, error: "UNKNOWN" };
  }
  return getLearningsForProduct(auth.productId);
}

export async function createLearningAction(
  clientProductId: string,
  input: CreateLearningInput
): Promise<LearningResult<LearningRow>> {
  const auth = await authorizeProductAction(clientProductId);
  if (!auth.ok) {
    return { ok: false, error: "UNKNOWN" };
  }
  return createLearning(auth.productId, input);
}

export async function updateLearningAction(
  clientProductId: string,
  learningId: string,
  input: UpdateLearningInput
): Promise<LearningResult<LearningRow>> {
  const auth = await authorizeProductAction(clientProductId);
  if (!auth.ok) {
    return { ok: false, error: "UNKNOWN" };
  }
  return updateLearning(auth.productId, learningId, input);
}

export async function archiveLearningAction(
  clientProductId: string,
  learningId: string
): Promise<LearningResult<LearningRow>> {
  const auth = await authorizeProductAction(clientProductId);
  if (!auth.ok) {
    return { ok: false, error: "UNKNOWN" };
  }
  return archiveLearning(auth.productId, learningId);
}
