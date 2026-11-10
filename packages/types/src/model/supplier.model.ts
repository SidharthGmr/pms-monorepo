import { Status } from '../enum/status.enum';

export interface CreateSupplierModel {
  name: string;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  /** The supplier's GST registration; its first two digits decide IGST vs CGST+SGST on their bills. */
  gstin?: string | null;
  stateCode?: string | null;
  status: Status;
  displayOrder?: number | null;
}

export interface UpdateSupplierModel extends Partial<CreateSupplierModel> {}
