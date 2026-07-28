import { Prisma } from "@prisma/client";
import { MasterAttributeDto } from "../../dtos/master-entry.dto";
import { ListResponseDto } from "../../dtos/list-response.dto";
import { MasterAttributeFilterParams } from "../../params/master-entry.params";

export interface IMasterAttributeRepository {
    findAll(filters?: MasterAttributeFilterParams): Promise<ListResponseDto<MasterAttributeDto>>;
    /** Pass `tx` when reading back a row written inside an open transaction. */
    findById(id: number, tx?: Prisma.TransactionClient): Promise<MasterAttributeDto | null>;
    /** Resolves the stable code callers use instead of a numeric id. */
    findByCode(code: string, storeCode: string): Promise<MasterAttributeDto | null>;
    /** Soft delete - MasterAttribute carries a `status`. */
    delete(id: number): Promise<MasterAttributeDto>;
}
