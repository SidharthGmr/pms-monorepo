import { AttributeDto } from './attribute.dto';
import { ProductResponseDto } from './product.dto';

export interface DistributionDto {
  name: string;
  count: number;
  stock: number;
  percentage: number;
}

export interface DashboardSectionDto<T> {
  total: number;
  recent: T[];
}

export interface DashboardSummaryDto {
  products: ProductResponseDto[];
  attributes: AttributeDto[];
  todaySale: number;
  totalMonthSale: number;
  productDistribution: DistributionDto[];
}
