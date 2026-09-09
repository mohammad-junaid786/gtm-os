/**
 * Public API surface of the product domain module.
 *
 * Service functions are server-only (via service.ts import "server-only").
 * Types have no server-only restriction and may be imported anywhere.
 */
export {
  createProduct,
  getProductById,
  getProductsForWorkspace,
  updateProduct,
  archiveProduct,
} from "./service";

export type {
  CreateProductInput,
  UpdateProductInput,
  ProductRow,
  ProductResult,
  ProductServiceError,
} from "./types";
