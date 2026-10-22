import { Prisma } from "@prisma/client";

import { ListResponseDto, MasterEntryDto, MasterEntryFilterParams } from '@pms/types';
export interface IMasterEntryRepository {
    findAll(filters?: MasterEntryFilterParams): Promise<ListResponseDto<MasterEntryDto>>;
    /** Pass `tx` when reading back a row written inside an open transaction. */
    findById(id: number, tx?: Prisma.TransactionClient): Promise<MasterEntryDto | null>;
    /** Soft delete - MasterEntry carries a `status`. */
    delete(id: number): Promise<MasterEntryDto>;
}
