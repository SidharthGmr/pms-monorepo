import { SupplierDto } from "../../dtos/supplier.dto";
import { ListResponseDto } from "../../dtos/list-response.dto";
import { SupplierFilterParams } from "../../params/supplier.params";

export interface ISupplierRepository {
    findAll(filters?: SupplierFilterParams, page?: number, limit?: number, sortBy?: string, sortOrder?: 'asc' | 'desc'): Promise<ListResponseDto<SupplierDto>>;
    findById(id: number): Promise<SupplierDto | null>;
    delete(id: number): Promise<SupplierDto>;
}
