import { Status } from "../enum/status.enum";
import { PageFilterParams } from "./page.params";

export interface AttributeFilterParams extends PageFilterParams {
  status?: Status;
}
