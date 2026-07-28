import { Prisma, Status } from '@prisma/client';

export interface MasterAttributeDto {
    id: number;
    name: string;
    code: string;
    description?: string | null;
    unit?: string | null;
    storeCode: string;
    status: Status;
    displayOrder?: number | null;
    createdAt: Date;
    updatedAt?: Date | null;
    /** Lets a listing show "Size (4 values)" without a second request. */
    entryCount?: number;
}

export interface MasterEntryAttributeDto {
    id: number;
    name: string;
    code: string;
    unit?: string | null;
}

export interface MasterEntryDto {
    id: number;
    attributeId: number;
    name: string;
    value: string;
    colorHex?: string | null;
    metadata?: Prisma.JsonValue;
    storeCode: string;
    status: Status;
    displayOrder?: number | null;
    createdAt: Date;
    updatedAt?: Date | null;
    attribute?: MasterEntryAttributeDto | null;
}

export interface CreateMasterAttributeDto {
    name: string;
    code: string;
    description?: string | null;
    unit?: string | null;
    status?: Status;
    displayOrder?: number | null;
}

export interface CreateMasterEntryDto {
    attributeId: number;
    name: string;
    value: string;
    colorHex?: string | null;
    metadata?: Prisma.InputJsonValue;
    status?: Status;
    displayOrder?: number | null;
}
