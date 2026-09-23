import { Status } from "../enum/status.enum";

/**
 * The create/update request body, shared by the web form and the API.
 *
 * `storeCode` is deliberately absent - it always comes from the caller's token, never the
 * request body, so a client cannot move a brand into another store.
 */
export interface CreateBrandNameModel {
  name: string;
  images?: string[];
  status?: Status;
  displayOrder?: number | null;
}
