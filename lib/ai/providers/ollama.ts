import { z } from "zod";
import type { AIProvider } from "../provider";
import type { AIConfig } from "../config";
import type { AIRequestOptions, AIResult, AIResponse } from "../types";

const ollamaResponseSchema = z.object({
  model: z.string(),
  message: z.object({
    role: z.string(),
    content: z.string(),
  }),
  done: z.boolean(),
  prompt_eval_count: z.number().optional(),
  eval_count: z.number().optional(),
});

export const ollamaProvider: AIProvider = {
  async generate(
    request: AIRequestOptions,
    config: AIConfig,
  ): Promise<AIResult<AIResponse>> {
    const controller = new AbortController();
    const timeoutMs = request.timeoutMs ?? 30000;
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      let url = config.baseUrl;
      if (!url.endsWith("/api/chat")) {
        url = url.replace(/\/+$/, "") + "/api/chat";
      }

      const payload = {
        model: request.model ?? config.model,
        messages: request.messages,
        stream: false,
        options: {
          ...(request.temperature !== undefined && {
            temperature: request.temperature,
          }),
        },
      };

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
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
      const parsed = ollamaResponseSchema.safeParse(rawJson);

      if (!parsed.success) {
        return {
          ok: false,
          error: {
            code: "MALFORMED_RESPONSE",
            message: "Provider response did not match expected Ollama format.",
            cause: parsed.error.issues,
          },
        };
      }

      const data = parsed.data;

      // Calculate total tokens if usage is available
      let usage;
      if (
        data.prompt_eval_count !== undefined &&
        data.eval_count !== undefined
      ) {
        usage = {
          promptTokens: data.prompt_eval_count,
          completionTokens: data.eval_count,
          totalTokens: data.prompt_eval_count + data.eval_count,
        };
      }

      return {
        ok: true,
        data: {
          content: data.message.content,
          model: data.model,
          ...(usage && { usage }),
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
