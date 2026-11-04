import DropdownBasicDto from '@/types/dropdown-basic.dto';
import { DiscountTypeEnum } from '@pms/types';

const DiscountTypeData: DropdownBasicDto[] = [
  {
    value: '',
    label: 'No discount',
  },
  {
    value: DiscountTypeEnum.Percentage,
    label: 'Percentage (%)',
  },
  {
    value: DiscountTypeEnum.Flat,
    label: 'Flat (₹)',
  },
];

export default DiscountTypeData;
