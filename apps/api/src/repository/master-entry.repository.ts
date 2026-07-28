import { Prisma, Status } from "@prisma/client";
import prisma from "../config/prisma";
import { ListResponseDto } from "../dtos/list-response.dto";
import { MasterEntryDto } from "../dtos/master-entry.dto";
import { MasterEntryFilterParams } from "../params/master-entry.params";
import { IMasterEntryRepository } from "./interfaces/imaster-entry.repository";

const entryInclude = {
    attribute: { select: { id: true, name: true, code: true, unit: true } },
};

type EntryWithAttribute = Prisma.MasterEntryGetPayload<{ include: typeof entryInclude }>;

const SORTABLE_COLUMNS = new Set(['name', 'value', 'status', 'displayOrder', 'createdAt', 'updatedAt']);

function toDto(row: EntryWithAttribute): MasterEntryDto {
    return {
        id: row.id,
        attributeId: row.attributeId,
        name: row.name,
        value: row.value,
        colorHex: row.colorHex,
        metadata: row.metadata,
        storeCode: row.storeCode,
        status: row.status,
        displayOrder: row.displayOrder,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
        attribute: row.attribute,
    };
}

export class MasterEntryRepository implements IMasterEntryRepository {
    async findAll(filters?: MasterEntryFilterParams): Promise<ListResponseDto<MasterEntryDto>> {
        let page = 1;
        let limit = 10;
        const where: Prisma.MasterEntryWhereInput = { NOT: { status: Status.Trash } };

        if (filters) {
            page = filters.page ?? page;
            limit = filters.recordPerPage ?? limit;

            if (filters.search) {
                where.OR = [
                    { name: { contains: filters.search, mode: 'insensitive' } },
                    { value: { contains: filters.search, mode: 'insensitive' } },
                    { attribute: { name: { contains: filters.search, mode: 'insensitive' } } },
                ];
            }

            if (filters.status !== undefined) {
                where.status = filters.status;
                delete where.NOT;
            }

            if (filters.attributeId !== undefined) where.attributeId = filters.attributeId;
            if (filters.storeCode !== undefined) where.storeCode = filters.storeCode;

            // Callers select by the parent's stable code, so they never need the id.
            if (filters.attributeCode !== undefined) {
                where.attribute = { ...(where.attribute as object), code: filters.attributeCode };
            }

            if (filters.startDate != null || filters.endDate != null) {
                where.createdAt = {
                    ...(filters.startDate != null && { gte: filters.startDate }),
                    ...(filters.endDate != null && { lte: filters.endDate }),
                };
            }
        }

        // Admin lists want newest-first; a dropdown asks for sortBy=displayOrder&sortOrder=asc,
        // which keeps unordered entries at the end rather than letting them lead.
        const column = filters?.sortBy && SORTABLE_COLUMNS.has(filters.sortBy) ? filters.sortBy : 'createdAt';
        const direction: Prisma.SortOrder = filters?.sortOrder === 'asc' ? 'asc' : 'desc';
        const orderBy: Prisma.MasterEntryOrderByWithRelationInput[] =
            column === 'displayOrder'
                ? [{ displayOrder: { sort: direction, nulls: 'last' } }, { name: 'asc' }]
                : [{ [column]: direction }, { id: 'desc' }];

        const showAll = filters?.showAllRecords === true;
        const skip = showAll ? undefined : (page - 1) * limit;
        const take = showAll ? undefined : limit;

        const [data, total] = await Promise.all([
            prisma.masterEntry.findMany({
                where,
                include: entryInclude,
                orderBy,
                ...(skip !== undefined && { skip }),
                ...(take !== undefined && { take }),
            }),
            prisma.masterEntry.count({ where }),
        ]);

        return { totalRecord: total, data: data.map(toDto) };
    }

    // `tx` matters when the caller is inside a transaction: a read on the global client
    // cannot see rows the open transaction has not committed yet.
    async findById(id: number, tx: Prisma.TransactionClient = prisma): Promise<MasterEntryDto | null> {
        const row = await tx.masterEntry.findUnique({ where: { id }, include: entryInclude });
        return row ? toDto(row) : null;
    }

    async delete(id: number): Promise<MasterEntryDto> {
        const row = await prisma.masterEntry.update({
            where: { id },
            data: { status: Status.Trash },
            include: entryInclude,
        });
        return toDto(row);
    }
}
