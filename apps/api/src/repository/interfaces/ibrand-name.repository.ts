import { BrandNameDto, BrandNameFilterParams } from "@pms/types";
import { ListResponseDto } from "../../dtos/list-response.dto";

export interface IBrandNameRepository {
    findAll(filters?: BrandNameFilterParams, page?: number, limit?: number, sortBy?: string, sortOrder?: 'asc' | 'desc'): Promise<ListResponseDto<BrandNameDto>>;
    findById(id: number, storeCode: string): Promise<BrandNameDto | null>;
    delete(id: number, storeCode: string): Promise<BrandNameDto>;
    /** Live products that still point at this brand. */
    countProducts(id: number, storeCode: string): Promise<number>;
}
