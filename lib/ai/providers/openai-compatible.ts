import { z } from "zod";
import type { AIProvider } from "../provider.js";
import type { AIConfig } from "../config.js";
import type { AIRequestOptions, AIResult, AIResponse } from "../types.js";

const openAIResponseSchema = z.object({
  model: z.string().optional(),
  choices: z
    .array(
      z.object({
        message: z.object({
          role: z.string(),
          content: z.string().nullable(), // some providers return null if blocked/empty
        }),
      }),
    )
    .min(1),
  usage: z
    .object({
      prompt_tokens: z.number(),
      completion_tokens: z.number(),
      total_tokens: z.number(),
    })
    .optional(),
});

export const openAICompatibleProvider: AIProvider = {
  async generate(
    request: AIRequestOptions,
    config: AIConfig,
  ): Promise<AIResult<AIResponse>> {
    const controller = new AbortController();
    const timeoutMs = request.timeoutMs ?? 30000;
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      let url = config.baseUrl;
      if (!url.endsWith("/v1/chat/completions")) {
        url = url.replace(/\/+$/, "") + "/v1/chat/completions";
      }

      const payload = {
        model: request.model ?? config.model,
        messages: request.messages,
        ...(request.temperature !== undefined && {
          temperature: request.temperature,
        }),
      };

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${config.apiKey}`,
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      if (!response.ok) {
        return {
          ok: false,
          error: {
            code: "REQUEST_FAILED",
            message: `Provider responded with HTTP ${response.status} ${response.statusText}`,
          },
        };
      }

      const rawJson = await response.json();
      const parsed = openAIResponseSchema.safeParse(rawJson);

      if (!parsed.success) {
        return {
          ok: false,
          error: {
            code: "MALFORMED_RESPONSE",
            message: "Provider response did not match expected OpenAI format.",
            cause: parsed.error.issues,
          },
        };
      }

      const data = parsed.data;
      const content = data.choices[0].message.content || "";

      return {
        ok: true,
        data: {
          content,
          model: data.model,
          ...(data.usage && {
            usage: {
              promptTokens: data.usage.prompt_tokens,
              completionTokens: data.usage.completion_tokens,
              totalTokens: data.usage.total_tokens,
            },
          }),
        },
      };
    } catch (e: unknown) {
      if (e instanceof Error && e.name === "AbortError") {
        return {
          ok: false,
          error: {
            code: "PROVIDER_UNAVAILABLE",
            message: `Request timed out after ${timeoutMs}ms.`,
          },
        };
      }
      return {
        ok: false,
        error: {
          code: "PROVIDER_UNAVAILABLE",
          message: "Network error or provider unreachable.",
          cause: e,
        },
      };
    } finally {
      clearTimeout(timeoutId);
    }
  },
};
