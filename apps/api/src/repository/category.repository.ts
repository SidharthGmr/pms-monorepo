import { Prisma, Status } from "@prisma/client";
import prisma from "../config/prisma";
import { CategoryDto } from "../dtos/category.dto";
import { ListResponseDto } from "../dtos/list-response.dto";
import { CategoryFilterParams } from "../params/category.params";
import { ICategoryRepository } from "./interfaces/icategory.repository";

export class CategoryRepository implements ICategoryRepository {
  async findAll(
    filters?: CategoryFilterParams,
    page = 1,
    limit = 10,
    sortBy = 'displayOrder',
    sortOrder: 'asc' | 'desc' = 'asc'
  ): Promise<ListResponseDto<CategoryDto>> {
    const where: Prisma.categoryWhereInput = { NOT: { status: Status.Trash } };

    if (filters) {
      page = filters.page ?? page;
      limit = filters.recordPerPage ?? limit;

      if (filters.search) {
        where.OR = [{ name: { contains: filters.search, mode: 'insensitive' } }];
      }

      if (filters.parentId !== undefined) where.parentId = filters.parentId;

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

  async findById(id: number): Promise<CategoryDto | null> {
    return prisma.category.findUnique({ where: { id } });
  }

  async delete(id: number): Promise<CategoryDto> {
    return prisma.category.update({ where: { id }, data: { status: Status.Trash } });
  }
}
