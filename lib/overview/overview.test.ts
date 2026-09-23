import { describe, it, before, after } from "node:test";
import * as assert from "node:assert/strict";
import { getDb } from "@/db";
import { workspaces, products, icps, personas, leads, campaigns, experiments } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getOverviewMetrics } from "./service";
import crypto from "node:crypto";

const VALID_UUID = "00000000-0000-0000-0000-000000000001";
const OTHER_UUID = "00000000-0000-0000-0000-000000000002";
const WORKSPACE_ID = "00000000-0000-0000-0000-000000000003";

describe("getOverviewMetrics", () => {
  before(async () => {
    const db = getDb();
    
    // Create workspace
    await db.insert(workspaces).values({
      id: WORKSPACE_ID,
      name: "Overview Test Workspace",
      slug: "overview-test",
    });

    // Create main product
    await db.insert(products).values({
      id: VALID_UUID,
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
    // Cascade or manually delete products
    await db.delete(products).where(eq(products.workspace_id, WORKSPACE_ID));
  });

  it("returns 0 for empty product", async () => {
    const result = await getOverviewMetrics(VALID_UUID);
    assert.equal(result.ok, true);
    if (result.ok) {
      assert.deepEqual(result.data, {
        totalLeads: 0,
        totalCampaigns: 0,
        totalExperiments: 0,
        totalPersonas: 0,
      });
    }
  });

  it("counts populated demo data and isolates by product", async () => {
    const db = getDb();

    // Populate main product
    await db.insert(leads).values([
      { product_id: VALID_UUID, company: "L1", contact: "C1", status: "New" },
      { product_id: VALID_UUID, company: "L2", contact: "C2", status: "New" },
    ]);

    await db.insert(campaigns).values([
      { product_id: VALID_UUID, name: "Camp 1", status: "Active" },
    ]);

    await db.insert(experiments).values([
      { product_id: VALID_UUID, name: "Exp 1", status: "Active" },
      { product_id: VALID_UUID, name: "Exp 2", status: "Active" },
      { product_id: VALID_UUID, name: "Exp 3", status: "Active" },
    ]);

    const icpId1 = crypto.randomUUID();
    await db.insert(icps).values({
      id: icpId1,
      product_id: VALID_UUID,
      name: "Main ICP",
    });
    
    await db.insert(personas).values([
      { icp_id: icpId1, name: "Persona 1", role: "Role 1" },
      { icp_id: icpId1, name: "Persona 2", role: "Role 2" },
    ]);

    // Populate other product
    await db.insert(leads).values([
      { product_id: OTHER_UUID, company: "Other L1", contact: "C1", status: "New" },
    ]);

    const icpId2 = crypto.randomUUID();
    await db.insert(icps).values({
      id: icpId2,
      product_id: OTHER_UUID,
      name: "Other ICP",
    });

    await db.insert(personas).values([
      { icp_id: icpId2, name: "Other Persona 1", role: "Role 1" },
    ]);

    const result = await getOverviewMetrics(VALID_UUID);
    assert.equal(result.ok, true);
    if (result.ok) {
      assert.deepEqual(result.data, {
        totalLeads: 2,
        totalCampaigns: 1,
        totalExperiments: 3,
        totalPersonas: 2,
      });
    }
    
    const otherResult = await getOverviewMetrics(OTHER_UUID);
    assert.equal(otherResult.ok, true);
    if (otherResult.ok) {
      assert.deepEqual(otherResult.data, {
        totalLeads: 1,
        totalCampaigns: 0,
        totalExperiments: 0,
        totalPersonas: 1,
      });
    }

    // Cleanup
    await db.delete(leads).where(eq(leads.product_id, VALID_UUID));
    await db.delete(campaigns).where(eq(campaigns.product_id, VALID_UUID));
    await db.delete(experiments).where(eq(experiments.product_id, VALID_UUID));
    await db.delete(personas).where(eq(personas.icp_id, icpId1));
    await db.delete(icps).where(eq(icps.id, icpId1));

    await db.delete(leads).where(eq(leads.product_id, OTHER_UUID));
    await db.delete(personas).where(eq(personas.icp_id, icpId2));
    await db.delete(icps).where(eq(icps.id, icpId2));
  });

  it("handles invalid product ID", async () => {
    const result = await getOverviewMetrics("invalid-uuid");
    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.equal(result.error, "PRODUCT_ID_INVALID");
    }
  });
});
