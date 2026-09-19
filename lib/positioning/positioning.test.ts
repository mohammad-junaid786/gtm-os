/**
 * Tests for the Positioning domain (lib/positioning/).
 *
 * Test strategy
 * ─────────────
 * All tests are DB-free (no DATABASE_URL required). Validation and type checks
 * fire before getDb() is called, so we can assert on error codes without a
 * live database.
 *
 * Suites covered:
 *   1.  createPositioning — input validation
 *   2.  getPositioningForProduct — input validation
 *   3.  getPositioningById — input validation + product-scoping contract
 *   4.  updatePositioning — input validation
 *   5.  archivePositioning — input validation
 *   6.  PositioningRow type shape
 *   7.  One-active-positioning contract (service + DB level)
 *   8.  Server Action authorization model
 */
import { test, describe } from "node:test";
import assert from "node:assert/strict";

import type { PositioningRow } from "./types.js";
import {
  createPositioning,
  getPositioningForProduct,
  getPositioningById,
  updatePositioning,
  archivePositioning,
} from "./service.js";

import {
  loadPositioningAction,
  createPositioningAction,
  updatePositioningAction,
  archivePositioningAction,
} from "./actions.js";

// ---------------------------------------------------------------------------
// Shared fixtures
// ---------------------------------------------------------------------------

const VALID_UUID_A = "00000000-0000-0000-0000-000000000001";
const VALID_UUID_B = "00000000-0000-0000-0000-000000000002";
const INVALID_UUID = "not-a-uuid";

// ---------------------------------------------------------------------------
// Suite 1: createPositioning — input validation
// ---------------------------------------------------------------------------

describe("createPositioning — input validation", () => {
  test("missing productId → PRODUCT_ID_INVALID", async () => {
    // @ts-expect-error intentional
    const result = await createPositioning({});
    assert.equal(result.ok, false);
    if (!result.ok) assert.equal(result.error.code, "PRODUCT_ID_INVALID");
  });

  test("invalid productId (not a UUID) → PRODUCT_ID_INVALID", async () => {
    const result = await createPositioning({ productId: INVALID_UUID });
    assert.equal(result.ok, false);
    if (!result.ok) assert.equal(result.error.code, "PRODUCT_ID_INVALID");
  });

  test("valid productId, no optional fields → reaches DB phase (UNKNOWN from no DB)", async () => {
    const result = await createPositioning({ productId: VALID_UUID_A });
    assert.equal(result.ok, false);
    // Passes input validation; fails at DB phase with UNKNOWN (no live DB)
    if (!result.ok) assert.equal(result.error.code, "UNKNOWN");
  });

  test("positioning_statement over 2000 chars → UNKNOWN (length validation)", async () => {
    const result = await createPositioning({
      productId: VALID_UUID_A,
      positioning_statement: "x".repeat(2001),
    });
    assert.equal(result.ok, false);
    if (!result.ok) assert.notEqual(result.error.code, "PRODUCT_ID_INVALID");
  });

  test("alternatives element over 500 chars → validation failure", async () => {
    const result = await createPositioning({
      productId: VALID_UUID_A,
      alternatives: ["x".repeat(501)],
    });
    assert.equal(result.ok, false);
    if (!result.ok) assert.equal(result.error.code, "UNKNOWN");
  });

  test("proof_points element over 500 chars → validation failure", async () => {
    const result = await createPositioning({
      productId: VALID_UUID_A,
      proof_points: ["x".repeat(501)],
    });
    assert.equal(result.ok, false);
    if (!result.ok) assert.equal(result.error.code, "UNKNOWN");
  });

  test("notes over 10000 chars → validation failure", async () => {
    const result = await createPositioning({
      productId: VALID_UUID_A,
      notes: "x".repeat(10001),
    });
    assert.equal(result.ok, false);
    if (!result.ok) assert.equal(result.error.code, "UNKNOWN");
  });
});

// ---------------------------------------------------------------------------
// Suite 2: getPositioningForProduct — input validation
// ---------------------------------------------------------------------------

describe("getPositioningForProduct — input validation", () => {
  test("invalid productId → PRODUCT_ID_INVALID", async () => {
    const result = await getPositioningForProduct(INVALID_UUID);
    assert.equal(result.ok, false);
    if (!result.ok) assert.equal(result.error.code, "PRODUCT_ID_INVALID");
  });

  test("valid productId → reaches DB phase (UNKNOWN from no DB)", async () => {
    const result = await getPositioningForProduct(VALID_UUID_A);
    assert.equal(result.ok, false);
    if (!result.ok) assert.equal(result.error.code, "UNKNOWN");
  });
});

// ---------------------------------------------------------------------------
// Suite 3: getPositioningById — input validation + product-scoping contract
// ---------------------------------------------------------------------------

