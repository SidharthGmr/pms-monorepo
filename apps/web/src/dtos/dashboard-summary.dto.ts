export interface DashboardProductDto {
  id: number;
  name: string;
  brandNameId: number;
  slug: string;
  description: string;
  sku: string;
  price: number;
  cost: number;
  stock: number;
  lowStockThreshold: number;
  categoryId: number;
  images: string[];
  storeId: number | null;
  status: string;
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
  createdById: number;
  updatedById: number | null;
}

export interface DashboardAttributeDto {
  id: number;
  name: string;
  unit: string;
  status: string;
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface DashboardProductVariantDto {
  id: number;
  productId: number;
  brandName: string;
  varient: string | null;
  size: string;
  material: string;
  voltage: string;
  color: string;
  extraSku: string;
  extraPrice: number;
  stock: number;
  isDefault: boolean;
  status: string;
  displayOrder: number;
}

export interface DashboardProductAttributeDto {
  id: number;
  productId: number;
  attributeId: number;
  value: string;
  status: string;
  displayOrder: number;
}

export interface DistributionDto {
  name: string;
  count: number;
  stock: number;
  percentage: number;
}

// export interface DashboardSummaryDto {
//   products: {
//     total: number;
//     recent: DashboardProductDto[];
//   };
//   attributes: {
//     total: number;
//     recent: DashboardAttributeDto[];
//   };
//   todaySale: number;
//   totalMonthSale: number;
//   totalStock: number;
//   productDistribution?: DistributionDto[];
// }


export interface DashboardSummaryDto {
  products: Products[]
  attributes: Attributes[]
  categories: Categories[]
  brands: Brands[]
  customers: Customers[]
  staff: Staff[]
  productTotal: number
  attributeTotal: number
  categoryTotal: number
  brandTotal: number
  customerTotal: number
  staffTotal: number
  todaySale: number
  totalMonthSale: number
  todayPurchase: number
  totalMonthPurchase: number
  todayOrderCount: number
  totalMonthOrderCount: number
  productDistribution: ProductDistribution[]
}

export interface Products {
  id: number
  name: string
  parentId?: number
  categoryId: number
  brandNameId: number
  attributeId: number
  slug: string
  description?: string
  price: number
  cost: number
  stock: number
  lowStockThreshold: number
  images: string[]
  storeCode: string
  status: string
  displayOrder: number
  createdAt: string
  updatedAt: string
  createdById: string
  updatedById?: string
}


export interface Attributes {
  id: number
  name: string
  unit?: string
  storeCode: string
  status: string
  displayOrder?: number
  createdAt: string
  updatedAt: string
}



export interface ProductDistribution {
  name: string
  count: number
  stock: number;
  percentage: number
}

export interface Categories {
  id: number
  name: string
  description?: string | null
  parentId?: number | null
  storeCode: string
  status: string
  displayOrder?: number
  createdAt: string
  updatedAt: string
}

export interface Brands {
  id: number
  name: string
  storeCode: string
  status: string
  displayOrder?: number
  createdAt: string
  updatedAt: string
}

export interface Customers {
  id: number
  userId: string
  name: string
  email: string
  phone?: string | null
  isActive: boolean
  createdAt: string
}

export interface Staff {
  id: number
  userId: string
  storeCode: string
  position?: string | null
  department?: string | null
  isActive: boolean
  createdAt: string
  user?: {
    name: string
    email: string
    phone?: string | null
  }
}
