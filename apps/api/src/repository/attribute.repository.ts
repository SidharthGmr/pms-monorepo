import { Prisma, Status } from "@prisma/client";
import { AttributeDto, AttributeFilterParams, ListResponseDto } from "@pms/types";
import prisma from "../config/prisma";
import { IAttributeRepository } from "./interfaces/iattribute.repository";

// Sorting is client-driven, so only real columns are honoured - anything else falls
// back to the default instead of failing the query.
const SORTABLE_COLUMNS = new Set(['name', 'unit', 'status', 'displayOrder', 'createdAt', 'updatedAt']);

// The response shape for every attribute read and write. `storeCode` is withheld, so this has
// to be passed to every query - including the service's create/update through
// `transactionClient` - or the whole row, tenant key included, goes back to the client.
export const attributeSelect = {
  id: true,
  name: true,
  unit: true,
  storeCode: false,
  status: true,
  displayOrder: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.attributeSelect;


export class AttributeRepository implements IAttributeRepository {
  async findAll(
    filters?: AttributeFilterParams,
    page = 1,
    limit = 10,
    sortBy = "createdAt",
    sortOrder: "asc" | "desc" = "desc"
  ): Promise<ListResponseDto<AttributeDto>> {
    const where: Prisma.attributeWhereInput = {};

    if (filters) {
      page = filters.page ?? page;
      limit = filters.recordPerPage ?? limit;

      if (filters.search) {
        where.OR = [{ name: { contains: filters.search, mode: "insensitive" } }];
      }

      if (filters.storeCode !== undefined) {
        where.storeCode = filters.storeCode;
      }

      if (filters.startDate != null || filters.endDate != null) {
        where.createdAt = {
          ...(filters.startDate != null && { gte: filters.startDate }),
          ...(filters.endDate != null && { lte: filters.endDate }),
        };
      }
    }

    // A status filter selects that bucket, Trash included. No filter means "everything but
    // Trash". Setting NOT unconditionally made `?status=Trash` read as
    // `status = Trash AND status <> Trash`, which can never match.
    if (filters?.status != null) {
      where.status = filters.status;
    } else {
      where.NOT = { status: Status.Trash };
    }

    const showAll = filters?.showAllRecords === true;
    const skip = showAll ? undefined : (page - 1) * limit;
    const take = showAll ? undefined : limit;

    const column = SORTABLE_COLUMNS.has(sortBy) ? sortBy : 'createdAt';
    const direction: Prisma.SortOrder = sortOrder === 'asc' ? 'asc' : 'desc';
    const orderBy: Prisma.attributeOrderByWithRelationInput[] =
      column === 'displayOrder'
        ? [{ displayOrder: { sort: direction, nulls: 'last' } }, { id: 'desc' }]
        : [{ [column]: direction }, { id: 'desc' }];

    const [data, total] = await Promise.all([
      prisma.attribute.findMany({
        where,
        orderBy,
        ...(skip !== undefined && { skip }),
        ...(take !== undefined && { take }),
        select: attributeSelect,
      }),
      prisma.attribute.count({ where }),
    ]);

    return { totalRecord: total, data };
  }

  // Scoped on the `@@unique([storeCode, id])` key, so an attribute in another store is simply
  // not found - the caller cannot read, edit or delete ids outside its own tenant.
  async findById(id: number, storeCode: string): Promise<AttributeDto | null> {
    return prisma.attribute.findUnique({ where: { storeCode_id: { storeCode, id } }, select: attributeSelect });
  }

  async delete(id: number, storeCode: string): Promise<AttributeDto> {
    return prisma.attribute.update({
      where: { storeCode_id: { storeCode, id } },
      data: { status: Status.Trash },
      select: attributeSelect,
    });
  }

  async countProducts(id: number, storeCode: string): Promise<number> {
    return prisma.product.count({ where: { attributeId: id, storeCode, deletedAt: null } });
  }
}
