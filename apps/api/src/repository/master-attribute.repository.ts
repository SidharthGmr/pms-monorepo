import { Prisma, Status } from "@prisma/client";
import prisma from "../config/prisma";
import { ListResponseDto } from "../dtos/list-response.dto";
import { MasterAttributeDto } from "../dtos/master-entry.dto";
import { MasterAttributeFilterParams } from "../params/master-entry.params";
import { IMasterAttributeRepository } from "./interfaces/imaster-attribute.repository";

const attributeInclude = {
    _count: { select: { entries: true } },
};

type AttributeWithCount = Prisma.MasterAttributeGetPayload<{ include: typeof attributeInclude }>;

// Sorting is client-driven, so only real columns are honoured - anything else falls
// back to the default instead of failing the query.
const SORTABLE_COLUMNS = new Set(['name', 'code', 'status', 'displayOrder', 'createdAt', 'updatedAt']);

function toDto(row: AttributeWithCount): MasterAttributeDto {
    return {
        id: row.id,
        name: row.name,
        code: row.code,
        description: row.description,
        unit: row.unit,
        storeCode: row.storeCode,
        status: row.status,
        displayOrder: row.displayOrder,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
        entryCount: row._count.entries,
    };
}

export class MasterAttributeRepository implements IMasterAttributeRepository {
    async findAll(filters?: MasterAttributeFilterParams): Promise<ListResponseDto<MasterAttributeDto>> {
        let page = 1;
        let limit = 10;
        const where: Prisma.MasterAttributeWhereInput = { NOT: { status: Status.Trash } };

        if (filters) {
            page = filters.page ?? page;
            limit = filters.recordPerPage ?? limit;

            if (filters.search) {
                where.OR = [
                    { name: { contains: filters.search, mode: 'insensitive' } },
                    { code: { contains: filters.search, mode: 'insensitive' } },
                    { description: { contains: filters.search, mode: 'insensitive' } },
                ];
            }

            if (filters.status !== undefined) {
                where.status = filters.status;
                delete where.NOT;
            }

            if (filters.code !== undefined) where.code = filters.code;
            if (filters.storeCode !== undefined) where.storeCode = filters.storeCode;

            if (filters.startDate != null || filters.endDate != null) {
                where.createdAt = {
                    ...(filters.startDate != null && { gte: filters.startDate }),
                    ...(filters.endDate != null && { lte: filters.endDate }),
                };
            }
        }

        // Newest-first by default so a freshly added attribute is visible on page 1.
        // Callers that want dropdown order pass sortBy=displayOrder explicitly, and get
        // nulls last so unordered rows do not lead.
        const column = filters?.sortBy && SORTABLE_COLUMNS.has(filters.sortBy) ? filters.sortBy : 'createdAt';
        const direction: Prisma.SortOrder = filters?.sortOrder === 'asc' ? 'asc' : 'desc';
        const orderBy: Prisma.MasterAttributeOrderByWithRelationInput[] =
            column === 'displayOrder'
                ? [{ displayOrder: { sort: direction, nulls: 'last' } }, { id: 'desc' }]
                : [{ [column]: direction }, { id: 'desc' }];

        const showAll = filters?.showAllRecords === true;
        const skip = showAll ? undefined : (page - 1) * limit;
        const take = showAll ? undefined : limit;

        const [data, total] = await Promise.all([
            prisma.masterAttribute.findMany({
                where,
                include: attributeInclude,
                orderBy,
                ...(skip !== undefined && { skip }),
                ...(take !== undefined && { take }),
            }),
            prisma.masterAttribute.count({ where }),
        ]);

        return { totalRecord: total, data: data.map(toDto) };
    }

    // `tx` matters when the caller is inside a transaction: a read on the global client
    // cannot see rows the open transaction has not committed yet.
    async findById(id: number, tx: Prisma.TransactionClient = prisma): Promise<MasterAttributeDto | null> {
        const row = await tx.masterAttribute.findUnique({ where: { id }, include: attributeInclude });
        return row ? toDto(row) : null;
    }

    async findByCode(code: string, storeCode: string): Promise<MasterAttributeDto | null> {
        const row = await prisma.masterAttribute.findUnique({
            where: { code_storeCode: { code, storeCode } },
            include: attributeInclude,
        });
        return row ? toDto(row) : null;
    }

    async delete(id: number): Promise<MasterAttributeDto> {
        const row = await prisma.masterAttribute.update({
            where: { id },
            data: { status: Status.Trash },
            include: attributeInclude,
        });
        return toDto(row);
    }
}
