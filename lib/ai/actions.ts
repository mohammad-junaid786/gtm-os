"use server";

import { getAiConfig } from "./config";
import { extractJson } from "./utils";
import { z } from "zod";
import type { AIResult } from "./types";

import { _deps } from "./ai-deps";

/**
 * Returns a safe boolean indicating whether AI is configured on the server.
 * Never exposes API keys, base URLs, or provider choices to the client.
 */
export async function getAiAvailabilityAction(): Promise<{ isAiEnabled: boolean }> {
  const configResult = getAiConfig();
  return { isAiEnabled: configResult.ok };
}

const icpDraftSchema = z.object({
  name: z.string(),
  description: z.string().nullable().optional(),
  industry: z.string().nullable().optional(),
  company_size: z.string().nullable().optional(),
  geography: z.string().nullable().optional(),
  business_model: z.enum(["b2b", "b2c", "b2b2c", "marketplace"]).nullable().optional(),
  pain_points: z.array(z.string()).nullable().optional(),
  goals: z.array(z.string()).nullable().optional(),
  buying_signals: z.array(z.string()).nullable().optional(),
  disqualifiers: z.array(z.string()).nullable().optional(),
});

export type IcpDraft = z.infer<typeof icpDraftSchema>;

export async function generateIcpDraftAction(
  productId: string,
  prompt: string
): Promise<AIResult<IcpDraft>> {
  // 1. Authorize
  const auth = await _deps.authorizeProductAction(productId);
  if (!auth.ok) {
    return { ok: false, error: { code: "UNKNOWN", message: "Unauthorized product context" } };
  }

  // 2. Build prompt
  const systemPrompt = `You are a strategic Go-To-Market AI assistant.
Your task is to generate a draft Ideal Customer Profile (ICP) based on the user's input.
You must return ONLY valid JSON matching this schema:
{
  "name": "String",
  "description": "String",
  "industry": "String",
  "company_size": "String",
  "geography": "String",
  "business_model": "b2b" | "b2c" | "b2b2c" | "marketplace",
  "pain_points": ["String"],
  "goals": ["String"],
  "buying_signals": ["String"],
  "disqualifiers": ["String"]
}
Do not include any explanation or markdown outside of the JSON block.`;

  // 3. Call AI
  const result = await _deps.generateText({ messages: [{ role: "system", content: systemPrompt }, { role: "user", content: prompt }] });
  if (!result.ok) return result;

  // 4. Extract and validate
  const jsonStr = extractJson(result.data.content);
  if (!jsonStr) {
    return { ok: false, error: { code: "MALFORMED_RESPONSE", message: "Could not extract JSON from response" } };
  }

  let parsedJson;
  try {
    parsedJson = JSON.parse(jsonStr);
  } catch {
    return { ok: false, error: { code: "MALFORMED_RESPONSE", message: "JSON could not be parsed" } };
  }

  const parsed = icpDraftSchema.safeParse(parsedJson);
  if (!parsed.success) {
    return { ok: false, error: { code: "MALFORMED_RESPONSE", message: "JSON did not match the expected schema" } };
  }

  return { ok: true, data: parsed.data };
}

const personaDraftSchema = z.object({
  name: z.string(),
  role: z.string(),
  goals: z.array(z.string()).nullable().optional(),
  pain_points: z.array(z.string()).nullable().optional(),
  motivations: z.array(z.string()).nullable().optional(),
  objections: z.array(z.string()).nullable().optional(),
  decision_criteria: z.array(z.string()).nullable().optional(),
  preferred_channels: z.array(z.string()).nullable().optional(),
  messaging_angles: z.array(z.string()).nullable().optional(),
});

export type PersonaDraft = z.infer<typeof personaDraftSchema>;

