import { Prisma, Status } from "@prisma/client";
import { AttributeDto, AttributeFilterParams, ListResponseDto, StatusEnum } from "@pms/types";
import prisma from "../config/prisma";
import { IAttributeRepository } from "./interfaces/iattribute.repository";

export class AttributeRepository implements IAttributeRepository {
  async findAll(
    filters?: AttributeFilterParams,
    page = 1,
    limit = 10,
    sortBy = "createdAt",
    sortOrder: "asc" | "desc" = "desc"
  ): Promise<ListResponseDto<AttributeDto>> {
    const where: Prisma.attributeWhereInput = { NOT: { status: Status.Trash } };

    if (filters) {
      page = filters.page ?? page;
      limit = filters.recordPerPage ?? limit;

      if (filters.search) {
        where.OR = [{ name: { contains: filters.search, mode: "insensitive" } }];
      }

      if (filters.status !== undefined) {
        where.status = filters.status as StatusEnum;
      } else {
        where.NOT = { status: Status.Trash };
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

    const showAll = filters?.showAllRecords === true;
    const skip = showAll ? undefined : (page - 1) * limit;
    const take = showAll ? undefined : limit;

    const [data, total] = await Promise.all([
      prisma.attribute.findMany({
        where,
        orderBy: { [sortBy]: sortOrder },
        ...(skip !== undefined && { skip }),
        ...(take !== undefined && { take }),
      }),
      prisma.attribute.count({ where }),
    ]);

    return { totalRecord: total, data };
  }

  async findById(id: number): Promise<AttributeDto | null> {
    return prisma.attribute.findUnique({ where: { id } });
  }

  async delete(id: number): Promise<AttributeDto> {
    return prisma.attribute.update({ where: { id }, data: { status: Status.Trash } });
  }
}
