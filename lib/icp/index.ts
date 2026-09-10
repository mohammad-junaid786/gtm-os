/**
 * Public API surface of the ICP domain module.
 *
 * Service functions are server-only (via service.ts import "server-only").
 * Types have no server-only restriction and may be imported anywhere.
 */
export {
  createIcp,
  getIcpById,
  getIcpsForProduct,
  updateIcp,
  archiveIcp,
} from "./service";

export type {
  CreateIcpInput,
  UpdateIcpInput,
  IcpRow,
  IcpResult,
  IcpServiceError,
  BusinessModel,
} from "./types";

export { BUSINESS_MODELS } from "./types";
