import type { AIConfig } from "./config.js";
import type { AIRequestOptions, AIResult, AIResponse } from "./types.js";

/**
 * The internal interface that all AI provider adapters must implement.
 */
export interface AIProvider {
  /**
   * Generates text based on the provided messages and options.
   *
   * @param request The request options including messages, model, and temperature.
   * @param config The validated AI configuration for this provider.
   * @returns An AIResult containing either the response or an error.
   */
  generate(
    request: AIRequestOptions,
    config: AIConfig,
  ): Promise<AIResult<AIResponse>>;
}
