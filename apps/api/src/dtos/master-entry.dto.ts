import { Prisma, Status } from '@prisma/client';

/** Just enough of the linked row to label it in a listing without a second request. */
export interface MasterAttributeRelationDto {
    id: number;
    name: string;
}

export interface MasterAttributeDto {
    id: number;
    name: string;
    code: string;
    description?: string | null;
    unit?: string | null;
    /** Optional scoping - null means the attribute applies to every category. */
    categoryId?: number | null;
    /** Optional scoping - null means the attribute applies to every brand. */
    brandNameId?: number | null;
    storeCode: string;
    status: Status;
    displayOrder?: number | null;
    createdAt: Date;
    updatedAt?: Date | null;
    /** Lets a listing show "Size (4 values)" without a second request. */
    entryCount?: number;
    category?: MasterAttributeRelationDto | null;
    brandName?: MasterAttributeRelationDto | null;
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
    categoryId?: number | null;
    brandNameId?: number | null;
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
