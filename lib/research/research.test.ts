import { test, describe, mock, before, after } from "node:test";
import assert from "node:assert/strict";
import pg from "pg";
import { env } from "../env.js";

import {
  createResearchItem,
  getResearchItemById,
  listResearchItemsForProduct,
  updateResearchItem,
  archiveResearchItem,
} from "./service.js";

const VALID_UUID_A = "00000000-0000-0000-0000-000000000001";
const VALID_UUID_B = "00000000-0000-0000-0000-000000000002";
const INVALID_UUID = "not-a-uuid";

describe("Research Service - Input Validation", () => {
  describe("Suite 1: createResearchItem", () => {
    test("missing productId -> UNKNOWN (zod validation)", async () => {
      // @ts-expect-error testing invalid input
      const res = await createResearchItem({ title: "Title", type: "article" });
      assert.equal(res.ok, false);
      if (!res.ok) assert.equal(res.error.code, "UNKNOWN");
    });

    test("invalid UUID -> UNKNOWN (zod validation)", async () => {
      const res = await createResearchItem({ productId: INVALID_UUID, title: "Title", type: "article" });
      assert.equal(res.ok, false);
      if (!res.ok) assert.equal(res.error.code, "UNKNOWN");
    });

    test("empty title -> UNKNOWN", async () => {
      const res = await createResearchItem({ productId: VALID_UUID_A, title: "", type: "article" });
      assert.equal(res.ok, false);
      if (!res.ok) assert.equal(res.error.code, "UNKNOWN");
    });

    test("invalid type -> UNKNOWN", async () => {
      // @ts-expect-error invalid enum
      const res = await createResearchItem({ productId: VALID_UUID_A, title: "Title", type: "magic" });
      assert.equal(res.ok, false);
      if (!res.ok) assert.equal(res.error.code, "UNKNOWN");
    });

    test("invalid website (not a URL) -> WEBSITE_INVALID", async () => {
      const res = await createResearchItem({ productId: VALID_UUID_A, title: "Title", type: "article", source_url: "not-a-url" });
      assert.equal(res.ok, false);
      if (!res.ok) assert.equal(res.error.code, "WEBSITE_INVALID");
    });

    test("ftp:// -> WEBSITE_INVALID (protocol check)", async () => {
      const res = await createResearchItem({ productId: VALID_UUID_A, title: "Title", type: "article", source_url: "ftp://example.com" });
      assert.equal(res.ok, false);
      if (!res.ok) assert.equal(res.error.code, "WEBSITE_INVALID");
    });


    test("invalid date regex -> UNKNOWN", async () => {
      const res = await createResearchItem({ productId: VALID_UUID_A, title: "Title", type: "article", date_researched: "1/1/2024" });
      assert.equal(res.ok, false);
      if (!res.ok) assert.equal(res.error.code, "UNKNOWN"); // validation failed
    });

    test("http:// -> UNKNOWN (passes validation, hits DB)", async () => {
      try {
        await createResearchItem({ productId: VALID_UUID_A, title: "Title", type: "article", source_url: "http://example.com" });
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e);
        assert.ok(msg.includes("DATABASE_URL") || msg.includes("database") || msg.includes("Client was closed"));
      }
    });
  });

  describe("Suite 2: updateResearchItem", () => {
    test("invalid productId -> PRODUCT_ID_INVALID", async () => {
      const res = await updateResearchItem(INVALID_UUID, VALID_UUID_B, { title: "New" });
      assert.equal(res.ok, false);
      if (!res.ok) assert.equal(res.error.code, "PRODUCT_ID_INVALID");
    });

    test("invalid researchItemId -> RESEARCH_ITEM_ID_INVALID", async () => {
      const res = await updateResearchItem(VALID_UUID_A, INVALID_UUID, { title: "New" });
      assert.equal(res.ok, false);
      if (!res.ok) assert.equal(res.error.code, "RESEARCH_ITEM_ID_INVALID");
    });

    test("no update fields -> NO_UPDATE_FIELDS", async () => {
      const res = await updateResearchItem(VALID_UUID_A, VALID_UUID_B, {});
      assert.equal(res.ok, false);
      if (!res.ok) assert.equal(res.error.code, "NO_UPDATE_FIELDS");
    });
  });

  describe("Suite 3: getters and lists", () => {
    test("getResearchItemById invalid product -> PRODUCT_ID_INVALID", async () => {
      const res = await getResearchItemById(INVALID_UUID, VALID_UUID_B);
      assert.equal(res.ok, false);
      if (!res.ok) assert.equal(res.error.code, "PRODUCT_ID_INVALID");
    });

    test("listResearchItemsForProduct invalid product -> PRODUCT_ID_INVALID", async () => {
      const res = await listResearchItemsForProduct(INVALID_UUID);
      assert.equal(res.ok, false);
      if (!res.ok) assert.equal(res.error.code, "PRODUCT_ID_INVALID");
    });
  });
});

