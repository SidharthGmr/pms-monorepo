export interface BrandNameDto {
  id: number;
  name: string;
  /** Optional logo. Same array shape as `product.images`. */
  images?: string[];
  status: string;
  displayOrder?: number | null;
  createdAt: Date;
  updatedAt: Date | null;
}