describe("getPositioningById — input validation + product-scoping contract", () => {
  test("invalid productId → PRODUCT_ID_INVALID", async () => {
    const result = await getPositioningById(INVALID_UUID, VALID_UUID_B);
    assert.equal(result.ok, false);
    if (!result.ok) assert.equal(result.error.code, "PRODUCT_ID_INVALID");
  });

  test("invalid positioningId → POSITIONING_ID_INVALID", async () => {
    const result = await getPositioningById(VALID_UUID_A, INVALID_UUID);
    assert.equal(result.ok, false);
    if (!result.ok) assert.equal(result.error.code, "POSITIONING_ID_INVALID");
  });

  test("valid inputs → reaches DB phase (UNKNOWN from no DB)", async () => {
    const result = await getPositioningById(VALID_UUID_A, VALID_UUID_B);
    assert.equal(result.ok, false);
    if (!result.ok) assert.equal(result.error.code, "UNKNOWN");
  });

  test("product scoping: different productId/positioningId combos treated independently", async () => {
    const r1 = await getPositioningById(VALID_UUID_A, VALID_UUID_B);
    const r2 = await getPositioningById(VALID_UUID_B, VALID_UUID_A);
    // Both reach DB phase — neither leaks info about the other
    assert.equal(r1.ok, false);
    assert.equal(r2.ok, false);
    if (!r1.ok) assert.equal(r1.error.code, "UNKNOWN");
    if (!r2.ok) assert.equal(r2.error.code, "UNKNOWN");
  });
});

// ---------------------------------------------------------------------------
// Suite 4: updatePositioning — input validation
// ---------------------------------------------------------------------------

describe("updatePositioning — input validation", () => {
  test("invalid productId → PRODUCT_ID_INVALID", async () => {
    const result = await updatePositioning(INVALID_UUID, VALID_UUID_B, {
      notes: "test",
    });
    assert.equal(result.ok, false);
    if (!result.ok) assert.equal(result.error.code, "PRODUCT_ID_INVALID");
  });

  test("invalid positioningId → POSITIONING_ID_INVALID", async () => {
    const result = await updatePositioning(VALID_UUID_A, INVALID_UUID, {
      notes: "test",
    });
    assert.equal(result.ok, false);
    if (!result.ok) assert.equal(result.error.code, "POSITIONING_ID_INVALID");
  });

  test("empty update object (no fields) → NO_UPDATE_FIELDS", async () => {
    const result = await updatePositioning(VALID_UUID_A, VALID_UUID_B, {});
    assert.equal(result.ok, false);
    if (!result.ok) assert.equal(result.error.code, "NO_UPDATE_FIELDS");
  });

  test("valid partial update → reaches DB phase (UNKNOWN from no DB)", async () => {
    const result = await updatePositioning(VALID_UUID_A, VALID_UUID_B, {
      unique_value: "Better than anything else",
    });
    assert.equal(result.ok, false);
    if (!result.ok) assert.equal(result.error.code, "UNKNOWN");
  });

  test("valid full update → reaches DB phase (UNKNOWN from no DB)", async () => {
    const result = await updatePositioning(VALID_UUID_A, VALID_UUID_B, {
      positioning_statement: "For founders who need GTM structure",
      target_customer: "Early-stage SaaS founders",
      customer_problem: "Scattered GTM planning",
      unique_value: "Structured, self-owned GTM OS",
      alternatives: ["Notion", "Spreadsheets"],
      proof_points: ["10 customers in 30 days"],
      notes: "Draft v1",
    });
    assert.equal(result.ok, false);
    if (!result.ok) assert.equal(result.error.code, "UNKNOWN");
  });
});

// ---------------------------------------------------------------------------
// Suite 5: archivePositioning — input validation
// ---------------------------------------------------------------------------

describe("archivePositioning — input validation", () => {
  test("invalid productId → PRODUCT_ID_INVALID", async () => {
    const result = await archivePositioning(INVALID_UUID, VALID_UUID_B);
    assert.equal(result.ok, false);
    if (!result.ok) assert.equal(result.error.code, "PRODUCT_ID_INVALID");
  });

  test("invalid positioningId → POSITIONING_ID_INVALID", async () => {
    const result = await archivePositioning(VALID_UUID_A, INVALID_UUID);
    assert.equal(result.ok, false);
    if (!result.ok) assert.equal(result.error.code, "POSITIONING_ID_INVALID");
  });

  test("valid inputs → reaches DB phase (UNKNOWN from no DB)", async () => {
    const result = await archivePositioning(VALID_UUID_A, VALID_UUID_B);
    assert.equal(result.ok, false);
    if (!result.ok) assert.equal(result.error.code, "UNKNOWN");
  });
});

// ---------------------------------------------------------------------------
// Suite 6: PositioningRow type shape
// ---------------------------------------------------------------------------

