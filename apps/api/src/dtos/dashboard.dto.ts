import { AttributeDto } from './attribute.dto';
import { ProductResponseDto } from '@pms/types';

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
  categories: any[];
  brands: any[];
  customers: any[];
  staff: any[];
  productTotal: number;
  attributeTotal: number;
  categoryTotal: number;
  brandTotal: number;
  customerTotal: number;
  staffTotal: number;
  todaySale: number;
  totalMonthSale: number;
  todayPurchase: number;
  totalMonthPurchase: number;
  todayOrderCount: number;
  totalMonthOrderCount: number;
  productDistribution: DistributionDto[];
}
