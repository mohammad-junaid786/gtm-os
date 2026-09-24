import { test, describe, before, after } from "node:test";
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
    assert.deepStrictEqual([...SOURCE_TYPES].sort(), ["analytics", "campaign", "experiment", "lead", "research", "competitor", "other"].sort());
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
    assert.equal((err.error as { code?: string }).code || err.error, "UNKNOWN");
  });

  test("createLearningAction returns generic error when not authenticated", async () => {
    const result = await createLearningAction(VALID_UUID_A, { title: "A", insight: "B" });
    assert.equal(result.ok, false);
    const err = result as { ok: false; error: { code?: string } | string };
    assert.equal((err.error as { code?: string }).code || err.error, "UNKNOWN");
  });

  test("updateLearningAction returns generic error when not authenticated", async () => {
    const result = await updateLearningAction(VALID_UUID_A, VALID_UUID_B, { title: "C" });
    assert.equal(result.ok, false);
    const err = result as { ok: false; error: { code?: string } | string };
    assert.equal((err.error as { code?: string }).code || err.error, "UNKNOWN");
  });

  test("archiveLearningAction returns generic error when not authenticated", async () => {
    const result = await archiveLearningAction(VALID_UUID_A, VALID_UUID_B);
    assert.equal(result.ok, false);
    const err = result as { ok: false; error: { code?: string } | string };
    assert.equal((err.error as { code?: string }).code || err.error, "UNKNOWN");
  });
});

import { getDb } from "../../db/index.js";
import { workspaces, products, campaigns, experiments, leads, researchItems, competitors, learnings } from "../../db/schema.js";
import { eq } from "drizzle-orm";

describe("Learning Source Validation (Integration)", () => {
  const WORKSPACE_ID = "00000000-0000-0000-0000-learningswks";
  const PROD_A = "00000000-0000-0000-0000-learningsprA";
  const PROD_B = "00000000-0000-0000-0000-learningsprB";

  before(async () => {
    const db = getDb();
    await db.insert(workspaces).values({ id: WORKSPACE_ID, name: "Test Wks", slug: "test-wks" }).onConflictDoNothing();
    await db.insert(products).values([
      { id: PROD_A, workspace_id: WORKSPACE_ID, name: "Prod A", slug: "prod-a" },
      { id: PROD_B, workspace_id: WORKSPACE_ID, name: "Prod B", slug: "prod-b" }
    ]).onConflictDoNothing();
  });

  after(async () => {
    const db = getDb();
    await db.delete(learnings).where(eq(learnings.product_id, PROD_A));
    await db.delete(learnings).where(eq(learnings.product_id, PROD_B));
    await db.delete(campaigns).where(eq(campaigns.product_id, PROD_A));
    await db.delete(campaigns).where(eq(campaigns.product_id, PROD_B));
    await db.delete(experiments).where(eq(experiments.product_id, PROD_A));
    await db.delete(experiments).where(eq(experiments.product_id, PROD_B));
    await db.delete(leads).where(eq(leads.product_id, PROD_A));
    await db.delete(leads).where(eq(leads.product_id, PROD_B));
    await db.delete(researchItems).where(eq(researchItems.product_id, PROD_A));
    await db.delete(researchItems).where(eq(researchItems.product_id, PROD_B));
    await db.delete(competitors).where(eq(competitors.product_id, PROD_A));
    await db.delete(competitors).where(eq(competitors.product_id, PROD_B));
    await db.delete(products).where(eq(products.workspace_id, WORKSPACE_ID));
    await db.delete(workspaces).where(eq(workspaces.id, WORKSPACE_ID));
  });

  const entityTypes = [
    { type: "campaign", table: campaigns, insert: (id: string, pid: string) => ({ id, product_id: pid, name: "Test Camp", status: "Active" }) },
    { type: "experiment", table: experiments, insert: (id: string, pid: string) => ({ id, product_id: pid, name: "Test Exp", status: "Active" }) },
    { type: "lead", table: leads, insert: (id: string, pid: string) => ({ id, product_id: pid, company: "Test Lead", contact: "Test", status: "New" }) },
    { type: "research", table: researchItems, insert: (id: string, pid: string) => ({ id, product_id: pid, title: "Test Res", type: "interview" }) },
    { type: "competitor", table: competitors, insert: (id: string, pid: string) => ({ id, product_id: pid, name: "Test Comp", name_normalized: "test comp" }) },
  ] as const;

  for (const entity of entityTypes) {
    describe(`Source type: ${entity.type}`, () => {
      const srcA = `00000000-0000-0000-0000-srcA${entity.type.substring(0,4)}`;
      const srcB = `00000000-0000-0000-0000-srcB${entity.type.substring(0,4)}`;

      before(async () => {
        const db = getDb();
        await db.insert(entity.table).values([
          entity.insert(srcA, PROD_A),
          entity.insert(srcB, PROD_B)
        ] as never[]);
      });

      test("Same-product source -> accepted", async () => {
        const result = await createLearning(PROD_A, { title: "T", insight: "I", source_type: entity.type, source_id: srcA });
        assert.equal(result.ok, true, `Should accept valid same-product ${entity.type}`);
      });

      test("Cross-product source -> rejected", async () => {
        const result = await createLearning(PROD_A, { title: "T", insight: "I", source_type: entity.type, source_id: srcB });
        assert.equal(result.ok, false);
        expectCode(result as Extract<typeof result, { ok: false }>, "SOURCE_NOT_FOUND_IN_PRODUCT");
      });

      test("Non-existent source ID -> rejected", async () => {
        const result = await createLearning(PROD_A, { title: "T", insight: "I", source_type: entity.type, source_id: "00000000-0000-0000-0000-fake00000000" });
        assert.equal(result.ok, false);
        expectCode(result as Extract<typeof result, { ok: false }>, "SOURCE_NOT_FOUND_IN_PRODUCT");
      });
    });
  }

  describe("Non-entity sources (analytics, other)", () => {
    test("analytics with valid UUID -> accepted (untyped escape hatch)", async () => {
      const randomUuid = crypto.randomUUID();
      const result = await createLearning(PROD_A, { title: "T", insight: "I", source_type: "analytics", source_id: randomUuid });
      assert.equal(result.ok, true, "Analytics should accept any valid UUID format");
    });

    test("other with valid UUID -> accepted (untyped escape hatch)", async () => {
      const randomUuid = crypto.randomUUID();
      const result = await createLearning(PROD_A, { title: "T", insight: "I", source_type: "other", source_id: randomUuid });
      assert.equal(result.ok, true, "Other should accept any valid UUID format");
    });

    test("analytics with invalid UUID format -> rejected", async () => {
      const result = await createLearning(PROD_A, { title: "T", insight: "I", source_type: "analytics", source_id: "not-a-uuid" });
      assert.equal(result.ok, false);
      expectCode(result as Extract<typeof result, { ok: false }>, "INVALID_INPUT");
    });
  });
});
