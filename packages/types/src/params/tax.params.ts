import { TaxCategory } from "../enum/tax.enum";
import { PageFilterParams } from "./page.params";

export interface TaxFilterParams extends PageFilterParams {
  category?: TaxCategory;
  isActive?: boolean;
}
