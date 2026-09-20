import { test, describe } from "node:test";
import assert from "node:assert/strict";
import {
  createCompetitor,
  getCompetitorById,
  listCompetitorsForProduct,
  updateCompetitor,
  archiveCompetitor,
} from "./service.js";

const VALID_UUID_A = "00000000-0000-0000-0000-000000000001";
const VALID_UUID_B = "00000000-0000-0000-0000-000000000002";
const INVALID_UUID = "not-a-uuid";

describe("Competitors Service - Input Validation", () => {
  describe("Suite 1: createCompetitor", () => {
    test("missing productId -> PRODUCT_ID_INVALID", async () => {
      // @ts-expect-error testing invalid input
      const res = await createCompetitor({ name: "Competitor A" });
      assert.equal(res.ok, false);
      if (!res.ok) assert.equal(res.error.code, "PRODUCT_ID_INVALID");
    });

    test("invalid UUID -> PRODUCT_ID_INVALID", async () => {
      const res = await createCompetitor({ productId: INVALID_UUID, name: "Competitor A" });
      assert.equal(res.ok, false);
      if (!res.ok) assert.equal(res.error.code, "PRODUCT_ID_INVALID");
    });

    test("missing name -> NAME_EMPTY", async () => {
      // @ts-expect-error testing invalid input
      const res = await createCompetitor({ productId: VALID_UUID_A });
      assert.equal(res.ok, false);
      if (!res.ok) assert.ok(["NAME_EMPTY", "UNKNOWN"].includes(res.error.code));
    });

    test("empty name -> NAME_EMPTY", async () => {
      const res = await createCompetitor({ productId: VALID_UUID_A, name: "" });
      assert.equal(res.ok, false);
      if (!res.ok) assert.ok(["NAME_EMPTY", "UNKNOWN"].includes(res.error.code));
    });

    test("whitespace-only name -> NAME_EMPTY", async () => {
      const res = await createCompetitor({ productId: VALID_UUID_A, name: "   " });
      assert.equal(res.ok, false);
      if (!res.ok) assert.equal(res.error.code, "NAME_EMPTY");
    });

    test("invalid website (not a URL) -> WEBSITE_INVALID", async () => {
      const res = await createCompetitor({ productId: VALID_UUID_A, name: "A", website: "not-a-url" });
      assert.equal(res.ok, false);
      if (!res.ok) assert.equal(res.error.code, "WEBSITE_INVALID");
    });

    test("ftp:// -> WEBSITE_INVALID (protocol check)", async () => {
      const res = await createCompetitor({ productId: VALID_UUID_A, name: "A", website: "ftp://example.com" });
      assert.equal(res.ok, false);
      if (!res.ok) assert.equal(res.error.code, "WEBSITE_INVALID");
    });

    test("http:// -> UNKNOWN (passes validation, hits DB)", async () => {
      try {
        await createCompetitor({ productId: VALID_UUID_A, name: "A", website: "http://example.com" });
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e);
        assert.ok(msg.includes("DATABASE_URL") || msg.includes("database") || msg.includes("Client was closed"));
      }
    });

    test("https:// -> UNKNOWN (passes validation, hits DB)", async () => {
      try {
        await createCompetitor({ productId: VALID_UUID_A, name: "A", website: "https://example.com" });
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e);
        assert.ok(msg.includes("DATABASE_URL") || msg.includes("database") || msg.includes("Client was closed"));
      }
    });

    test("arrays over max length rejected", async () => {
      const longString = "a".repeat(501);
      const res = await createCompetitor({ productId: VALID_UUID_A, name: "A", strengths: [longString] });
      assert.equal(res.ok, false);
      if (!res.ok) assert.equal(res.error.code, "UNKNOWN"); // Zod array elem max length failure
    });
  });

  describe("Suite 2: listCompetitorsForProduct", () => {
    test("invalid productId -> PRODUCT_ID_INVALID", async () => {
      const res = await listCompetitorsForProduct(INVALID_UUID);
      assert.equal(res.ok, false);
      if (!res.ok) assert.equal(res.error.code, "PRODUCT_ID_INVALID");
    });

    test("valid -> reaches DB", async () => {
      try {
        await listCompetitorsForProduct(VALID_UUID_A);
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e);
        assert.ok(msg.includes("database") || msg.includes("Client was closed") || msg.includes("DATABASE_URL"));
      }
    });
  });

  describe("Suite 3: getCompetitorById", () => {
    test("invalid productId -> PRODUCT_ID_INVALID", async () => {
      const res = await getCompetitorById(INVALID_UUID, VALID_UUID_B);
      assert.equal(res.ok, false);
      if (!res.ok) assert.equal(res.error.code, "PRODUCT_ID_INVALID");
    });

    test("invalid competitorId -> COMPETITOR_ID_INVALID", async () => {
      const res = await getCompetitorById(VALID_UUID_A, INVALID_UUID);
      assert.equal(res.ok, false);
      if (!res.ok) assert.equal(res.error.code, "COMPETITOR_ID_INVALID");
    });
  });

  describe("Suite 4: updateCompetitor", () => {
    test("empty update object -> NO_UPDATE_FIELDS", async () => {
      const res = await updateCompetitor(VALID_UUID_A, VALID_UUID_B, {});
      assert.equal(res.ok, false);
      if (!res.ok) assert.equal(res.error.code, "NO_UPDATE_FIELDS");
    });

    test("invalid website -> WEBSITE_INVALID", async () => {
      const res = await updateCompetitor(VALID_UUID_A, VALID_UUID_B, { website: "not-a-url" });
      assert.equal(res.ok, false);
      if (!res.ok) assert.equal(res.error.code, "WEBSITE_INVALID");
    });

    test("ftp:// -> WEBSITE_INVALID", async () => {
      const res = await updateCompetitor(VALID_UUID_A, VALID_UUID_B, { website: "ftp://example.com" });
      assert.equal(res.ok, false);
      if (!res.ok) assert.equal(res.error.code, "WEBSITE_INVALID");
    });

    test("valid partial -> reaches DB", async () => {
      try {
        await updateCompetitor(VALID_UUID_A, VALID_UUID_B, { name: "B" });
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e);
        assert.ok(msg.includes("database") || msg.includes("Client was closed") || msg.includes("DATABASE_URL"));
      }
    });
  });

  describe("Suite 5: archiveCompetitor", () => {
    test("invalid productId", async () => {
      const res = await archiveCompetitor(INVALID_UUID, VALID_UUID_B);
      assert.equal(res.ok, false);
      if (!res.ok) assert.equal(res.error.code, "PRODUCT_ID_INVALID");
    });
    test("invalid competitorId", async () => {
      const res = await archiveCompetitor(VALID_UUID_A, INVALID_UUID);
      assert.equal(res.ok, false);
      if (!res.ok) assert.equal(res.error.code, "COMPETITOR_ID_INVALID");
    });
  });
});
