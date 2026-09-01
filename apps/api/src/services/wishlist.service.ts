import { Role, Status } from "@prisma/client";
import { inject, injectable } from "inversify";
import { TYPES } from "../config/ioc.types";
import { ListResponseDto } from "../dtos/list-response.dto";
import { WishlistDto } from "../dtos/wishlist.dto";
import ForbiddenError from "../exceptions/forbidden-error";
import NotFoundError from "../exceptions/not-found-error";
import { WishlistFilterParams } from "../params/wishlist.params";
import type IUnitOfWork from "../repository/interfaces/iunitofwork.repository";
import { ReviewActor } from "./interfaces/Ireview.service";
import { IWishlistService } from "./interfaces/Iwishlist.service";

const STAFF_ROLES: Role[] = [Role.SUPER_ADMIN, Role.ADMIN, Role.STAFF];

@injectable()
export class WishlistService implements IWishlistService {
  constructor(@inject(TYPES.IUnitOfWork) private unitOfWork: IUnitOfWork) { }

  /**
   * A save names only the SKU. The product and the store are read off the variant rather
   * than taken from the request, so a row can never claim a (product, variant) pairing the
   * catalogue does not have, nor be filed under a store the SKU does not belong to.
   */
  async add(variantId: number, userId: string, storeCode: string): Promise<WishlistDto> {
    return this.unitOfWork.transaction(async (transactionClient) => {
      // One query for both halves: the SKU must be live, and so must its parent product -
      // a variant of a trashed or soft-deleted product is not savable.
      const variant = await transactionClient.productVariant.findFirst({
        where: {
          id: variantId,
          storeCode,
          deletedAt: null,
          status: { not: Status.Trash },
          product: { deletedAt: null, status: { not: Status.Trash } },
        },
        select: {
          id: true,
          productId: true,
          storeCode: true,
        },
      });

      if (!variant) {
        throw new NotFoundError("Product variant not found in this store");
      }

      // Saving the same SKU twice is a no-op, not an error - the heart that calls this
      // cannot know the current state on first render. Read through the transaction client.
      const existingWishlistItem = await transactionClient.wishlist.findFirst({
        where: { userId, variantId },
        select: { id: true },
      });

      if (existingWishlistItem) {
        const existing = await this.unitOfWork.Wishlist.findById(
          existingWishlistItem.id,
          transactionClient
        );

        if (!existing) {
          throw new NotFoundError("Wishlist item not found");
        }

        return existing;
      }

      const entry = await transactionClient.wishlist.create({
        data: {
          userId,
          productId: variant.productId,
          variantId,
          storeCode: variant.storeCode,
        },
        select: {
          id: true,
        },
      });

      const created = await this.unitOfWork.Wishlist.findById(
        entry.id,
        transactionClient
      );

      if (!created) {
        throw new NotFoundError("Wishlist item not found");
      }

      return created;
    });
  }

  async getAll(filters?: WishlistFilterParams): Promise<ListResponseDto<WishlistDto>> {
    return this.unitOfWork.Wishlist.findAll(filters);
  }

  async getById(id: number, actor: ReviewActor): Promise<WishlistDto | null> {
    const entry = await this.unitOfWork.Wishlist.findById(id);
    if (!entry) throw new NotFoundError("Wishlist item not found");

    if (!STAFF_ROLES.includes(actor.role) && entry.userId !== actor.userId) {
      throw new ForbiddenError("You can only view your own wishlist");
    }
    return entry;
  }



  async remove(id: number, actor: ReviewActor): Promise<WishlistDto> {
    const existing = await this.unitOfWork.Wishlist.findById(id);
    if (!existing) throw new NotFoundError("Wishlist item not found");

    if (!STAFF_ROLES.includes(actor.role) && existing.userId !== actor.userId) {
      throw new ForbiddenError("You can only remove your own wishlist items");
    }
    return this.unitOfWork.Wishlist.delete(id);
  }

  async removeByProduct(productId: number, userId: string, variantId?: number): Promise<WishlistDto> {
    const existing = await this.unitOfWork.Wishlist.findByUserAndProduct(userId, productId, variantId);
    if (!existing) throw new NotFoundError("Wishlist item not found");
    return this.unitOfWork.Wishlist.delete(existing.id);
  }

  async has(productId: number, userId: string, variantId?: number): Promise<boolean> {
    const existing = await this.unitOfWork.Wishlist.findByUserAndProduct(userId, productId, variantId);
    return !!existing;
  }

  async removeByVariant(variantId: number, userId: string): Promise<WishlistDto> {
    const existing = await this.unitOfWork.Wishlist.findByUserAndVariant(userId, variantId);
    if (!existing) throw new NotFoundError("Wishlist item not found");
    return this.unitOfWork.Wishlist.delete(existing.id);
  }

  async hasVariant(variantId: number, userId: string): Promise<boolean> {
    const existing = await this.unitOfWork.Wishlist.findByUserAndVariant(userId, variantId);
    return !!existing;
  }
}
