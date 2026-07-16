import { Prisma, Status } from "@prisma/client";
import prisma from "../config/prisma";
import { ICategoryRepository } from "./interfaces/icategory.repository";
import { CategoryFilterParams, CategoryResponseDto, ListResponseDto } from "@pms/types";

export class CategoryRepository implements ICategoryRepository {
  async findAll(filters?: CategoryFilterParams, page = 1, limit = 10, sortBy = 'displayOrder', sortOrder: 'asc' | 'desc' = 'asc'): Promise<ListResponseDto<CategoryResponseDto>> {
    const where: Prisma.categoryWhereInput = { NOT: { status: Status.Trash } };

    if (filters) {
      page = filters.page ?? page;
      limit = filters.recordPerPage ?? limit;

      if (filters.search) {
        where.OR = [{ name: { contains: filters.search, mode: "insensitive" } }];
      }

      if (filters.status !== undefined) {
        where.status = filters.status;
      } else {
        where.NOT = { status: Status.Trash };
      }

      if (filters.storeCode !== undefined) {
        where.storeCode = filters.storeCode;
      }

      if (filters.startDate !== undefined || filters.endDate !== undefined) {
        where.createdAt = {
          ...(filters.startDate !== undefined && { gte: filters.startDate }),
          ...(filters.endDate !== undefined && { lte: filters.endDate }),
        };
      }
    }

    const showAll = filters?.showAllRecords === true;
    const skip = showAll ? undefined : (page - 1) * limit;
    const take = showAll ? undefined : limit;

    const [data, total] = await Promise.all([
      prisma.category.findMany({
        where,
        orderBy: { [sortBy]: sortOrder },
        ...(skip !== undefined && { skip }),
        ...(take !== undefined && { take }),
      }),
      prisma.category.count({ where }),
    ]);

    return { totalRecord: total, data };
  }

  async findById(id: number, storeCode: string): Promise<CategoryResponseDto | null> {
    return prisma.category.findUnique({ where: { id, storeCode } });
  }

  async delete(id: number): Promise<CategoryResponseDto> {
    return prisma.category.update({ where: { id }, data: { status: Status.Trash } });
  }
}
