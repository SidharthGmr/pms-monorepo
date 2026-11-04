import { TaxCategory } from "../enum/tax.enum";

export interface TaxModel {
  name: string;
  code: string;
  rate: number;
  category?: TaxCategory;
  isActive?: boolean;
  isDefault?: boolean;
}
