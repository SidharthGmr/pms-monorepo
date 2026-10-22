
import { ListResponseDto, SupplierDto, SupplierFilterParams } from '@pms/types';
export interface ISupplierRepository {
    findAll(filters?: SupplierFilterParams, page?: number, limit?: number, sortBy?: string, sortOrder?: 'asc' | 'desc'): Promise<ListResponseDto<SupplierDto>>;
    findById(id: number): Promise<SupplierDto | null>;
    delete(id: number): Promise<SupplierDto>;
}
