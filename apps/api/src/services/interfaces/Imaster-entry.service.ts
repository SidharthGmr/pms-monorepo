import { CreateMasterEntryDto, MasterEntryDto } from "../../dtos/master-entry.dto";
import { ListResponseDto } from "@pms/types";
import { MasterEntryFilterParams } from "../../params/master-entry.params";

export interface IMasterEntryService {
    getAll(filters?: MasterEntryFilterParams): Promise<ListResponseDto<MasterEntryDto>>;
    getById(id: number): Promise<MasterEntryDto | null>;
    create(data: CreateMasterEntryDto, storeCode: string): Promise<MasterEntryDto>;
    update(id: number, data: CreateMasterEntryDto): Promise<MasterEntryDto>;
    delete(id: number): Promise<MasterEntryDto>;
}
