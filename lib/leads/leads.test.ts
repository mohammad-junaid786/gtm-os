import { test, describe } from "node:test";
import assert from "node:assert/strict";

import { createLead, getLeadsForProduct, updateLead } from "./service.js";
import { loadLeadsAction, createLeadAction, updateLeadAction, archiveLeadAction } from "./actions.js";

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

describe("createLead", () => {
  test("fails if productId is not a UUID", async () => {
    const r = await createLead("invalid", { company: "C", contact: "C" });
    expectCode(r, "PRODUCT_ID_INVALID");
  });

  test("fails if company is empty", async () => {
    const r = await createLead(VALID_UUID_A, { company: "   ", contact: "C" });
    expectCode(r, "COMPANY_EMPTY");
  });

  test("fails if contact is empty", async () => {
    const r = await createLead(VALID_UUID_A, { company: "C", contact: "   " });
    expectCode(r, "CONTACT_EMPTY");
  });
});

describe("getLeadsForProduct", () => {
  test("fails if productId is not a UUID", async () => {
    const r = await getLeadsForProduct("invalid");
    expectCode(r, "PRODUCT_ID_INVALID");
  });
});

describe("updateLead", () => {
  test("fails if productId is not a UUID", async () => {
    const r = await updateLead("invalid", VALID_UUID_B, { company: "C" });
    expectCode(r, "PRODUCT_ID_INVALID");
  });

  test("fails if no fields are provided", async () => {
    const r = await updateLead(VALID_UUID_A, VALID_UUID_B, {});
    expectCode(r, "NO_UPDATE_FIELDS");
  });

  test("fails if company is empty string", async () => {
    const r = await updateLead(VALID_UUID_A, VALID_UUID_B, { company: "  " });
    expectCode(r, "COMPANY_EMPTY");
  });
});

describe("Server Action authorization model", () => {
  test("loadLeadsAction returns a generic error when not authenticated", async () => {
    const result = await loadLeadsAction(VALID_UUID_A);
    assert.equal(result.ok, false);
    const err = result as { ok: false; error: { code: string; message: string } };
    assert.equal(err.error.code, "UNKNOWN");
    assert.equal(err.error.message, "Not authorized.");
  });

  test("createLeadAction returns a generic error when not authenticated", async () => {
    const result = await createLeadAction(VALID_UUID_A, { company: "C", contact: "C" });
    assert.equal(result.ok, false);
    const err = result as { ok: false; error: { code: string; message: string } };
    assert.equal(err.error.code, "UNKNOWN");
    assert.equal(err.error.message, "Not authorized.");
  });

  test("updateLeadAction returns a generic error when not authenticated", async () => {
    const result = await updateLeadAction(VALID_UUID_A, VALID_UUID_B, { company: "C" });
    assert.equal(result.ok, false);
    const err = result as { ok: false; error: { code: string; message: string } };
    assert.equal(err.error.code, "UNKNOWN");
    assert.equal(err.error.message, "Not authorized.");
  });

  test("archiveLeadAction returns a generic error when not authenticated", async () => {
    const result = await archiveLeadAction(VALID_UUID_A, VALID_UUID_B);
    assert.equal(result.ok, false);
    const err = result as { ok: false; error: { code: string; message: string } };
    assert.equal(err.error.code, "UNKNOWN");
    assert.equal(err.error.message, "Not authorized.");
  });
});
