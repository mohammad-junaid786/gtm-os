/**
 * Tests for the Personas domain (lib/personas/).
 *
 * All tests are DB-free (no DATABASE_URL required). Validation and type checks
 * fire before getDb() is called.
 */
import { test, describe } from "node:test";
import assert from "node:assert/strict";

import {
  createPersona,
  getPersonasForIcp,
  updatePersona,
} from "./service.js";

// Static import of Server Actions.
import {
  loadPersonasAction,
  createPersonaAction,
  updatePersonaAction,
  archivePersonaAction,
} from "./actions.js";

// ---------------------------------------------------------------------------
// Shared fixtures
// ---------------------------------------------------------------------------

const VALID_UUID_A = "00000000-0000-0000-0000-000000000001";
const VALID_UUID_B = "00000000-0000-0000-0000-000000000002";
const VALID_UUID_C = "00000000-0000-0000-0000-000000000003";

function expectCode(result: { ok: boolean; error?: { code: string } }, code: string) {
  assert.equal(result.ok, false);
  assert.equal(
    result.error?.code,
    code,
    `Expected error code "${code}" but got "${result.error?.code}"`,
  );
}

// ---------------------------------------------------------------------------
// Suites
// ---------------------------------------------------------------------------

describe("createPersona", () => {
  test("fails if productId is not a UUID", async () => {
    const r = await createPersona("invalid", { icpId: VALID_UUID_A, name: "N", role: "R" });
    expectCode(r, "PRODUCT_ID_INVALID");
  });

  test("fails if icpId is not a UUID", async () => {
    const r = await createPersona(VALID_UUID_B, { icpId: "invalid", name: "N", role: "R" });
    expectCode(r, "ICP_ID_INVALID");
  });

  test("fails if name is empty", async () => {
    const r = await createPersona(VALID_UUID_B, { icpId: VALID_UUID_A, name: "  ", role: "R" });
    expectCode(r, "NAME_EMPTY");
  });

  test("fails if role is empty", async () => {
    const r = await createPersona(VALID_UUID_B, { icpId: VALID_UUID_A, name: "N", role: "  " });
    expectCode(r, "ROLE_EMPTY");
  });
});

describe("getPersonasForIcp", () => {
  test("fails if productId is not a UUID", async () => {
    const r = await getPersonasForIcp("invalid", VALID_UUID_A);
    expectCode(r, "PRODUCT_ID_INVALID");
  });

  test("fails if icpId is not a UUID", async () => {
    const r = await getPersonasForIcp(VALID_UUID_A, "invalid");
    expectCode(r, "ICP_ID_INVALID");
  });
});

describe("updatePersona", () => {
  test("fails if no fields are provided", async () => {
    const r = await updatePersona(VALID_UUID_A, VALID_UUID_B, VALID_UUID_C, {});
    expectCode(r, "NO_UPDATE_FIELDS");
  });

  test("fails if name is empty string", async () => {
    const r = await updatePersona(VALID_UUID_A, VALID_UUID_B, VALID_UUID_C, { name: "  " });
    expectCode(r, "NAME_EMPTY");
  });
});

describe("Server Action authorization model", () => {
  test(
    "loadPersonasAction returns a generic error when not authenticated (null userId)",
    async () => {
      const result = await loadPersonasAction(VALID_UUID_A, VALID_UUID_B);
      assert.equal(result.ok, false);
      const err = result as { ok: false; error: { code: string; message: string } };
      assert.equal(err.error.code, "UNKNOWN");
      assert.equal(err.error.message, "Not authorized.");
    },
  );

  test(
    "createPersonaAction returns a generic error when not authenticated (null userId)",
    async () => {
      const result = await createPersonaAction(VALID_UUID_A, { icpId: VALID_UUID_B, name: "N", role: "R" });
      assert.equal(result.ok, false);
      const err = result as { ok: false; error: { code: string; message: string } };
      assert.equal(err.error.code, "UNKNOWN");
      assert.equal(err.error.message, "Not authorized.");
    },
  );

  test(
    "updatePersonaAction returns a generic error when not authenticated (null userId)",
    async () => {
      const result = await updatePersonaAction(VALID_UUID_A, VALID_UUID_B, VALID_UUID_C, { name: "Updated" });
      assert.equal(result.ok, false);
      const err = result as { ok: false; error: { code: string; message: string } };
      assert.equal(err.error.code, "UNKNOWN");
      assert.equal(err.error.message, "Not authorized.");
    },
  );

  test(
    "archivePersonaAction returns a generic error when not authenticated (null userId)",
    async () => {
      const result = await archivePersonaAction(VALID_UUID_A, VALID_UUID_B, VALID_UUID_C);
      assert.equal(result.ok, false);
      const err = result as { ok: false; error: { code: string; message: string } };
      assert.equal(err.error.code, "UNKNOWN");
      assert.equal(err.error.message, "Not authorized.");
    },
  );
});
