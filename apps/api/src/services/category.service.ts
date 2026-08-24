import { Prisma } from "@prisma/client";
import { inject, injectable } from "inversify";
import { TYPES } from "../config/ioc.types";
import ClientError from "../exceptions/client-error";
import ConflictError from "../exceptions/conflict-error";
import NotFoundError from "../exceptions/not-found-error";

import type IUnitOfWork from "../repository/interfaces/iunitofwork.repository";
import { ICategoryService } from "./interfaces/Icategory.service";
import { CategoryFilterParams, CategoryModel, CategoryResponseDto, ListResponseDto, StatusEnum } from "@pms/types";

/**
 * `Json?` columns need an explicit sentinel to be set back to SQL NULL - a bare `null` is a
 * type error. Returns a spreadable object rather than a value because `exactOptionalPropertyTypes`
 * rejects an explicit `metadata: undefined`; omitting the key is what leaves the column untouched.
 */
function metadataInput(metadata: CategoryModel['metadata']): { metadata?: Prisma.InputJsonValue | typeof Prisma.DbNull } {
  if (metadata === undefined) return {};
  return { metadata: metadata === null ? Prisma.DbNull : (metadata as Prisma.InputJsonValue) };
}

@injectable()
export class CategoryService implements ICategoryService {
  constructor(
    @inject(TYPES.IUnitOfWork) private unitOfWork: IUnitOfWork
  ) { }

  async getAll(filters?: CategoryFilterParams): Promise<ListResponseDto<CategoryResponseDto>> {
    // `sortDirection` arrives as a free-text query value, so normalise it here rather
    // than letting an unexpected string reach Prisma.
    const sortOrder = filters?.sortDirection?.toLowerCase() === 'asc' ? 'asc' : 'desc';
    return this.unitOfWork.Category.findAll(filters, filters?.page, filters?.recordPerPage, filters?.sortBy ?? undefined, sortOrder);
  }

  async getById(id: number, storeCode: string): Promise<CategoryResponseDto | null> {
    const category = await this.unitOfWork.Category.findById(id, storeCode);
    if (!category) throw new NotFoundError("Category not found");
    return category;
  }

  /**
   * The parent FK is compound (`[storeCode, parentId]`), so a cross-store parent fails at the
   * database with an opaque error. Checking here turns that into a readable 400, and also
   * catches the two cases the FK cannot see: self-parenting and longer cycles.
   */
  private async assertParentIsUsable(parentId: number, storeCode: string, categoryId?: number): Promise<void> {
    if (categoryId !== undefined && parentId === categoryId) {
      throw new ClientError("A category cannot be its own parent");
    }

    const parent = await this.unitOfWork.Category.findById(parentId, storeCode);
    if (!parent) throw new ClientError("Parent category not found in this store");

    if (categoryId === undefined) return;

    // Walk up from the proposed parent. Reaching this category means the move would
    // close a loop. The visited set stops an already-corrupt chain from spinning forever.
    const visited = new Set<number>([parentId]);
    let cursor = parent.parentId;
    while (cursor !== null) {
      if (cursor === categoryId) throw new ClientError("That parent would create a circular category hierarchy");
      if (visited.has(cursor)) break;
      visited.add(cursor);

      const ancestor: CategoryResponseDto | null = await this.unitOfWork.Category.findById(cursor, storeCode);
      if (!ancestor) break;
      cursor = ancestor.parentId;
    }
  }

  async create(data: CategoryModel, storeCode: string, userId: string): Promise<CategoryResponseDto> {
    if (data.parentId != null) {
      await this.assertParentIsUsable(data.parentId, storeCode);
    }

    return this.unitOfWork.transaction(async (transactionClient) => {
      return transactionClient.category.create({
        data: {
          name: data.name,
          description: data.description || null,
          parentId: data.parentId ?? null,
          storeCode: storeCode,
          status: data.status || StatusEnum.Draft,
          ...(data.images !== undefined && { images: data.images }),
          // NOT NULL with a 0 default - the old `|| null` would now be rejected.
          displayOrder: data.displayOrder ?? 0,
          ...metadataInput(data.metadata),
          createdById: userId,
        },
      });
    });
  }

  async update(id: number, data: CategoryModel, storeCode: string, userId: string): Promise<CategoryResponseDto> {
    const existing = await this.unitOfWork.Category.findById(id, storeCode);
    if (!existing) throw new NotFoundError("Category not found");

    if (data.parentId != null) {
      await this.assertParentIsUsable(data.parentId, storeCode, id);
    }

    return this.unitOfWork.transaction(async (transactionClient) => {
      return transactionClient.category.update({
        // `storeCode` is never taken from the body - it comes from the caller's token, so a
        // client cannot move a category into another store. `updatedAt` is `@updatedAt` now
        // and must not be set by hand.
        where: { storeCode_id: { storeCode, id } },
        data: {
          name: data.name,
          description: data.description || null,
          parentId: data.parentId ?? null,
          status: data.status || StatusEnum.Draft,
          ...(data.images !== undefined && { images: data.images }),
          displayOrder: data.displayOrder ?? existing.displayOrder,
          ...metadataInput(data.metadata),
          updatedById: userId,
        },
      });
    });
  }

  /**
   * Soft delete. Because this is an UPDATE, the schema's `onDelete: Restrict` never fires,
   * so the "still in use" checks have to be explicit - otherwise a category would vanish
   * from the list while its children and products still pointed at it.
   */
  async delete(id: number, storeCode: string, userId: string): Promise<CategoryResponseDto> {
    const existing = await this.unitOfWork.Category.findById(id, storeCode);
    if (!existing) throw new NotFoundError("Category not found");

    const [childCount, productCount] = await Promise.all([
      this.unitOfWork.Category.countChildren(id, storeCode),
      this.unitOfWork.Category.countProducts(id, storeCode),
    ]);

    if (childCount > 0) {
      throw new ConflictError(`Cannot delete this category - it still has ${childCount} sub-categor${childCount === 1 ? 'y' : 'ies'}.`);
    }
    if (productCount > 0) {
      throw new ConflictError(`Cannot delete this category - ${productCount} product${productCount === 1 ? '' : 's'} still belong to it.`);
    }

    return this.unitOfWork.Category.delete(id, storeCode, userId);
  }
}
