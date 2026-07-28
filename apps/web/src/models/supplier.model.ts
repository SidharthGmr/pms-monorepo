export interface CreateSupplierModel {
  name: string;
  contactPerson?: string | null;
  email: string;
  phone: string;
  address?: string | null;
  notes?: string | null;
  status: string;
  displayOrder?: number | null;
}
