import { PageStatus } from "../enum/page-status.enum";
import { PageFilterParams } from "./page.params";

export interface CmsPageFilterParams extends PageFilterParams {
  /** Omitted means every status. */
  status?: PageStatus | null;
}
