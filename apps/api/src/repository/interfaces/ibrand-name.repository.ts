import { BrandNameDto } from "../../dtos/brand-name.dto";
import { ListResponseDto } from "../../dtos/list-response.dto";
import { BrandNameFilterParams } from "../../params/brand-name.params";

export interface IBrandNameRepository {
    findAll(filters?: BrandNameFilterParams, page?: number, limit?: number, sortBy?: string, sortOrder?: 'asc' | 'desc'): Promise<ListResponseDto<BrandNameDto>>;
    findById(id: number): Promise<BrandNameDto | null>;
    delete(id: number): Promise<BrandNameDto>;
}
