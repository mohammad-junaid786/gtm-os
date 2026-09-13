import { test, describe } from "node:test";
import assert from "node:assert/strict";

import { SOURCE_TYPES, CONFIDENCE_LEVELS, IMPACT_LEVELS } from "./types.js";
import {
  createLearning,
  getLearningById,
  updateLearning,
  archiveLearning,
} from "./service.js";

import {
  loadLearningsAction,
  createLearningAction,
  updateLearningAction,
  archiveLearningAction,
} from "./actions.js";

const VALID_UUID_A = "00000000-0000-0000-0000-000000000001";
const VALID_UUID_B = "00000000-0000-0000-0000-000000000002";

function expectCode(result: { ok: false; error: unknown }, code: string) {
  assert.equal(
    result.error,
    code,
    `Expected error code "${code}" but got "${result.error}"`,
  );
}

function expectNotCode(result: { ok: false; error: unknown }, code: string) {
  assert.notEqual(
    result.error,
    code,
    `Did not expect error code "${code}"`,
  );
}

describe("Learnings Types Constants", () => {
  test("SOURCE_TYPES", () => {
    assert.deepStrictEqual([...SOURCE_TYPES].sort(), ["analytics", "campaign", "experiment", "lead", "other"].sort());
  });

  test("CONFIDENCE_LEVELS", () => {
    assert.deepStrictEqual([...CONFIDENCE_LEVELS].sort(), ["high", "low", "medium"].sort());
  });

  test("IMPACT_LEVELS", () => {
    assert.deepStrictEqual([...IMPACT_LEVELS].sort(), ["high", "low", "medium"].sort());
  });
});

describe("createLearning — input validation", () => {
  test("invalid productId → PRODUCT_ID_INVALID", async () => {
    const result = await createLearning("not-a-uuid", { title: "A", insight: "B" });
    assert.equal(result.ok, false);
    expectCode(result as { ok: false; error: string }, "PRODUCT_ID_INVALID");
  });

  test("empty title → INVALID_INPUT", async () => {
    const result = await createLearning(VALID_UUID_A, { title: "", insight: "B" });
    assert.equal(result.ok, false);
    expectCode(result as { ok: false; error: string }, "INVALID_INPUT");
  });

  test("empty insight → INVALID_INPUT", async () => {
    const result = await createLearning(VALID_UUID_A, { title: "A", insight: "" });
    assert.equal(result.ok, false);
    expectCode(result as { ok: false; error: string }, "INVALID_INPUT");
  });

  test("invalid source_type → INVALID_INPUT", async () => {
    const result = await createLearning(VALID_UUID_A, { title: "A", insight: "B", source_type: "fake" as never });
    assert.equal(result.ok, false);
    expectCode(result as { ok: false; error: string }, "INVALID_INPUT");
  });

  test("valid inputs pass validation", async () => {
    const result = await createLearning(VALID_UUID_A, { title: "Title", insight: "Insight" });
    if (!result.ok) {
      expectNotCode(result as { ok: false; error: string }, "PRODUCT_ID_INVALID");
      expectNotCode(result as { ok: false; error: string }, "INVALID_INPUT");
    }
  });
});

describe("getLearningById — input validation", () => {
  test("invalid productId → PRODUCT_ID_INVALID", async () => {
    const result = await getLearningById("bad", VALID_UUID_A);
    assert.equal(result.ok, false);
    expectCode(result as { ok: false; error: string }, "PRODUCT_ID_INVALID");
  });

  test("invalid learningId → LEARNING_ID_INVALID", async () => {
    const result = await getLearningById(VALID_UUID_A, "bad");
    assert.equal(result.ok, false);
    expectCode(result as { ok: false; error: string }, "LEARNING_ID_INVALID");
  });

  test("valid inputs pass validation", async () => {
    const result = await getLearningById(VALID_UUID_A, VALID_UUID_B);
    if (!result.ok) {
      expectNotCode(result as { ok: false; error: string }, "PRODUCT_ID_INVALID");
      expectNotCode(result as { ok: false; error: string }, "LEARNING_ID_INVALID");
    }
  });
});

describe("updateLearning — input validation", () => {
  test("invalid productId → PRODUCT_ID_INVALID", async () => {
    const result = await updateLearning("bad", VALID_UUID_B, { title: "A" });
    assert.equal(result.ok, false);
    expectCode(result as { ok: false; error: string }, "PRODUCT_ID_INVALID");
  });

  test("invalid learningId → LEARNING_ID_INVALID", async () => {
    const result = await updateLearning(VALID_UUID_A, "bad", { title: "A" });
    assert.equal(result.ok, false);
    expectCode(result as { ok: false; error: string }, "LEARNING_ID_INVALID");
  });

  test("empty update fields → NO_UPDATE_FIELDS", async () => {
    const result = await updateLearning(VALID_UUID_A, VALID_UUID_B, {});
    assert.equal(result.ok, false);
    expectCode(result as { ok: false; error: string }, "NO_UPDATE_FIELDS");
  });

  test("valid update passes validation", async () => {
    const result = await updateLearning(VALID_UUID_A, VALID_UUID_B, { title: "B" });
    if (!result.ok) {
      expectNotCode(result as { ok: false; error: string }, "PRODUCT_ID_INVALID");
      expectNotCode(result as { ok: false; error: string }, "LEARNING_ID_INVALID");
      expectNotCode(result as { ok: false; error: string }, "NO_UPDATE_FIELDS");
      expectNotCode(result as { ok: false; error: string }, "INVALID_INPUT");
    }
  });
});

describe("archiveLearning — input validation", () => {
  test("invalid productId → PRODUCT_ID_INVALID", async () => {
    const result = await archiveLearning("bad", VALID_UUID_A);
    assert.equal(result.ok, false);
    expectCode(result as { ok: false; error: string }, "PRODUCT_ID_INVALID");
  });

  test("invalid learningId → LEARNING_ID_INVALID", async () => {
    const result = await archiveLearning(VALID_UUID_A, "bad");
    assert.equal(result.ok, false);
    expectCode(result as { ok: false; error: string }, "LEARNING_ID_INVALID");
  });
});

describe("Server Action authorization model", () => {
  test("loadLearningsAction returns generic error when not authenticated", async () => {
    const result = await loadLearningsAction(VALID_UUID_A);
    assert.equal(result.ok, false);
    const err = result as { ok: false; error: { code?: string } | string };
    assert.equal(err.error.code || err.error, "UNKNOWN");
  });

  test("createLearningAction returns generic error when not authenticated", async () => {
    const result = await createLearningAction(VALID_UUID_A, { title: "A", insight: "B" });
    assert.equal(result.ok, false);
    const err = result as { ok: false; error: { code?: string } | string };
    assert.equal(err.error.code || err.error, "UNKNOWN");
  });

  test("updateLearningAction returns generic error when not authenticated", async () => {
    const result = await updateLearningAction(VALID_UUID_A, VALID_UUID_B, { title: "C" });
    assert.equal(result.ok, false);
    const err = result as { ok: false; error: { code?: string } | string };
    assert.equal(err.error.code || err.error, "UNKNOWN");
  });

  test("archiveLearningAction returns generic error when not authenticated", async () => {
    const result = await archiveLearningAction(VALID_UUID_A, VALID_UUID_B);
    assert.equal(result.ok, false);
    const err = result as { ok: false; error: { code?: string } | string };
    assert.equal(err.error.code || err.error, "UNKNOWN");
  });
});
