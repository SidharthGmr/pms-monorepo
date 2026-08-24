import { Status } from "../enum/status.enum";

// `storeCode` is deliberately absent - it always comes from the caller's token, never the
// request body, so a client cannot move a category into another store.
export interface CategoryModel {
  name: string;
  description?: string | null;
  /** Optional tile art. Same array shape as `product.images`. */
  images?: string[];
  parentId?: number | null;
  status: Status;
  displayOrder?: number;
  metadata?: Record<string, unknown> | null;
}
