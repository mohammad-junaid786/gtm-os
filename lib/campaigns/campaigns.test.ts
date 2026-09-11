import { test, describe } from "node:test";
import assert from "node:assert/strict";

import { createCampaign, getCampaignsForProduct, updateCampaign } from "./service.js";
import { loadCampaignsAction } from "./actions.js";
import { getCampaignMetrics, type CampaignRow } from "./types.js";

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

describe("createCampaign", () => {
  test("fails if productId is not a UUID", async () => {
    const r = await createCampaign("invalid", { name: "C" });
    expectCode(r, "PRODUCT_ID_INVALID");
  });

  test("fails if name is empty", async () => {
    const r = await createCampaign(VALID_UUID_A, { name: "   " });
    expectCode(r, "NAME_EMPTY");
  });
});

describe("getCampaignsForProduct", () => {
  test("fails if productId is not a UUID", async () => {
    const r = await getCampaignsForProduct("invalid");
    expectCode(r, "PRODUCT_ID_INVALID");
  });
});

describe("updateCampaign", () => {
  test("fails if productId is not a UUID", async () => {
    const r = await updateCampaign("invalid", VALID_UUID_B, { name: "C" });
    expectCode(r, "PRODUCT_ID_INVALID");
  });

  test("fails if no fields are provided", async () => {
    const r = await updateCampaign(VALID_UUID_A, VALID_UUID_B, {});
    expectCode(r, "NO_UPDATE_FIELDS");
  });
});

describe("getCampaignMetrics", () => {
  test("calculates CTR correctly", () => {
    const row = { impressions: 1000, clicks: 50, conversions: 0, spend: 0, leads_generated: 0, revenue: 0 } as unknown as CampaignRow;
    const metrics = getCampaignMetrics(row);
    assert.equal(metrics.ctr, 5); // 5%
  });

  test("calculates CPL correctly", () => {
    // spend 10000 cents ($100), leads 10 => 1000 cents ($10) per lead
    const row = { impressions: 0, clicks: 0, conversions: 0, spend: 10000, leads_generated: 10, revenue: 0 } as unknown as CampaignRow;
    const metrics = getCampaignMetrics(row);
    assert.equal(metrics.cplCents, 1000);
  });

  test("calculates ROAS correctly", () => {
    // spend 10000 cents ($100), revenue 50000 cents ($500) => ROAS 5
    const row = { impressions: 0, clicks: 0, conversions: 0, spend: 10000, leads_generated: 0, revenue: 50000 } as unknown as CampaignRow;
    const metrics = getCampaignMetrics(row);
    assert.equal(metrics.roas, 5);
  });

  test("handles zero gracefully to prevent NaN/Infinity", () => {
    const row = { impressions: 0, clicks: 0, conversions: 0, spend: 0, leads_generated: 0, revenue: 0 } as unknown as CampaignRow;
    const metrics = getCampaignMetrics(row);
    assert.equal(metrics.ctr, 0);
    assert.equal(metrics.conversionRate, 0);
    assert.equal(metrics.cplCents, 0);
    assert.equal(metrics.cacCents, 0);
    assert.equal(metrics.roas, 0);
  });
});

describe("Server Action authorization model", () => {
  test("loadCampaignsAction returns a generic error when not authenticated", async () => {
    const result = await loadCampaignsAction(VALID_UUID_A);
    assert.equal(result.ok, false);
  });
});
