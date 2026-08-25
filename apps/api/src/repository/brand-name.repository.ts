import { Prisma, Status } from "@prisma/client";
import prisma from "../config/prisma";
import { BrandNameDto } from "../dtos/brand-name.dto";
import { ListResponseDto } from "../dtos/list-response.dto";
import { BrandNameFilterParams } from "../params/brand-name.params";
import { IBrandNameRepository } from "./interfaces/ibrand-name.repository";

type BrandNameWithCategories = Prisma.brandNameGetPayload<{
    include: { categories: { select: { id: true } } };
}>;

function toDto(b: BrandNameWithCategories): BrandNameDto {
    return {
        id: b.id,
        name: b.name,
        storeCode: b.storeCode,
        status: b.status,
        displayOrder: b.displayOrder,
        createdAt: b.createdAt,
        updatedAt: b.updatedAt,
    };
}

// Sorting is client-driven, so only real columns are honoured - anything else falls
// back to the default instead of failing the query.
const SORTABLE_COLUMNS = new Set(['name', 'status', 'displayOrder', 'createdAt', 'updatedAt']);

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

        const include = { categories: { select: { id: true as const } } };



        const orderBy: Prisma.brandNameOrderByWithRelationInput[] =
            column === 'displayOrder'
                ? [{ displayOrder: { sort: direction, nulls: 'last' } }, { id: 'desc' }]
                : [{ [column]: direction }, { id: 'desc' }];

        const [data, total] = await Promise.all([
            prisma.brandName.findMany({
                where,
                include,
                orderBy,
                ...(skip !== undefined && { skip }),
                ...(take !== undefined && { take }),
            }),
            prisma.brandName.count({ where }),
        ]);

        return { totalRecord: total, data: data.map(toDto) };
    }

    async findById(id: number): Promise<BrandNameDto | null> {
        const result = await prisma.brandName.findUnique({
            where: { id },
            include: { categories: { select: { id: true } } },
        });
        return result ? toDto(result) : null;
    }

    async delete(id: number): Promise<BrandNameDto> {
        const result = await prisma.brandName.update({ where: { id }, data: { status: Status.Trash, updatedAt: new Date() } });
        return result;
    }
}