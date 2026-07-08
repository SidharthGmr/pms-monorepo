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
    };
}

export class BrandNameRepository implements IBrandNameRepository {
    async findAll(
        filters?: BrandNameFilterParams,
        page = 1,
        limit = 10,
        sortBy = 'displayOrder',
        sortOrder: 'asc' | 'desc' = 'asc'
    ): Promise<ListResponseDto<BrandNameDto>> {
        const where: Prisma.brandNameWhereInput = { NOT: { status: Status.Trash } };

        if (filters) {
            page = filters.page ?? page;
            limit = filters.recordPerPage ?? limit;

            if (filters.search) {
                where.OR = [{ name: { contains: filters.search, mode: 'insensitive' } }];
            }

            if (filters.categoryIds && filters.categoryIds.length > 0) {
                where.categories = { some: { id: { in: filters.categoryIds } } };
            }

            if (filters.status !== undefined) {
                where.status = filters.status;
            } else {
                where.NOT = { status: Status.Trash };
            }

            if (filters.storeCode !== undefined) {
                where.storeCode = filters.storeCode;
            }
        }

        const showAll = filters?.showAllRecords === true;
        const skip = showAll ? undefined : (page - 1) * limit;
        const take = showAll ? undefined : limit;

        const include = { categories: { select: { id: true as const } } };

        const [data, total] = await Promise.all([
            prisma.brandName.findMany({
                where,
                include,
                orderBy: { [sortBy]: sortOrder },
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
        const result = await prisma.brandName.update({ where: { id }, data: { status: Status.Trash } });
        return result;
    }
}