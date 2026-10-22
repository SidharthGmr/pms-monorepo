
import { ListResponseDto, SupplierDto, CreateSupplierDto, SupplierFilterParams } from '@pms/types';
export interface ISupplierService {
    getAll(filters?: SupplierFilterParams): Promise<ListResponseDto<SupplierDto>>;
    getById(id: number): Promise<SupplierDto | null>;
    create(data: CreateSupplierDto, storeCode: string): Promise<SupplierDto>;
    update(id: number, data: CreateSupplierDto): Promise<SupplierDto>;
    delete(id: number): Promise<SupplierDto>;
}
