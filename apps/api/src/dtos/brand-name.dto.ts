import { Status } from "@prisma/client";

export interface BrandNameDto {
    id: number;
    name: string;
    storeCode: string
    status: Status;
    displayOrder?: number | null;
}

export interface CreateBrandNameDto {
    name: string;
    storeCode: string
    status: Status;
    displayOrder?: number | null;
}

