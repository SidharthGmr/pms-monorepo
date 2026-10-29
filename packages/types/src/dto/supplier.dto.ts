import { Status } from '../enum/status.enum';

export interface SupplierDto {
  id: number;
  name: string;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  storeCode: string;
  status: Status;
  displayOrder?: number | null;
  createdAt: Date | string;
  updatedAt: Date | string | null;
}

export interface CreateSupplierDto {
  name: string;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  storeCode: string;
  status: Status;
  displayOrder?: number | null;
}
