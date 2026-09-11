/**
 * Public API surface of the Personas domain module.
 *
 * Service functions are server-only (via service.ts import "server-only").
 * Types have no server-only restriction and may be imported anywhere.
 */
export {
  createPersona,
  getPersonasForIcp,
  updatePersona,
  archivePersona,
} from "./service";

export type {
  CreatePersonaInput,
  UpdatePersonaInput,
  PersonaRow,
  PersonaResult,
  PersonaServiceError,
} from "./types";
