import { Prisma } from '@prisma/client';
import { inject, injectable } from 'inversify';
import { TYPES } from '../config/ioc.types';
import { CartDto } from '../dtos/cart.dto';
import ClientError from '../exceptions/client-error';
import NotFoundError from '../exceptions/not-found-error';
import { AddToCartModel, UpdateCartItemModel } from '../models/cart.model';
import { CartOwner, ICartRepository } from '../repository/interfaces/icart.repository';
import type IUnitOfWork from '../repository/interfaces/iunitofwork.repository';
import { ICartService } from './interfaces/Icart.service';

const DEFAULT_CURRENCY = 'INR';

@injectable()
export class CartService implements ICartService {
  constructor(@inject(TYPES.IUnitOfWork) private unitOfWork: IUnitOfWork) { }

  private get cartRepo(): ICartRepository {
    return this.unitOfWork.Cart;
  }

  private assertOwner(owner: CartOwner): void {
    if (!owner.userId && !owner.sessionToken) {
      throw new ClientError('A cart needs either a signed-in user or a session token.');
    }
  }

  /**
   * CartItem references ProductVariant, but callers pass products. Resolve to the product's
   * default (first active) variant and price it from the ledger, matching what product
   * listings show as `currentPrice`.
   */
  private async resolveVariant(productId: number, tx: Prisma.TransactionClient): Promise<{ variantId: number; unitPrice: number }> {
    const [variant] = await this.unitOfWork.ProductVariant.getActive(productId, tx);
    if (!variant) {
      throw new ClientError(`Product ${productId} has no active variant yet, so it cannot be added to a cart.`);
    }
    if (variant.sellingPrice == null) {
      throw new ClientError(`Product ${productId} has no price yet, so it cannot be added to a cart.`);
    }
    return { variantId: variant.id, unitPrice: variant.sellingPrice };
  }

  async getActive(owner: CartOwner): Promise<CartDto | null> {
    this.assertOwner(owner);
    return this.cartRepo.getActive(owner);
  }

  async addProducts(data: AddToCartModel): Promise<CartDto> {
    const owner: CartOwner = { storeId: data.storeId, userId: data.userId, sessionToken: data.sessionToken };
    this.assertOwner(owner);

    if (!data.productIds || data.productIds.length === 0) {
      throw new ClientError('Provide at least one productId to add to the cart.');
    }

    // A repeated id means "add another one", so collapse to id -> quantity
    // instead of issuing one write per element.
    const quantityByProduct = new Map<number, number>();
    for (const productId of data.productIds) {
      if (!Number.isInteger(productId) || productId <= 0) {
        throw new ClientError(`'${productId}' is not a valid productId.`);
      }
      quantityByProduct.set(productId, (quantityByProduct.get(productId) ?? 0) + 1);
    }

    return this.unitOfWork.transaction(async (tx) => {
      const cart = await this.cartRepo.getOrCreateActive(owner, data.currency ?? DEFAULT_CURRENCY, tx);

      for (const [productId, quantity] of quantityByProduct) {
        const { variantId, unitPrice } = await this.resolveVariant(productId, tx);
        await this.cartRepo.addItem(cart.id, variantId, quantity, unitPrice, tx);
      }

      // Re-read so the response carries the recomputed totals.
      const updated = await this.cartRepo.getById(cart.id, tx);
      if (!updated) throw new NotFoundError('Cart not found after adding items');
      return updated;
    });
  }

  async updateProductQuantity(productId: number, data: UpdateCartItemModel): Promise<CartDto> {
    const owner: CartOwner = { storeId: data.storeId, userId: data.userId, sessionToken: data.sessionToken };
    this.assertOwner(owner);

    if (!Number.isInteger(data.quantity) || data.quantity < 0) {
      throw new ClientError('Quantity must be a whole number of 0 or more.');
    }

    return this.unitOfWork.transaction(async (tx) => {
      const cart = await this.cartRepo.getActive(owner, tx);
      if (!cart) throw new NotFoundError('No active cart found');

      const { variantId } = await this.resolveVariant(productId, tx);
      await this.cartRepo.setItemQuantity(cart.id, variantId, data.quantity, tx);

      const updated = await this.cartRepo.getById(cart.id, tx);
      if (!updated) throw new NotFoundError('Cart not found after updating quantity');
      return updated;
    });
  }

  async removeProduct(productId: number, owner: CartOwner): Promise<CartDto> {
    this.assertOwner(owner);

    return this.unitOfWork.transaction(async (tx) => {
      const cart = await this.cartRepo.getActive(owner, tx);
      if (!cart) throw new NotFoundError('No active cart found');

      const { variantId } = await this.resolveVariant(productId, tx);
      await this.cartRepo.removeItem(cart.id, variantId, tx);

      const updated = await this.cartRepo.getById(cart.id, tx);
      if (!updated) throw new NotFoundError('Cart not found after removing item');
      return updated;
    });
  }

  async clear(owner: CartOwner): Promise<CartDto> {
    this.assertOwner(owner);

    return this.unitOfWork.transaction(async (tx) => {
      const cart = await this.cartRepo.getActive(owner, tx);
      if (!cart) throw new NotFoundError('No active cart found');

      await this.cartRepo.clearItems(cart.id, tx);

      const updated = await this.cartRepo.getById(cart.id, tx);
      if (!updated) throw new NotFoundError('Cart not found after clearing');
      return updated;
    });
  }
}
