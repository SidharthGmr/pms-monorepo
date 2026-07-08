export interface BrandNameDto {
  id: number;
  name: string;
  status: string;
  displayOrder?: number | null;
  createdAt: Date;
  updatedAt: Date | null;
}
