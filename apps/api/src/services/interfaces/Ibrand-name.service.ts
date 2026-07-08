import { BrandNameDto, CreateBrandNameDto } from "../../dtos/brand-name.dto";
import { ListResponseDto } from "../../dtos/list-response.dto";
import { BrandNameFilterParams } from "../../params/brand-name.params";

export interface IBrandNameService {
    getAll(filters?: BrandNameFilterParams): Promise<ListResponseDto<BrandNameDto>>;
    getById(id: number): Promise<BrandNameDto | null>;
    create(data: CreateBrandNameDto, storeCode: string): Promise<BrandNameDto>;
    update(id: number, data: CreateBrandNameDto): Promise<BrandNameDto>;
    delete(id: number): Promise<BrandNameDto>;
}
