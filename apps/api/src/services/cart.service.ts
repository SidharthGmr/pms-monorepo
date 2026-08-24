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

  /**
   * Resolves a variant the shopper picked explicitly. Unlike the product path this cannot
   * guess wrong - but it has to prove the variant is sellable and belongs to this store,
   * because the id arrives from the client.
   */
  private async resolveChosenVariant(variantId: number, storeId: number, tx: Prisma.TransactionClient): Promise<{ variantId: number; unitPrice: number }> {
    const store = await this.unitOfWork.Store.getById(storeId);
    const variant = await this.unitOfWork.ProductVariant.findById(variantId, tx);

    if (!variant || !variant.isActive) {
      throw new ClientError(`Variant ${variantId} is not available.`);
    }
    if (store && variant.storeCode !== store.code) {
      throw new ClientError(`Variant ${variantId} belongs to a different store.`);
    }
    if (variant.sellingPrice == null) {
      throw new ClientError(`Variant ${variantId} has no price yet, so it cannot be added to a cart.`);
    }
    return { variantId: variant.id, unitPrice: variant.sellingPrice };
  }

  async addProducts(data: AddToCartModel): Promise<CartDto> {
    const owner: CartOwner = { storeId: data.storeId, userId: data.userId, sessionToken: data.sessionToken };
    this.assertOwner(owner);

    // Variant-keyed adds are the storefront path: the shopper chose a specific SKU.
    if (data.variantIds && data.variantIds.length > 0) {
      const quantityByVariant = new Map<number, number>();
      for (const variantId of data.variantIds) {
        if (!Number.isInteger(variantId) || variantId <= 0) {
          throw new ClientError(`'${variantId}' is not a valid variantId.`);
        }
        quantityByVariant.set(variantId, (quantityByVariant.get(variantId) ?? 0) + 1);
      }

      return this.unitOfWork.transaction(async (tx) => {
        const cart = await this.cartRepo.getOrCreateActive(owner, data.currency ?? DEFAULT_CURRENCY, tx);
        for (const [variantId, quantity] of quantityByVariant) {
          const resolved = await this.resolveChosenVariant(variantId, data.storeId, tx);
          await this.cartRepo.addItem(cart.id, resolved.variantId, quantity, resolved.unitPrice, tx);
        }
        const updated = await this.cartRepo.getById(cart.id, tx);
        if (!updated) throw new NotFoundError('Cart not found after adding items');
        return updated;
      });
    }

    if (!data.productIds || data.productIds.length === 0) {
      throw new ClientError('Provide at least one productId or variantId to add to the cart.');
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

  /** Sets an absolute quantity for one SKU. 0 removes the line. */
  async setVariantQuantity(variantId: number, data: UpdateCartItemModel): Promise<CartDto> {
    const owner: CartOwner = { storeId: data.storeId, userId: data.userId, sessionToken: data.sessionToken };
    this.assertOwner(owner);

    if (!Number.isInteger(data.quantity) || data.quantity < 0) {
      throw new ClientError('Quantity must be a whole number of 0 or more.');
    }

    return this.unitOfWork.transaction(async (tx) => {
      const cart = await this.cartRepo.getActive(owner, tx);
      if (!cart) throw new NotFoundError('No active cart found');

      // The line must already be in this cart, otherwise a stray id would silently no-op.
      if (!cart.items.some((item) => item.variantId === variantId)) {
        throw new NotFoundError(`Variant ${variantId} is not in your cart.`);
      }

      await this.cartRepo.setItemQuantity(cart.id, variantId, data.quantity, tx);

      const updated = await this.cartRepo.getById(cart.id, tx);
      if (!updated) throw new NotFoundError('Cart not found after updating quantity');
      return updated;
    });
  }

  /** Removes one SKU's line, leaving the product's other variants alone. */
  async removeVariant(variantId: number, owner: CartOwner): Promise<CartDto> {
    this.assertOwner(owner);

    return this.unitOfWork.transaction(async (tx) => {
      const cart = await this.cartRepo.getActive(owner, tx);
      if (!cart) throw new NotFoundError('No active cart found');

      await this.cartRepo.removeItem(cart.id, variantId, tx);

      const updated = await this.cartRepo.getById(cart.id, tx);
      if (!updated) throw new NotFoundError('Cart not found after removing item');
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
