import { Status } from "../enum/status.enum";
import { PageFilterParams } from "./page.params";

export interface AttributeFilterParams extends PageFilterParams {
  /** Omitted or null means "everything except Trash"; pass a value to select one bucket. */
  status?: Status | null;
}
