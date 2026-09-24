import { test, describe, before, after, it } from "node:test";
import assert from "node:assert/strict";
import { getDb } from "@/db";
import { workspaces, products, leads, experiments, learnings, researchItems } from "@/db/schema";
import { eq } from "drizzle-orm";

import {
  getGtmMetrics,
  getPipelineFunnel,
  getCampaignPerformance,
  getLeadStatusDistribution,
  getLeadsOverTime,
  getExperimentStatusDistribution,
  getStrategicVolume
} from "./service.js";

import {
  loadGtmMetricsAction,
  loadPipelineFunnelAction,
  loadCampaignPerformanceAction,
} from "./actions.js";

const VALID_UUID_A = "00000000-0000-0000-0000-000000000001";
const OTHER_UUID = "00000000-0000-0000-0000-000000000002";
const WORKSPACE_ID = "00000000-0000-0000-0000-000000000003";

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

describe("Analytics Data Foundation — DB tests", () => {
  before(async () => {
    const db = getDb();
    
    // Create workspace
    await db.insert(workspaces).values({
      id: WORKSPACE_ID,
      name: "Analytics Test Workspace",
      slug: "analytics-test",
    });

    // Create main product
    await db.insert(products).values({
      id: VALID_UUID_A,
      workspace_id: WORKSPACE_ID,
      name: "Main Product",
      slug: "main-product",
    });

    // Create other product
    await db.insert(products).values({
      id: OTHER_UUID,
      workspace_id: WORKSPACE_ID,
      name: "Other Product",
      slug: "other-product",
    });
  });

  after(async () => {
    const db = getDb();
    await db.delete(workspaces).where(eq(workspaces.id, WORKSPACE_ID));
    await db.delete(products).where(eq(products.workspace_id, WORKSPACE_ID));
  });

  it("getLeadStatusDistribution handles counts and product isolation", async () => {
    const db = getDb();
    await db.insert(leads).values([
      { product_id: VALID_UUID_A, company: "L1", contact: "C1", status: "New" },
      { product_id: VALID_UUID_A, company: "L2", contact: "C2", status: "New" },
      { product_id: VALID_UUID_A, company: "L3", contact: "C3", status: "Qualified" },
      { product_id: OTHER_UUID, company: "O1", contact: "C1", status: "New" },
      { product_id: VALID_UUID_A, company: "Archived", contact: "C", status: "New", archived_at: new Date() },
    ]);

    const resA = await getLeadStatusDistribution(VALID_UUID_A);
    assert.equal(resA.ok, true);
    if (resA.ok) {
      assert.deepEqual(resA.data, [
        { status: "New", count: 2 },
        { status: "Qualified", count: 1 }
      ]);
    }

    const resB = await getLeadStatusDistribution(OTHER_UUID);
    assert.equal(resB.ok, true);
    if (resB.ok) {
      assert.deepEqual(resB.data, [
        { status: "New", count: 1 }
      ]);
    }

    await db.delete(leads).where(eq(leads.product_id, VALID_UUID_A));
    await db.delete(leads).where(eq(leads.product_id, OTHER_UUID));
  });

  it("getLeadsOverTime handles grouping and product isolation", async () => {
    const db = getDb();
    await db.insert(leads).values([
      { product_id: VALID_UUID_A, company: "L1", contact: "C1", status: "New", created_at: new Date("2026-01-15T00:00:00Z") },
      { product_id: VALID_UUID_A, company: "L2", contact: "C2", status: "New", created_at: new Date("2026-01-20T00:00:00Z") },
      { product_id: VALID_UUID_A, company: "L3", contact: "C3", status: "New", created_at: new Date("2026-02-10T00:00:00Z") },
      { product_id: OTHER_UUID, company: "O1", contact: "C1", status: "New", created_at: new Date("2026-01-18T00:00:00Z") },
    ]);

    const resA = await getLeadsOverTime(VALID_UUID_A);
    assert.equal(resA.ok, true);
    if (resA.ok) {
      assert.deepEqual(resA.data, [
        { period: "2026-01", count: 2 },
        { period: "2026-02", count: 1 }
      ]);
    }

    const resB = await getLeadsOverTime(OTHER_UUID);
    assert.equal(resB.ok, true);
    if (resB.ok) {
      assert.deepEqual(resB.data, [
        { period: "2026-01", count: 1 }
      ]);
    }

    await db.delete(leads).where(eq(leads.product_id, VALID_UUID_A));
    await db.delete(leads).where(eq(leads.product_id, OTHER_UUID));
  });

  it("getExperimentStatusDistribution handles counts and product isolation", async () => {
    const db = getDb();
    await db.insert(experiments).values([
      { product_id: VALID_UUID_A, name: "Exp1", status: "Draft" },
      { product_id: VALID_UUID_A, name: "Exp2", status: "Active" },
      { product_id: VALID_UUID_A, name: "Exp3", status: "Active" },
      { product_id: OTHER_UUID, name: "O1", status: "Draft" },
      { product_id: VALID_UUID_A, name: "Archived", status: "Active", archived_at: new Date() },
    ]);

    const resA = await getExperimentStatusDistribution(VALID_UUID_A);
    assert.equal(resA.ok, true);
    if (resA.ok) {
      assert.deepEqual(resA.data, [
        { status: "Active", count: 2 },
        { status: "Draft", count: 1 }
      ]);
    }

    const resB = await getExperimentStatusDistribution(OTHER_UUID);
    assert.equal(resB.ok, true);
    if (resB.ok) {
      assert.deepEqual(resB.data, [
        { status: "Draft", count: 1 }
      ]);
    }

    await db.delete(experiments).where(eq(experiments.product_id, VALID_UUID_A));
    await db.delete(experiments).where(eq(experiments.product_id, OTHER_UUID));
  });

  it("getStrategicVolume handles counts and product isolation", async () => {
    const db = getDb();
    await db.insert(learnings).values([
      { product_id: VALID_UUID_A, title: "L1", insight: "I1" },
      { product_id: VALID_UUID_A, title: "L2", insight: "I2" },
      { product_id: OTHER_UUID, title: "O1", insight: "I3" },
      { product_id: VALID_UUID_A, title: "Archived", insight: "I4", archived_at: new Date() },
    ]);

    await db.insert(researchItems).values([
      { product_id: VALID_UUID_A, title: "R1", type: "competitor" },
      { product_id: OTHER_UUID, title: "O1", type: "competitor" },
    ]);

    const resA = await getStrategicVolume(VALID_UUID_A);
    assert.equal(resA.ok, true);
    if (resA.ok) {
      assert.deepEqual(resA.data, {
        totalLearnings: 2,
        totalResearchItems: 1
      });
    }

    const resB = await getStrategicVolume(OTHER_UUID);
    assert.equal(resB.ok, true);
    if (resB.ok) {
      assert.deepEqual(resB.data, {
        totalLearnings: 1,
        totalResearchItems: 1
      });
    }

    // Test empty product
    const resEmpty = await getStrategicVolume(crypto.randomUUID());
    assert.equal(resEmpty.ok, true);
    if (resEmpty.ok) {
      assert.deepEqual(resEmpty.data, {
        totalLearnings: 0,
        totalResearchItems: 0
      });
    }

    await db.delete(learnings).where(eq(learnings.product_id, VALID_UUID_A));
    await db.delete(learnings).where(eq(learnings.product_id, OTHER_UUID));
    await db.delete(researchItems).where(eq(researchItems.product_id, VALID_UUID_A));
    await db.delete(researchItems).where(eq(researchItems.product_id, OTHER_UUID));
  });
});

