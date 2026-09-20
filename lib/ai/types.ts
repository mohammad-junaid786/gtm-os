

// ---------------------------------------------------------------------------
// Error types
// ---------------------------------------------------------------------------

export type AIServiceError =
  | { code: "PROVIDER_NOT_CONFIGURED"; message: string }
  | { code: "INVALID_CONFIG"; message: string }
  | { code: "PROVIDER_UNAVAILABLE"; message: string; cause?: unknown }
  | { code: "REQUEST_FAILED"; message: string }
  | { code: "MALFORMED_RESPONSE"; message: string; cause?: unknown }
  | { code: "UNSUPPORTED_PROVIDER"; message: string }
  | { code: "UNKNOWN"; message: string; cause?: unknown };

export type AIResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: AIServiceError };

// ---------------------------------------------------------------------------
// Messaging Contracts
// ---------------------------------------------------------------------------

export interface AIMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface AIRequestOptions {
  messages: AIMessage[];
  /** Optional temperature override (0.0 to 1.0) */
  temperature?: number;
  /** Optional model override (defaults to config model) */
  model?: string;
  /** Timeout in milliseconds (defaults to provider's default) */
  timeoutMs?: number;
}

export interface AIUsageStats {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

export interface AIResponse {
  content: string;
  /** The model exactly as returned by the provider */
  model?: string;
  usage?: AIUsageStats;
}
