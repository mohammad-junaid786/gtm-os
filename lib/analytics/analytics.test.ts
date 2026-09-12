import { test, describe } from "node:test";
import assert from "node:assert/strict";

import {
  getGtmMetrics,
  getPipelineFunnel,
  getCampaignPerformance,
} from "./service.js";

import {
  loadGtmMetricsAction,
  loadPipelineFunnelAction,
  loadCampaignPerformanceAction,
} from "./actions.js";

const VALID_UUID_A = "00000000-0000-0000-0000-000000000001";

function expectCode(result: { ok: false; error: string }, code: string) {
  assert.equal(
    result.error,
    code,
    `Expected error code "${code}" but got "${result.error}"`
  );
}

function expectNotCode(result: { ok: false; error: string }, code: string) {
  assert.notEqual(
    result.error,
    code,
    `Did not expect error code "${code}"`
  );
}

describe("getGtmMetrics — input validation", () => {
  test("invalid productId → PRODUCT_ID_INVALID", async () => {
    const result = await getGtmMetrics("not-a-uuid");
    assert.equal(result.ok, false);
    expectCode(result as { ok: false; error: string }, "PRODUCT_ID_INVALID");
  });

  test("valid productId passes validation (reaches DB phase)", async () => {
    const result = await getGtmMetrics(VALID_UUID_A);
    if (!result.ok) {
      expectNotCode(result as { ok: false; error: string }, "PRODUCT_ID_INVALID");
    }
  });
});

describe("getPipelineFunnel — input validation", () => {
  test("invalid productId → PRODUCT_ID_INVALID", async () => {
    const result = await getPipelineFunnel("not-a-uuid");
    assert.equal(result.ok, false);
    expectCode(result as { ok: false; error: string }, "PRODUCT_ID_INVALID");
  });
});

describe("getCampaignPerformance — input validation", () => {
  test("invalid productId → PRODUCT_ID_INVALID", async () => {
    const result = await getCampaignPerformance("not-a-uuid");
    assert.equal(result.ok, false);
    expectCode(result as { ok: false; error: string }, "PRODUCT_ID_INVALID");
  });
});

describe("Server Action authorization model", () => {
  test("loadGtmMetricsAction returns generic error when not authenticated", async () => {
    const result = await loadGtmMetricsAction(VALID_UUID_A);
    assert.equal(result.ok, false);
    const err = result as { ok: false; error: string };
    // Returns PRODUCT_ID_INVALID since we coerce the auth error for now.
    assert.equal(err.error, "PRODUCT_ID_INVALID");
  });

  test("loadPipelineFunnelAction fails safely", async () => {
    const result = await loadPipelineFunnelAction(VALID_UUID_A);
    assert.equal(result.ok, false);
    const err = result as { ok: false; error: string };
    assert.equal(err.error, "PRODUCT_ID_INVALID");
  });

  test("loadCampaignPerformanceAction fails safely", async () => {
    const result = await loadCampaignPerformanceAction(VALID_UUID_A);
    assert.equal(result.ok, false);
    const err = result as { ok: false; error: string };
    assert.equal(err.error, "PRODUCT_ID_INVALID");
  });
});
