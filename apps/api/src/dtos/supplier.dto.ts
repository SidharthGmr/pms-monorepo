import { Status } from "@prisma/client";

export interface SupplierDto {
    id: number;
    name: string;
    contactPerson?: string | null;
    email?: string | null;
    phone?: string | null;
    address?: string | null;
    notes?: string | null;
    storeCode: string;
    status: Status;
    displayOrder?: number | null;
    createdAt: Date;
    updatedAt: Date | null;
}

export interface CreateSupplierDto {
    name: string;
    contactPerson?: string | null;
    email?: string | null;
    phone?: string | null;
    address?: string | null;
    notes?: string | null;
    storeCode: string;
    status: Status;
    displayOrder?: number | null;
}
