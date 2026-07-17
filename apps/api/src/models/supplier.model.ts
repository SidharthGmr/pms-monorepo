import { Status } from "@prisma/client";

export interface CreateSupplierModel {
    name: string;
    contactPerson?: string | null;
    email?: string | null;
    phone?: string | null;
    address?: string | null;
    notes?: string | null;
    status: Status;
    displayOrder?: number;
}
