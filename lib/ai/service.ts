import "server-only";

import type { AIRequestOptions, AIResult, AIResponse } from "./types.js";
import { getAiConfig } from "./config.js";
import { openAICompatibleProvider } from "./providers/openai-compatible.js";
import { ollamaProvider } from "./providers/ollama.js";

/**
 * Generates text using the currently configured AI provider.
 *
 * This function safely handles AI unavailable states and gracefully
 * returns typed errors if the provider is disabled, unconfigured,
 * or encounters a network issue. It never throws exceptions for
 * expected network/API errors.
 */
export async function generateText(
  request: AIRequestOptions,
): Promise<AIResult<AIResponse>> {
  const configResult = getAiConfig();

  if (!configResult.ok) {
    return { ok: false, error: configResult.error };
  }

  const config = configResult.data;

  try {
    if (config.provider === "openai-compatible") {
      return await openAICompatibleProvider.generate(request, config);
    }

    if (config.provider === "ollama") {
      return await ollamaProvider.generate(request, config);
    }

    return {
      ok: false,
      error: {
        code: "UNSUPPORTED_PROVIDER",
        message: `Configured provider '${config.provider}' does not have an adapter.`,
      },
    };
  } catch (e: unknown) {
    // Catch-all for any unexpected synchronous or unhandled asynchronous errors
    // from the provider implementation itself, ensuring the main app doesn't crash.
    return {
      ok: false,
      error: {
        code: "UNKNOWN",
        message: "An unexpected error occurred during AI generation.",
        cause: e,
      },
    };
  }
}