import { campaigns } from "@/db/schema";

describe("Analytics Filters", () => {
  before(async () => {
    const db = getDb();
    await db.insert(workspaces).values({
      id: WORKSPACE_ID,
      name: "Filters Test Workspace",
      slug: "filters-test",
    });
    await db.insert(products).values([
      { id: VALID_UUID_A, workspace_id: WORKSPACE_ID, name: "Product A", slug: "prod-a" },
      { id: OTHER_UUID, workspace_id: WORKSPACE_ID, name: "Product B", slug: "prod-b" }
    ]);
  });

  after(async () => {
    const db = getDb();
    await db.delete(workspaces).where(eq(workspaces.id, WORKSPACE_ID));
  });

  it("Campaign filter enforces cross-product isolation", async () => {
    const db = getDb();
    const campaignIdOther = "11111111-1111-1111-1111-111111111111";

    await db.insert(campaigns).values([
      { id: campaignIdOther, product_id: OTHER_UUID, name: "Other Campaign", status: "Active", spend: 1000, revenue: 5000 }
    ]);

    // Query Product A using a campaign ID from Product B
    const resA = await getCampaignPerformance(VALID_UUID_A, { campaignId: campaignIdOther });
    
    assert.equal(resA.ok, true);
    if (resA.ok) {
      assert.equal(resA.data.length, 0, "Should not return data for a campaign belonging to another product");
    }

    // Query Product B using its own campaign ID
    const resB = await getCampaignPerformance(OTHER_UUID, { campaignId: campaignIdOther });
    
    assert.equal(resB.ok, true);
    if (resB.ok) {
      assert.equal(resB.data.length, 1, "Should return data for its own campaign");
    }

    await db.delete(campaigns).where(eq(campaigns.id, campaignIdOther));
  });

  it("Strategic Volume does not apply experimentStatus filter", async () => {
    const db = getDb();
    await db.insert(learnings).values([
      { product_id: VALID_UUID_A, title: "L1", insight: "I1" },
    ]);

    // Query Strategic Volume with an experiment filter
    // If it breaks SQL because experimentStatus isn't handled correctly, it will throw an error or return 0 if wrongly joined
    // Actually the implementation doesn't apply it at all, so it should return 1
    const res = await getStrategicVolume(VALID_UUID_A, { experimentStatus: "Active" });
    
    assert.equal(res.ok, true);
    if (res.ok) {
      assert.equal(res.data.totalLearnings, 1, "Strategic Volume should ignore experimentStatus filter entirely");
    }

    await db.delete(learnings).where(eq(learnings.product_id, VALID_UUID_A));
  });
});