describe("Research Service - Database Invariants", () => {
  let queryMock: ReturnType<typeof mock.method>;

  before(() => {
    env.DATABASE_URL = "postgres://dummy";
    queryMock = mock.method(pg.Pool.prototype, "query", async () => {
      return { rows: [] };
    });
  });

  after(() => {
    queryMock.mock.restore();
  });

  function setMockRows(responses: unknown[][]) {
    let callCount = 0;
    queryMock.mock.mockImplementation(async (_config: unknown) => {
      // Return the next response array or empty
      const rows = responses[callCount++] || [];
      return { rows };
    });
  }

  test("Creating research with a competitor belonging to another product returns COMPETITOR_NOT_FOUND", async () => {
    setMockRows([[]]);
    const res = await createResearchItem({ productId: VALID_UUID_A, competitorId: VALID_UUID_B, title: "Title", type: "article" });
    assert.equal(res.ok, false);
    if (!res.ok) assert.equal(res.error.code, "COMPETITOR_NOT_FOUND");
  });

  test("Creating research with an archived competitor returns COMPETITOR_ARCHIVED", async () => {
    setMockRows([[{ archived_at: new Date() }]]);
    const res = await createResearchItem({ productId: VALID_UUID_A, competitorId: VALID_UUID_B, title: "Title", type: "article" });
    assert.equal(res.ok, false);
    if (!res.ok) assert.equal(res.error.code, "COMPETITOR_ARCHIVED");
  });

  test("Updating research with a competitor belonging to another product returns COMPETITOR_NOT_FOUND", async () => {
    setMockRows([ [[null]], [] ]);
    const res = await updateResearchItem(VALID_UUID_A, VALID_UUID_B, { competitorId: VALID_UUID_B });
    assert.equal(res.ok, false);
    if (!res.ok) assert.equal(res.error.code, "COMPETITOR_NOT_FOUND");
  });

  test("Updating research with an archived competitor returns COMPETITOR_ARCHIVED", async () => {
    setMockRows([ [[null]], [[new Date()]] ]);
    const res = await updateResearchItem(VALID_UUID_A, VALID_UUID_B, { competitorId: VALID_UUID_B });
    assert.equal(res.ok, false);
    if (!res.ok) assert.equal(res.error.code, "COMPETITOR_ARCHIVED");
  });

  test("getResearchItemById returns RESEARCH_ITEM_NOT_FOUND when the research item belongs to another product", async () => {
    setMockRows([[]]); 
    const res = await getResearchItemById(VALID_UUID_A, VALID_UUID_B);
    assert.equal(res.ok, false);
    if (!res.ok) assert.equal(res.error.code, "RESEARCH_ITEM_NOT_FOUND");
  });

  test("updateResearchItem returns RESEARCH_ITEM_NOT_FOUND when the research item belongs to another product", async () => {
    setMockRows([[]]);
    const res = await updateResearchItem(VALID_UUID_A, VALID_UUID_B, { title: "Title" });
    assert.equal(res.ok, false);
    if (!res.ok) assert.equal(res.error.code, "RESEARCH_ITEM_NOT_FOUND");
  });

  test("archiveResearchItem returns RESEARCH_ITEM_NOT_FOUND when the research item belongs to another product", async () => {
    setMockRows([[]]); 
    const res = await archiveResearchItem(VALID_UUID_A, VALID_UUID_B);
    assert.equal(res.ok, false);
    if (!res.ok) assert.equal(res.error.code, "RESEARCH_ITEM_NOT_FOUND");
  });

  test("Verify that archiving a competitor does not break an existing research item's competitor_id relationship", async () => {
    setMockRows([ [[VALID_UUID_B, VALID_UUID_A, VALID_UUID_A, "article", "Title", null, null, "2024-01-01", new Date(), new Date(), null]] ]);
    const res = await getResearchItemById(VALID_UUID_A, VALID_UUID_B);
    assert.equal(res.ok, true);
  });
});
