import { test, describe } from "node:test";
import assert from "node:assert/strict";

import { createExperiment, getExperimentsForProduct, updateExperiment } from "./service.js";
import { loadExperimentsAction } from "./actions.js";

const VALID_UUID_A = "00000000-0000-0000-0000-000000000001";
const VALID_UUID_B = "00000000-0000-0000-0000-000000000002";

function expectCode(result: { ok: boolean; error?: { code: string } }, code: string) {
  assert.equal(result.ok, false);
  assert.equal(
    result.error?.code,
    code,
    `Expected error code "${code}" but got "${result.error?.code}"`,
  );
}

describe("createExperiment", () => {
  test("fails if productId is not a UUID", async () => {
    const r = await createExperiment("invalid", { name: "E" });
    expectCode(r, "PRODUCT_ID_INVALID");
  });

  test("fails if name is empty", async () => {
    const r = await createExperiment(VALID_UUID_A, { name: "   " });
    expectCode(r, "NAME_EMPTY");
  });
});

describe("getExperimentsForProduct", () => {
  test("fails if productId is not a UUID", async () => {
    const r = await getExperimentsForProduct("invalid");
    expectCode(r, "PRODUCT_ID_INVALID");
  });
});

describe("updateExperiment", () => {
  test("fails if productId is not a UUID", async () => {
    const r = await updateExperiment("invalid", VALID_UUID_B, { name: "E" });
    expectCode(r, "PRODUCT_ID_INVALID");
  });

  test("fails if no fields are provided", async () => {
    const r = await updateExperiment(VALID_UUID_A, VALID_UUID_B, {});
    expectCode(r, "NO_UPDATE_FIELDS");
  });
});

describe("Server Action authorization model", () => {
  test("loadExperimentsAction returns a generic error when not authenticated", async () => {
    const result = await loadExperimentsAction(VALID_UUID_A);
    assert.equal(result.ok, false);
  });
});
