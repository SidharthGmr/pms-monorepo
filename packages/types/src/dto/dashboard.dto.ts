import { Status } from '../enum/status.enum';

/** Raw rows as the dashboard query returns them - recent lists, not full response DTOs. */
export interface DashboardProductDto {
  id: number;
  name: string;
  slug: string;
  parentId?: number | null;
  categoryId: number;
  brandNameId?: number | null;
  attributeId?: number | null;
  description?: string | null;
  images: string[];
  storeCode: string;
  status: Status;
  displayOrder?: number | null;
  createdAt: Date | string;
  updatedAt?: Date | string | null;
  createdById: string;
  updatedById?: string | null;
}

export interface DashboardAttributeDto {
  id: number;
  name: string;
  unit?: string | null;
  storeCode: string;
  status: Status;
  displayOrder?: number | null;
  createdAt: Date | string;
  updatedAt?: Date | string | null;
}

export interface DashboardCategoryDto {
  id: number;
  name: string;
  description?: string | null;
  parentId?: number | null;
  storeCode: string;
  status: Status;
  displayOrder?: number | null;
  createdAt: Date | string;
  updatedAt?: Date | string | null;
}

export interface DashboardBrandDto {
  id: number;
  name: string;
  storeCode: string;
  status: Status;
  displayOrder?: number | null;
  createdAt: Date | string;
  updatedAt?: Date | string | null;
}

export interface DashboardCustomerDto {
  id: number;
  userId: string;
  name: string;
  email: string;
  phone?: string | null;
  isActive: boolean;
  createdAt: Date | string;
}

export interface DashboardStaffDto {
  id: number;
  userId: string;
  storeCode: string;
  position?: string | null;
  department?: string | null;
  isActive: boolean;
  createdAt: Date | string;
  user?: {
    name: string;
    email: string;
    phone?: string | null;
  };
}

/** Share of the catalog held by one category, for the distribution chart. */
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
  products: DashboardProductDto[];
  attributes: DashboardAttributeDto[];
  categories: DashboardCategoryDto[];
  brands: DashboardBrandDto[];
  customers: DashboardCustomerDto[];
  staff: DashboardStaffDto[];
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
