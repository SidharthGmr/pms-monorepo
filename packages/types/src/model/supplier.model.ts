import { Status } from '../enum/status.enum';

export interface CreateSupplierModel {
  name: string;
  contactPerson?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  notes?: string | null;
  status: Status;
  displayOrder?: number | null;
}

export interface UpdateSupplierModel extends Partial<CreateSupplierModel> {}