export async function generatePersonaDraftAction(
  productId: string,
  icpId: string,
  prompt: string
): Promise<AIResult<PersonaDraft>> {
  // 1. Authorize Product
  const auth = await _deps.authorizeProductAction(productId);
  if (!auth.ok) {
    return { ok: false, error: { code: "UNKNOWN", message: "Unauthorized product context" } };
  }

  // 2. Fetch and Validate ICP Context
  const icpResult = await _deps.getIcpById(productId, icpId);
  
  if (!icpResult.ok) {
    return { ok: false, error: { code: "UNKNOWN", message: "Invalid or unauthorized ICP context" } };
  }

  const icp = icpResult.data;
  const icpContextStr = JSON.stringify({
    name: icp.name,
    description: icp.description,
    industry: icp.industry,
    business_model: icp.business_model,
    pain_points: icp.pain_points,
    goals: icp.goals
  }, null, 2);

  // 3. Build Prompt
  const systemPrompt = `You are a strategic Go-To-Market AI assistant.
Your task is to generate a draft Persona based on the user's input and the provided Ideal Customer Profile (ICP) context.
ICP Context:
${icpContextStr}

You must return ONLY valid JSON matching this schema:
{
  "name": "String",
  "role": "String",
  "goals": ["String"],
  "pain_points": ["String"],
  "motivations": ["String"],
  "objections": ["String"],
  "decision_criteria": ["String"],
  "preferred_channels": ["String"],
  "messaging_angles": ["String"]
}
Do not include any explanation or markdown outside of the JSON block.`;

  // 4. Call AI
  const result = await _deps.generateText({ messages: [{ role: "system", content: systemPrompt }, { role: "user", content: prompt }] });
  if (!result.ok) return result;

  // 5. Extract and Validate
  const jsonStr = extractJson(result.data.content);
  if (!jsonStr) {
    return { ok: false, error: { code: "MALFORMED_RESPONSE", message: "Could not extract JSON from response" } };
  }

  let parsedJson;
  try {
    parsedJson = JSON.parse(jsonStr);
  } catch {
    return { ok: false, error: { code: "MALFORMED_RESPONSE", message: "JSON could not be parsed" } };
  }

  const parsed = personaDraftSchema.safeParse(parsedJson);
  if (!parsed.success) {
    return { ok: false, error: { code: "MALFORMED_RESPONSE", message: "JSON did not match the expected schema" } };
  }

  return { ok: true, data: parsed.data };
}

const positioningDraftSchema = z.object({
  positioning_statement: z.string().nullable().optional(),
  target_customer: z.string().nullable().optional(),
  customer_problem: z.string().nullable().optional(),
  unique_value: z.string().nullable().optional(),
  alternatives: z.array(z.string()).nullable().optional(),
  proof_points: z.array(z.string()).nullable().optional(),
});

export type PositioningDraft = z.infer<typeof positioningDraftSchema>;

export async function generatePositioningDraftAction(
  productId: string,
  prompt: string,
  contextIds?: { icpId?: string; personaId?: string }
): Promise<AIResult<PositioningDraft>> {
  // 1. Authorize Product
  const auth = await _deps.authorizeProductAction(productId);
  if (!auth.ok) {
    return { ok: false, error: { code: "UNKNOWN", message: "Unauthorized product context" } };
  }

  // 2. Fetch Context Data (with validation)
  let contextStr = "";
  if (contextIds?.icpId) {
    const icpResult = await _deps.getIcpById(productId, contextIds.icpId);
    if (!icpResult.ok) {
      return { ok: false, error: { code: "UNKNOWN", message: "Invalid or unauthorized ICP context" } };
    }
    const icp = icpResult.data;
    contextStr += `\nICP Context:\n${JSON.stringify({
      name: icp.name,
      description: icp.description,
      pain_points: icp.pain_points,
      goals: icp.goals
    }, null, 2)}\n`;
  }

  if (contextIds?.personaId) {
    const p = await _deps.getPersonaContext(productId, contextIds.personaId);

    if (!p) {
      return { ok: false, error: { code: "UNKNOWN", message: "Invalid or unauthorized Persona context" } };
    }

    contextStr += `\nPersona Context:\n${JSON.stringify({
      name: p.name,
      role: p.role,
      pain_points: p.pain_points,
      goals: p.goals,
      objections: p.objections
    }, null, 2)}\n`;
  }

  // 3. Build Prompt
  const systemPrompt = `You are a strategic Go-To-Market AI assistant.
Your task is to generate draft Product Positioning based on the user's input and any provided context.
${contextStr}

You must return ONLY valid JSON matching this schema:
{
  "positioning_statement": "String",
  "target_customer": "String",
  "customer_problem": "String",
  "unique_value": "String",
  "alternatives": ["String"],
  "proof_points": ["String"]
}
Do not include any explanation or markdown outside of the JSON block.`;

  // 4. Call AI
  const result = await _deps.generateText({ messages: [{ role: "system", content: systemPrompt }, { role: "user", content: prompt }] });
  if (!result.ok) return result;

  // 5. Extract and Validate
  const jsonStr = extractJson(result.data.content);
  if (!jsonStr) {
    return { ok: false, error: { code: "MALFORMED_RESPONSE", message: "Could not extract JSON from response" } };
  }

  let parsedJson;
  try {
    parsedJson = JSON.parse(jsonStr);
  } catch {
    return { ok: false, error: { code: "MALFORMED_RESPONSE", message: "JSON could not be parsed" } };
  }

  const parsed = positioningDraftSchema.safeParse(parsedJson);
  if (!parsed.success) {
    return { ok: false, error: { code: "MALFORMED_RESPONSE", message: "JSON did not match the expected schema" } };
  }

  return { ok: true, data: parsed.data };
}

