import test, { describe, mock, beforeEach } from "node:test";
import assert from "node:assert";
import { extractJson } from "./utils";
import * as actions from "./actions";

const VALID_UUID_A = "00000000-0000-0000-0000-00000000000a";
const VALID_UUID_B = "00000000-0000-0000-0000-00000000000b";

describe("extractJson (Deterministic Extractor)", () => {
  test("extracts fenced markdown JSON correctly", () => {
    const raw = "```json\n { \"name\": \"test\" } \n```";
    assert.equal(extractJson(raw), '{ "name": "test" }');
  });

  test("extracts bare JSON using brace matching depth", () => {
    const raw = "Here is the result:\n{ \"name\": \"test\", \"nested\": {} }\nHope this helps!";
    assert.equal(extractJson(raw), '{ "name": "test", "nested": {} }');
  });

  test("returns null if braces never close", () => {
    const raw = "Here is { \"name\": \"test\" ";
    assert.equal(extractJson(raw), null);
  });
});

describe("generateIcpDraftAction", () => {
  let authMock: ReturnType<typeof mock.method>;
  let aiMock: ReturnType<typeof mock.method>;

  beforeEach(() => {
    mock.restoreAll();
    authMock = mock.method(actions._deps, "authorizeProductAction", async () => ({
      ok: true,
      value: { userId: "user-1", workspaceId: VALID_UUID_A, productId: VALID_UUID_A },
    }));
    aiMock = mock.method(actions._deps, "generateText", async () => ({
      ok: true,
      data: { text: '{"name":"AI ICP"}' },
      usage: {},
    }));
  });

  test("rejects unauthorized product", async () => {
    authMock.mock.mockImplementation(async () => ({
      ok: false,
      error: { code: "UNAUTHORIZED", message: "Unauthorized" },
    }));

    const result = await actions.generateIcpDraftAction(VALID_UUID_A, "prompt");
    assert.equal(result.ok, false);
    if (!result.ok) assert.equal(result.error.code, "UNKNOWN");
  });

  test("returns MALFORMED_RESPONSE for invalid json", async () => {
    aiMock.mock.mockImplementation(async () => ({
      ok: true,
      data: { text: "No JSON here" },
      usage: {},
    }));

    const result = await actions.generateIcpDraftAction(VALID_UUID_A, "prompt");
    assert.equal(result.ok, false);
    if (!result.ok) assert.equal(result.error.code, "MALFORMED_RESPONSE");
  });

  test("returns parsed draft without mutating DB", async () => {
    const result = await actions.generateIcpDraftAction(VALID_UUID_A, "prompt");
    assert.equal(result.ok, true);
    if (result.ok) assert.equal(result.data.name, "AI ICP");
  });
});

describe("generatePersonaDraftAction", () => {
  let _authMock: ReturnType<typeof mock.method>;
  let _aiMock: ReturnType<typeof mock.method>;
  let _icpMock: ReturnType<typeof mock.method>;

  beforeEach(() => {
    mock.restoreAll();
    _authMock = mock.method(actions._deps, "authorizeProductAction", async () => ({
      ok: true,
      value: { userId: "user-1", workspaceId: VALID_UUID_A, productId: VALID_UUID_A },
    }));
    _icpMock = mock.method(actions._deps, "getIcpById", async (prodId: string, icpId: string) => {
      if (prodId !== VALID_UUID_A || icpId !== VALID_UUID_B) return { ok: false };
      return { ok: true, value: { name: "Existing ICP" } as unknown as import("@/lib/icp/types").IcpRow };
    });
    _aiMock = mock.method(actions._deps, "generateText", async () => ({
      ok: true,
      data: { text: '{"name":"AI Persona", "role":"Manager"}' },
      usage: {},
    }));
  });

  test("rejects cross-product ICP context", async () => {
    const result = await actions.generatePersonaDraftAction(VALID_UUID_A, "other-icp-id", "prompt");
    assert.equal(result.ok, false);
    if (!result.ok) assert.equal(result.error.message.includes("unauthorized") || result.error.message.includes("Invalid"), true);
  });

  test("returns parsed draft on successful context injection", async () => {
    const result = await actions.generatePersonaDraftAction(VALID_UUID_A, VALID_UUID_B, "prompt");
    assert.equal(result.ok, true);
    if (result.ok) assert.equal(result.data.name, "AI Persona");
  });
});

describe("generatePositioningDraftAction", () => {
  let _authMock: ReturnType<typeof mock.method>;
  let _aiMock: ReturnType<typeof mock.method>;
  let _icpMock: ReturnType<typeof mock.method>;
  let _personaMock: ReturnType<typeof mock.method>;

  beforeEach(() => {
    mock.restoreAll();
    _authMock = mock.method(actions._deps, "authorizeProductAction", async () => ({
      ok: true,
      value: { userId: "user-1", workspaceId: VALID_UUID_A, productId: VALID_UUID_A },
    }));
    _icpMock = mock.method(actions._deps, "getIcpById", async (prodId: string, icpId: string) => {
      if (prodId !== VALID_UUID_A || icpId !== VALID_UUID_B) return { ok: false };
      return { ok: true, value: { name: "Existing ICP" } as unknown as import("@/lib/icp/types").IcpRow };
    });
    _personaMock = mock.method(actions._deps, "getPersonaContext", async (prodId: string, personaId: string) => {
      if (prodId !== VALID_UUID_A || personaId !== "persona-1") return null;
      return { name: "Existing Persona" };
    });
    _aiMock = mock.method(actions._deps, "generateText", async () => ({
      ok: true,
      data: { text: '{"positioning_statement":"AI Positioning"}' },
      usage: {},
    }));
  });

  test("rejects cross-product ICP context", async () => {
    const result = await actions.generatePositioningDraftAction(VALID_UUID_A, "prompt", { icpId: "bad-icp" });
    assert.equal(result.ok, false);
    if (!result.ok) assert.equal(result.error.message.includes("unauthorized") || result.error.message.includes("Invalid"), true);
  });

  test("returns parsed draft on successful context injection", async () => {
    const result = await actions.generatePositioningDraftAction(VALID_UUID_A, "prompt", { icpId: VALID_UUID_B, personaId: "persona-1" });
    assert.equal(result.ok, true);
    if (result.ok) assert.equal(result.data.positioning_statement, "AI Positioning");
  });
});
