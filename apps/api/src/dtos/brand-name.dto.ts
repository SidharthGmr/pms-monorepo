import { Status } from "@prisma/client";

export interface BrandNameDto {
    id: number;
    name: string;
    storeCode: string
    status: Status;
    displayOrder?: number | null;
    createdAt: Date;
    updatedAt: Date | null;
}

export interface CreateBrandNameDto {
    name: string;
    storeCode: string
    status: Status;
    displayOrder?: number | null;
}

