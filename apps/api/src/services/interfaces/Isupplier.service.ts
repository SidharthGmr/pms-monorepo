import { SupplierDto, CreateSupplierDto } from "../../dtos/supplier.dto";
import { ListResponseDto } from "@pms/types";
import { SupplierFilterParams } from "../../params/supplier.params";

export interface ISupplierService {
    getAll(filters?: SupplierFilterParams): Promise<ListResponseDto<SupplierDto>>;
    getById(id: number): Promise<SupplierDto | null>;
    create(data: CreateSupplierDto, storeCode: string): Promise<SupplierDto>;
    update(id: number, data: CreateSupplierDto): Promise<SupplierDto>;
    delete(id: number): Promise<SupplierDto>;
}
