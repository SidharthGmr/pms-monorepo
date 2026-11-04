import { TaxCategory } from "../enum/tax.enum";

export interface TaxDto {
  id: string;
  name: string;
  code: string;
  rate: number;
  category: TaxCategory;
  isActive: boolean;
  isDefault: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
}
