import { Status } from "../enum/status.enum";
import { PageFilterParams } from "./page.params";

export interface BrandNameFilterParams extends PageFilterParams {
  /** Omitted means "everything except Trash"; pass a value to select one bucket. */
  status?: Status | null;
  categoryIds?: number[];
  sortOrder?: 'asc' | 'desc';
}
