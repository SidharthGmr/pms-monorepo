import DropdownBasicDto from '@/types/dropdown-basic.dto';
import { TaxCategoryEnum, TaxTypeEnum } from '@pms/types';

const TaxTypeData: DropdownBasicDto[] = [
  {
    value: TaxTypeEnum.WithTax,
    label: 'With Tax',
  },
  {
    value: TaxTypeEnum.WithoutTax,
    label: 'Without Tax',
  },
];

export default TaxTypeData;

export const TaxCategoryData: DropdownBasicDto[] = [
  {
    value: TaxCategoryEnum.Taxable,
    label: 'Taxable',
  },
  {
    value: TaxCategoryEnum.Exempt,
    label: 'Exempt',
  },
  {
    value: TaxCategoryEnum.ZeroRated,
    label: 'Zero Rated',
  },
  {
    value: TaxCategoryEnum.NonGst,
    label: 'Non GST',
  },
];

export const TAX_CATEGORY_LABELS: Record<string, string> = Object.fromEntries(TaxCategoryData.map((item) => [String(item.value), item.label]));
