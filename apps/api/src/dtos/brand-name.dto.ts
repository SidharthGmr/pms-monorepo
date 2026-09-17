import { Status } from "@prisma/client";

// `storeCode` is deliberately absent: it is marked `false` in `brandNameSelect`
// (`brand-name.repository.ts`), so it never leaves the database.
export interface BrandNameDto {
    id: number;
    name: string;
    images?: string[];
    status: Status;
    displayOrder?: number | null;
    createdAt: Date;
    updatedAt: Date | null;
}

export interface CreateBrandNameDto {
    name: string;
    images?: string[];
    storeCode: string
    status: Status;
    displayOrder?: number | null;
}
