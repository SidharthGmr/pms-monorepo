import { CreateMasterAttributeDto, MasterAttributeDto } from "../../dtos/master-entry.dto";
import { ListResponseDto } from "../../dtos/list-response.dto";
import { MasterAttributeFilterParams } from "../../params/master-entry.params";

export interface IMasterAttributeService {
    getAll(filters?: MasterAttributeFilterParams): Promise<ListResponseDto<MasterAttributeDto>>;
    getById(id: number): Promise<MasterAttributeDto | null>;
    getByCode(code: string, storeCode: string): Promise<MasterAttributeDto | null>;
    create(data: CreateMasterAttributeDto, storeCode: string): Promise<MasterAttributeDto>;
    update(id: number, data: CreateMasterAttributeDto): Promise<MasterAttributeDto>;
    delete(id: number): Promise<MasterAttributeDto>;
}
