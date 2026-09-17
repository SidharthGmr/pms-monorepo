import { Prisma, Status } from "@prisma/client";
import prisma from "../config/prisma";
import { BrandNameDto } from "../dtos/brand-name.dto";
import { ListResponseDto } from "../dtos/list-response.dto";
import { BrandNameFilterParams } from "../params/brand-name.params";
import { IBrandNameRepository } from "./interfaces/ibrand-name.repository";

// Sorting is client-driven, so only real columns are honoured - anything else falls
// back to the default instead of failing the query.
const SORTABLE_COLUMNS = new Set(['name', 'status', 'displayOrder', 'createdAt', 'updatedAt']);

// The response shape for every brand-name read. A field marked `false` is withheld, so this
// has to be passed to every query in this file - a method that omits `select` returns the
// whole row instead, and tsc cannot see the difference.
// Exported because the service writes through `transactionClient` rather than this
// repository, and those calls have to withhold the same fields - see `userSummarySelect`
// in `user-profile.mapper.ts` for the same arrangement.
export const brandNameSelect = {
    id: true,
    name: true,
    images: true,
    storeCode: false,
    status: true,
    displayOrder: true,
    createdAt: true,
    updatedAt: true,
} satisfies Prisma.brandNameSelect;

export class BrandNameRepository implements IBrandNameRepository {
    async findAll(filters?: BrandNameFilterParams, page = 1, limit = 10, sortBy = 'createdAt', sortOrder: 'asc' | 'desc' = 'desc'): Promise<ListResponseDto<BrandNameDto>> {



        const column = SORTABLE_COLUMNS.has(sortBy) ? sortBy : 'createdAt';
        const direction: Prisma.SortOrder = sortOrder === 'asc' ? 'asc' : 'desc';
        const where: Prisma.brandNameWhereInput = {};




        if (filters) {
            page = filters.page ?? page;
            limit = filters.recordPerPage ?? limit;

            if (filters.search) {
                where.OR = [{ name: { contains: filters.search, mode: 'insensitive' } }];
            }

            if (filters.categoryIds && filters.categoryIds.length > 0) {
                where.categories = { some: { id: { in: filters.categoryIds } } };
            }


            if (filters.storeCode !== undefined) {
                where.storeCode = filters.storeCode;
            }
        }

        const showAll = filters?.showAllRecords === true;

        if (filters?.status !== undefined) {
            where.status = filters.status;
        } else if (!showAll) {
            where.NOT = { status: Status.Trash };
        }
        const skip = showAll ? undefined : (page - 1) * limit;
        const take = showAll ? undefined : limit;

        const orderBy: Prisma.brandNameOrderByWithRelationInput[] =
            column === 'displayOrder'
                ? [{ displayOrder: { sort: direction, nulls: 'last' } }, { id: 'desc' }]
                : [{ [column]: direction }, { id: 'desc' }];

        const [data, total] = await Promise.all([
            prisma.brandName.findMany({
                where,
                orderBy,
                ...(skip !== undefined && { skip }),
                ...(take !== undefined && { take }),
                select: brandNameSelect,
            }),
            prisma.brandName.count({ where }),
        ]);

        return { totalRecord: total, data };
    }

    // Scoped on the `@@unique([storeCode, id])` key, so a brand in another store is simply
    // not found - the caller cannot probe ids outside its own tenant.
    async findById(id: number, storeCode: string): Promise<BrandNameDto | null> {
        return prisma.brandName.findUnique({ where: { storeCode_id: { storeCode, id } }, select: brandNameSelect });
    }

    async delete(id: number, storeCode: string): Promise<BrandNameDto> {
        return prisma.brandName.update({
            where: { storeCode_id: { storeCode, id } },
            data: { status: Status.Trash, updatedAt: new Date() },
            select: brandNameSelect,
        });
    }
}