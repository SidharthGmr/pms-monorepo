export interface SupplierDto {
  id: number;
  name: string;
  contactPerson?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  notes?: string | null;
  status: string;
  displayOrder?: number | null;
  createdAt: Date;
  updatedAt: Date | null;
}
