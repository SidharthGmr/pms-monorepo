import { Prisma, Status } from "@prisma/client";
import prisma from "../config/prisma";
import { StoreDto, CreateStoreDto } from "../dtos/store.dto";
import { StoreFilterParams } from "../params/store.params";
import NotFoundError from "../exceptions/not-found-error";
import { ListResponseDto } from "@pms/types";

export class StoreRepository {
  async create(data: CreateStoreDto): Promise<StoreDto> {
    const store = await prisma.store.create({
      data: {
        name: data.name,
        code: data.code,
        address: data.address ?? null,
        phone: data.phone ?? null,
        email: data.email ?? null,
        isActive: data.isActive ?? true,
        status: data.status ?? "Published",
      },
    });
    return this.mapToDto(store);
  }

  async findAll(filters?: StoreFilterParams, page = 1, limit = 10, sortBy = 'createdAt', sortOrder: 'asc' | 'desc' = 'desc'): Promise<ListResponseDto<StoreDto>> {
    const where: Prisma.storeWhereInput = {};

    if (filters) {
      page = filters.page ?? page;
      limit = filters.recordPerPage ?? limit;

      if (filters.search) {
        where.OR = [
          { name: { contains: filters.search, mode: 'insensitive' } },
          { code: { contains: filters.search, mode: 'insensitive' } },
        ];
      }

      if (filters.isActive !== undefined) {
        where.isActive = filters.isActive;
      }
    }

    // Exclude trashed stores by default; allow explicit status filtering.
    if (filters?.status !== undefined) {
      where.status = filters.status;
    } else {
      where.NOT = { status: Status.Trash };
    }

    const showAll = filters?.showAllRecords === true;
    const skip = showAll ? undefined : (page - 1) * limit;
    const take = showAll ? undefined : limit;

    const [data, total] = await Promise.all([
      prisma.store.findMany({
        where,
        orderBy: { [sortBy]: sortOrder },
        ...(skip !== undefined && { skip }),
        ...(take !== undefined && { take }),
      }),
      prisma.store.count({ where }),
    ]);

    return { totalRecord: total, data: data.map((s) => this.mapToDto(s)) };
  }




  async getById(id: number): Promise<StoreDto> {
    const store = await prisma.store.findUnique({
      where: { id },
    });

    if (!store) {
      throw new NotFoundError(`Store with id ${id} not found`);
    }

    return this.mapToDto(store);
  }


  /**
   * Tenancy is keyed on `storeCode` everywhere else, but Cart relates to
   * `store.id`, so cart endpoints need to translate the JWT's storeCode.
   */
  async getByCode(code: string): Promise<StoreDto | null> {
    const store = await prisma.store.findUnique({
      where: { code },
    });

    return store ? this.mapToDto(store) : null;
  }

  async delete(id: number): Promise<StoreDto> {
    const store = await prisma.store.findUnique({
      where: { id },
    });

    if (!store) {
      throw new NotFoundError(`Store with id ${id} not found`);
    }

    const deleted = await prisma.store.update({
      where: { id },
      data: { status: Status.Trash }
    });

    return this.mapToDto(deleted);
  }

  async checkExists(field: "name" | "code", value: string, excludeId?: number): Promise<boolean> {
    const whereClause: any = { [field]: value };
    if (excludeId) {
      whereClause.id = { not: excludeId };
    }

    const count = await prisma.store.count({
      where: whereClause,
    });

    return count > 0;
  }

  private mapToDto(store: any): StoreDto {
    return {
      id: store.id,
      name: store.name,
      code: store.code,
      address: store.address,
      phone: store.phone,
      email: store.email,
      isActive: store.isActive,
      createdAt: store.createdAt,
      updatedAt: store.updatedAt,
      status: store.status,
    };
  }
}

