/**
 * Safely extracts a JSON string from an LLM response.
 * 
 * 1. First attempts to extract content from a fenced ```json ... ``` block.
 * 2. If not found, deterministically extracts the first JSON object by matching the brace depth,
 *    preventing surrounding text or multiple appended objects from breaking standard JSON parsing.
 */
export function extractJson(raw: string): string | null {
  const trimmed = raw.trim();

  // 1. Check for markdown fenced blocks
  const fenceRegex = /```(?:json)?\s*([\s\S]*?)```/i;
  const match = trimmed.match(fenceRegex);
  if (match && match[1]) {
    return match[1].trim();
  }

  // 2. Deterministic brace matching for bare JSON
  const startIdx = trimmed.indexOf("{");
  if (startIdx === -1) {
    return null;
  }

  let depth = 0;
  for (let i = startIdx; i < trimmed.length; i++) {
    if (trimmed[i] === "{") depth++;
    else if (trimmed[i] === "}") depth--;

    if (depth === 0) {
      return trimmed.slice(startIdx, i + 1);
    }
  }

  // Never closed
  return null;
}
