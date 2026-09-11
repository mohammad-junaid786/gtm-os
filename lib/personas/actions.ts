"use server";

import { authorizeProductAction } from "@/lib/routing/authorize-action";
import {
  createPersona,
  getPersonasForIcp,
  updatePersona,
  archivePersona,
} from "@/lib/personas/service";
import type {
  CreatePersonaInput,
  PersonaResult,
  PersonaRow,
  UpdatePersonaInput,
} from "@/lib/personas/types";

// ---------------------------------------------------------------------------
// Server Actions
// ---------------------------------------------------------------------------

export async function loadPersonasAction(
  clientProductId: string,
  icpId: string,
): Promise<PersonaResult<PersonaRow[]>> {
  const auth = await authorizeProductAction(clientProductId);
  if (!auth.ok) return auth.result;

  return getPersonasForIcp(auth.productId, icpId);
}

export async function createPersonaAction(
  clientProductId: string,
  input: CreatePersonaInput,
): Promise<PersonaResult<PersonaRow>> {
  const auth = await authorizeProductAction(clientProductId);
  if (!auth.ok) return auth.result;

  return createPersona(auth.productId, input);
}

export async function updatePersonaAction(
  clientProductId: string,
  icpId: string,
  personaId: string,
  input: UpdatePersonaInput,
): Promise<PersonaResult<PersonaRow>> {
  const auth = await authorizeProductAction(clientProductId);
  if (!auth.ok) return auth.result;

  return updatePersona(auth.productId, icpId, personaId, input);
}

export async function archivePersonaAction(
  clientProductId: string,
  icpId: string,
  personaId: string,
): Promise<PersonaResult<PersonaRow>> {
  const auth = await authorizeProductAction(clientProductId);
  if (!auth.ok) return auth.result;

  return archivePersona(auth.productId, icpId, personaId);
}
