import "server-only";
import { env } from "../env.js";
import type { AIResult } from "./types.js";

export interface AIConfig {
  provider: "openai-compatible" | "ollama";
  model: string;
  apiKey?: string;
  baseUrl: string;
}

export function getAiConfig(): AIResult<AIConfig> {
  if (!env.AI_PROVIDER) {
    return {
      ok: false,
      error: {
        code: "PROVIDER_NOT_CONFIGURED",
        message: "AI provider is not configured.",
      },
    };
  }

  if (env.AI_PROVIDER !== "openai-compatible" && env.AI_PROVIDER !== "ollama") {
    return {
      ok: false,
      error: {
        code: "UNSUPPORTED_PROVIDER",
        message: `Unsupported provider: ${env.AI_PROVIDER}`,
      },
    };
  }

  if (!env.AI_MODEL) {
    return {
      ok: false,
      error: {
        code: "INVALID_CONFIG",
        message: "AI_MODEL is required when AI_PROVIDER is set.",
      },
    };
  }

  if (env.AI_BASE_URL) {
    const isHttp =
      env.AI_BASE_URL.startsWith("http://") ||
      env.AI_BASE_URL.startsWith("https://");
    if (!isHttp) {
      return {
        ok: false,
        error: {
          code: "INVALID_CONFIG",
          message: "AI_BASE_URL must be a valid http:// or https:// URL.",
        },
      };
    }
  }

  if (env.AI_PROVIDER === "openai-compatible") {
    if (!env.AI_API_KEY) {
      return {
        ok: false,
        error: {
          code: "INVALID_CONFIG",
          message: "AI_API_KEY is required for openai-compatible provider.",
        },
      };
    }
    return {
      ok: true,
      data: {
        provider: "openai-compatible",
        model: env.AI_MODEL,
        apiKey: env.AI_API_KEY,
        baseUrl: env.AI_BASE_URL || "https://api.openai.com",
      },
    };
  }

  if (env.AI_PROVIDER === "ollama") {
    return {
      ok: true,
      data: {
        provider: "ollama",
        model: env.AI_MODEL,
        baseUrl: env.AI_BASE_URL || "http://localhost:11434",
      },
    };
  }

  return {
    ok: false,
    error: { code: "UNKNOWN", message: "Unknown configuration error." },
  };
}
