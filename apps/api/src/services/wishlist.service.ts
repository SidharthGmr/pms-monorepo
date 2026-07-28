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

  async add(productId: number, userId: string, storeCode: string): Promise<WishlistDto> {
    // Saving the same product twice is a no-op, not an error - the button that
    // calls this cannot know the current state on first render.
    const existing = await this.unitOfWork.Wishlist.findByUserAndProduct(userId, productId);
    if (existing) return existing;

    return this.unitOfWork.transaction(async (transactionClient) => {
      // storeCode comes from the product, not the request, so an item can never
      // be filed under a store it does not belong to.
      const product = await transactionClient.product.findFirst({
        where: { id: productId, storeCode, NOT: { status: Status.Trash }, deletedAt: null },
        select: { id: true, storeCode: true },
      });

      if (!product) throw new NotFoundError("Product not found in this store");

      const entry = await transactionClient.wishlist.create({
        data: { userId, productId, storeCode: product.storeCode },
        select: { id: true },
      });

      // Read back through the transaction client - the global one cannot see this row yet.
      const created = await this.unitOfWork.Wishlist.findById(entry.id, transactionClient);
      if (!created) throw new NotFoundError("Wishlist item not found");
      return created;
    });
  }

  async remove(id: number, actor: ReviewActor): Promise<WishlistDto> {
    const existing = await this.unitOfWork.Wishlist.findById(id);
    if (!existing) throw new NotFoundError("Wishlist item not found");

    if (!STAFF_ROLES.includes(actor.role) && existing.userId !== actor.userId) {
      throw new ForbiddenError("You can only remove your own wishlist items");
    }
    return this.unitOfWork.Wishlist.delete(id);
  }

  async removeByProduct(productId: number, userId: string): Promise<WishlistDto> {
    const existing = await this.unitOfWork.Wishlist.findByUserAndProduct(userId, productId);
    if (!existing) throw new NotFoundError("Wishlist item not found");
    return this.unitOfWork.Wishlist.delete(existing.id);
  }

  async has(productId: number, userId: string): Promise<boolean> {
    const existing = await this.unitOfWork.Wishlist.findByUserAndProduct(userId, productId);
    return !!existing;
  }
}
