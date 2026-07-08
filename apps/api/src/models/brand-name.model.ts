import { Status } from "@prisma/client";

export interface CreateBrandNameModel {
    brandName: string;
    status: Status;
    displayOrder?: number;
    categoryIds: number[];
}
