import { test, describe, mock, before, after, beforeEach } from "node:test";
import assert from "node:assert/strict";

import { env } from "../env";
import { getAiConfig } from "./config";
import { generateText } from "./service";
import type { AIRequestOptions } from "./types";

const DUMMY_REQUEST: AIRequestOptions = {
  messages: [{ role: "user", content: "Hello" }],
};

describe("AI Configuration", () => {
  beforeEach(() => {
    delete env.AI_PROVIDER;
    delete env.AI_MODEL;
    delete env.AI_API_KEY;
    delete env.AI_BASE_URL;
  });

  test("Missing provider -> PROVIDER_NOT_CONFIGURED", () => {
    const res = getAiConfig();
    assert.equal(res.ok, false);
    if (!res.ok) assert.equal(res.error.code, "PROVIDER_NOT_CONFIGURED");
  });

  test("Unsupported provider -> UNSUPPORTED_PROVIDER", () => {
    env.AI_PROVIDER = "magic";
    const res = getAiConfig();
    assert.equal(res.ok, false);
    if (!res.ok) assert.equal(res.error.code, "UNSUPPORTED_PROVIDER");
  });

  test("Missing model -> INVALID_CONFIG", () => {
    env.AI_PROVIDER = "ollama";
    const res = getAiConfig();
    assert.equal(res.ok, false);
    if (!res.ok) assert.equal(res.error.code, "INVALID_CONFIG");
  });

  test("Invalid HTTP URL -> INVALID_CONFIG", () => {
    env.AI_PROVIDER = "ollama";
    env.AI_MODEL = "llama3";
    env.AI_BASE_URL = "ftp://localhost:11434";
    const res = getAiConfig();
    assert.equal(res.ok, false);
    if (!res.ok) assert.equal(res.error.code, "INVALID_CONFIG");
  });

  test("Ollama valid config (no API key required)", () => {
    env.AI_PROVIDER = "ollama";
    env.AI_MODEL = "llama3";
    const res = getAiConfig();
    assert.equal(res.ok, true);
    if (res.ok) assert.equal(res.data.provider, "ollama");
  });

  test("OpenAI-compatible missing API key -> INVALID_CONFIG", () => {
    env.AI_PROVIDER = "openai-compatible";
    env.AI_MODEL = "gpt-4";
    const res = getAiConfig();
    assert.equal(res.ok, false);
    if (!res.ok) assert.equal(res.error.code, "INVALID_CONFIG");
  });

  test("OpenAI-compatible valid config", () => {
    env.AI_PROVIDER = "openai-compatible";
    env.AI_MODEL = "gpt-4";
    env.AI_API_KEY = "test-key";
    const res = getAiConfig();
    assert.equal(res.ok, true);
    if (res.ok) assert.equal(res.data.provider, "openai-compatible");
  });
});

describe("AI Service Provider Logic", () => {
  let fetchMock: ReturnType<typeof mock.method>;

  before(() => {
    fetchMock = mock.method(globalThis, "fetch", async () => {
      return new Response(JSON.stringify({}), { status: 200 });
    });
  });

  after(() => {
    fetchMock.mock.restore();
  });

  beforeEach(() => {
    delete env.AI_PROVIDER;
    delete env.AI_MODEL;
    delete env.AI_API_KEY;
    delete env.AI_BASE_URL;
  });

  function setFetchMock(handler: () => Promise<Response>) {
    fetchMock.mock.mockImplementation(handler);
  }

  describe("OpenAI-Compatible Adapter", () => {
    beforeEach(() => {
      env.AI_PROVIDER = "openai-compatible";
      env.AI_MODEL = "gpt-4";
      env.AI_API_KEY = "test-key";
    });

    test("Successful generation", async () => {
      setFetchMock(async () =>
        new Response(
          JSON.stringify({
            model: "gpt-4",
            choices: [{ message: { role: "assistant", content: "Hi!" } }],
            usage: { prompt_tokens: 10, completion_tokens: 20, total_tokens: 30 },
          }),
          { status: 200 }
        )
      );

      const res = await generateText(DUMMY_REQUEST);
      assert.equal(res.ok, true);
      if (res.ok) {
        assert.equal(res.data.content, "Hi!");
        assert.equal(res.data.usage?.totalTokens, 30);
      }
    });

    test("Malformed response -> MALFORMED_RESPONSE", async () => {
      setFetchMock(async () =>
        new Response(JSON.stringify({ bad: "data" }), { status: 200 })
      );

      const res = await generateText(DUMMY_REQUEST);
      assert.equal(res.ok, false);
      if (!res.ok) assert.equal(res.error.code, "MALFORMED_RESPONSE");
    });

    test("HTTP 500 Error -> REQUEST_FAILED", async () => {
      setFetchMock(async () =>
        new Response("Internal Server Error", { status: 500, statusText: "Internal Server Error" })
      );

      const res = await generateText(DUMMY_REQUEST);
      assert.equal(res.ok, false);
      if (!res.ok) assert.equal(res.error.code, "REQUEST_FAILED");
    });
  });

  describe("Ollama Adapter", () => {
    beforeEach(() => {
      env.AI_PROVIDER = "ollama";
      env.AI_MODEL = "llama3";
    });

    test("Successful generation", async () => {
      setFetchMock(async () =>
        new Response(
          JSON.stringify({
            model: "llama3",
            message: { role: "assistant", content: "Ollama says hi!" },
            done: true,
            prompt_eval_count: 5,
            eval_count: 10,
          }),
          { status: 200 }
        )
      );

      const res = await generateText(DUMMY_REQUEST);
      assert.equal(res.ok, true);
      if (res.ok) {
        assert.equal(res.data.content, "Ollama says hi!");
        assert.equal(res.data.usage?.totalTokens, 15);
      }
    });

    test("Malformed response -> MALFORMED_RESPONSE", async () => {
      setFetchMock(async () =>
        new Response(JSON.stringify({ not: "expected" }), { status: 200 })
      );

      const res = await generateText(DUMMY_REQUEST);
      assert.equal(res.ok, false);
      if (!res.ok) assert.equal(res.error.code, "MALFORMED_RESPONSE");
    });
  });

  describe("Timeouts and Connectivity", () => {
    beforeEach(() => {
      env.AI_PROVIDER = "ollama";
      env.AI_MODEL = "llama3";
    });

    test("AbortError -> PROVIDER_UNAVAILABLE", async () => {
      setFetchMock(async () => {
        const err = new Error("The operation was aborted");
        err.name = "AbortError";
        throw err;
      });

      const res = await generateText(DUMMY_REQUEST);
      assert.equal(res.ok, false);
      if (!res.ok) assert.equal(res.error.code, "PROVIDER_UNAVAILABLE");
    });

    test("Other connection error -> PROVIDER_UNAVAILABLE", async () => {
      setFetchMock(async () => {
        throw new TypeError("fetch failed");
      });

      const res = await generateText(DUMMY_REQUEST);
      assert.equal(res.ok, false);
      if (!res.ok) assert.equal(res.error.code, "PROVIDER_UNAVAILABLE");
    });
  });
});