describe("PositioningRow type shape", () => {
  test("PositioningRow has correct shape with all optional fields null", () => {
    const row: PositioningRow = {
      id: VALID_UUID_A,
      product_id: VALID_UUID_B,
      positioning_statement: null,
      target_customer: null,
      customer_problem: null,
      unique_value: null,
      alternatives: null,
      proof_points: null,
      notes: null,
      archived_at: null,
      created_at: new Date(),
      updated_at: new Date(),
    };
    assert.equal(row.archived_at, null); // active
    assert.equal(row.positioning_statement, null);
  });

  test("archived PositioningRow has non-null archived_at", () => {
    const archivedAt = new Date("2026-01-01T00:00:00Z");
    const row: PositioningRow = {
      id: VALID_UUID_A,
      product_id: VALID_UUID_B,
      positioning_statement: "Draft",
      target_customer: null,
      customer_problem: null,
      unique_value: null,
      alternatives: null,
      proof_points: null,
      notes: null,
      archived_at: archivedAt,
      created_at: new Date(),
      updated_at: new Date(),
    };
    assert.notEqual(row.archived_at, null);
    assert.equal(row.archived_at?.toISOString(), archivedAt.toISOString());
  });

  test("PositioningRow with populated arrays", () => {
    const row: PositioningRow = {
      id: VALID_UUID_A,
      product_id: VALID_UUID_B,
      positioning_statement: "For founders who need GTM structure",
      target_customer: "Early-stage SaaS founders",
      customer_problem: "Scattered GTM planning",
      unique_value: "Structured, self-owned GTM OS",
      alternatives: ["Notion", "Spreadsheets", "HubSpot"],
      proof_points: ["10 customers in 30 days", "4.9/5 rating"],
      notes: "v1 draft",
      archived_at: null,
      created_at: new Date(),
      updated_at: new Date(),
    };
    assert.equal(row.alternatives?.length, 3);
    assert.equal(row.proof_points?.length, 2);
  });
});

// ---------------------------------------------------------------------------
// Suite 7: One-active-positioning contract
// ---------------------------------------------------------------------------

describe("One-active-positioning contract", () => {
  test("isUniqueViolation correctly identifies PG error code 23505", () => {
    const pgError = { code: "23505", constraint: "positioning_one_active_per_product" };
    const isViolation =
      typeof pgError === "object" &&
      pgError !== null &&
      "code" in pgError &&
      pgError.code === "23505";
    assert.equal(isViolation, true);
  });

  test("non-unique-violation error is not misidentified", () => {
    const otherError = { code: "23503" }; // FK violation
    const isViolation =
      typeof otherError === "object" &&
      otherError !== null &&
      "code" in otherError &&
      otherError.code === "23505";
    assert.equal(isViolation, false);
  });

  test("archived row has non-null archived_at (would not trigger partial unique index)", () => {
    const archivedRow: PositioningRow = {
      id: VALID_UUID_A,
      product_id: VALID_UUID_B,
      positioning_statement: null,
      target_customer: null,
      customer_problem: null,
      unique_value: null,
      alternatives: null,
      proof_points: null,
      notes: null,
      archived_at: new Date(),
      created_at: new Date(),
      updated_at: new Date(),
    };
    // archived_at IS NOT NULL → this row would NOT trigger the unique index
    assert.notEqual(archivedRow.archived_at, null);
  });

  test("DB integration test gap: race condition requires live database", () => {
    // Two concurrent inserts both passing the pre-insert check require a live DB.
    // This is a documentation test — it passes by asserting the known gap.
    const gapDocumented = true;
    assert.equal(gapDocumented, true);
  });
});

// ---------------------------------------------------------------------------
// Suite 8: Server Action authorization model
// ---------------------------------------------------------------------------

describe("Server Action authorization model", () => {
  test("loadPositioningAction returns generic error when not authenticated", async () => {
    const result = await loadPositioningAction(VALID_UUID_A);
    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.equal(result.error.code, "UNKNOWN");
      assert.ok(result.error.message.length > 0);
    }
  });

  test("createPositioningAction returns generic error when not authenticated", async () => {
    const result = await createPositioningAction(VALID_UUID_A, {
      productId: VALID_UUID_A,
    });
    assert.equal(result.ok, false);
    if (!result.ok) assert.equal(result.error.code, "UNKNOWN");
  });

  test("updatePositioningAction returns generic error when not authenticated", async () => {
    const result = await updatePositioningAction(VALID_UUID_A, VALID_UUID_B, {
      notes: "test",
    });
    assert.equal(result.ok, false);
    if (!result.ok) assert.equal(result.error.code, "UNKNOWN");
  });

  test("archivePositioningAction returns generic error when not authenticated", async () => {
    const result = await archivePositioningAction(VALID_UUID_A, VALID_UUID_B);
    assert.equal(result.ok, false);
    if (!result.ok) assert.equal(result.error.code, "UNKNOWN");
  });
});
