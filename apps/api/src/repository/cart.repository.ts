import { CartStatus, Prisma } from '@prisma/client';
import prisma from '../config/prisma';
import { CartDto, CartItemDto } from '../dtos/cart.dto';
import { CartOwner, ICartRepository } from './interfaces/icart.repository';

const cartInclude = {
  items: {
    include: {
      variant: {
        select: {
          id: true,
          productId: true,
          product: { select: { name: true, slug: true, images: true } },
        },
      },
    },
    orderBy: { addedAt: 'asc' as const },
  },
};

type CartWithItems = Prisma.CartGetPayload<{ include: typeof cartInclude }>;

/**
 * `unitPrice` is a Prisma Decimal, which serializes to a JSON string. The API
 * contract exposes plain numbers, so convert at the repository boundary.
 */
function toItemDto(item: CartWithItems['items'][number]): CartItemDto {
  const unitPrice = item.unitPrice?.toNumber() ?? null;
  return {
    id: item.id,
    cartId: item.cartId,
    variantId: item.variantId,
    productId: item.variant.productId,
    productName: item.variant.product.name,
    productSlug: item.variant.product.slug,
    productImages: item.variant.product.images,
    quantity: item.quantity,
    unitPrice,
    lineTotal: unitPrice === null ? null : unitPrice * item.quantity,
    addedAt: item.addedAt,
    updatedAt: item.updatedAt,
  };
}

function toCartDto(cart: CartWithItems): CartDto {
  const items = cart.items.map(toItemDto);
  return {
    id: cart.id,
    storeId: cart.storeId,
    userId: cart.userId,
    sessionToken: cart.sessionToken,
    status: cart.status,
    currency: cart.currency,
    expiresAt: cart.expiresAt,
    createdAt: cart.createdAt,
    updatedAt: cart.updatedAt,
    items,
    itemCount: items.length,
    totalQuantity: items.reduce((sum, i) => sum + i.quantity, 0),
    totalAmount: items.reduce((sum, i) => sum + (i.lineTotal ?? 0), 0),
  };
}

/**
 * A cart belongs either to a signed-in user or to a guest session. Both columns
 * are nullable in the schema, so build the filter from whichever is supplied and
 * never fall back to "any cart in this store".
 */
function ownerWhere(owner: CartOwner): Prisma.CartWhereInput {
  if (owner.userId) return { storeId: owner.storeId, userId: owner.userId };
  return { storeId: owner.storeId, sessionToken: owner.sessionToken };
}

export class CartRepository implements ICartRepository {
  async getActive(owner: CartOwner, tx: Prisma.TransactionClient = prisma): Promise<CartDto | null> {
    const cart = await tx.cart.findFirst({
      where: { ...ownerWhere(owner), status: CartStatus.ACTIVE },
      include: cartInclude,
      orderBy: { updatedAt: 'desc' },
    });
    return cart ? toCartDto(cart) : null;
  }

  async getOrCreateActive(owner: CartOwner, currency: string, tx: Prisma.TransactionClient = prisma): Promise<CartDto> {
    const existing = await this.getActive(owner, tx);
    if (existing) return existing;

    const created = await tx.cart.create({
      data: {
        storeId: owner.storeId,
        userId: owner.userId ?? null,
        sessionToken: owner.sessionToken ?? null,
        status: CartStatus.ACTIVE,
        currency,
      },
      include: cartInclude,
    });
    return toCartDto(created);
  }

  async getById(cartId: number, tx: Prisma.TransactionClient = prisma): Promise<CartDto | null> {
    const cart = await tx.cart.findUnique({ where: { id: cartId }, include: cartInclude });
    return cart ? toCartDto(cart) : null;
  }

  async addItem(
    cartId: number,
    variantId: number,
    quantity: number,
    unitPrice: number | null,
    tx: Prisma.TransactionClient = prisma
  ): Promise<void> {
    // (cartId, variantId) is unique, so upsert turns a repeat add into an
    // increment rather than a constraint violation.
    await tx.cartItem.upsert({
      where: { cartId_variantId: { cartId, variantId } },
      create: { cartId, variantId, quantity, unitPrice },
      update: { quantity: { increment: quantity }, unitPrice },
    });
    await this.touch(cartId, tx);
  }

  async setItemQuantity(cartId: number, variantId: number, quantity: number, tx: Prisma.TransactionClient = prisma): Promise<void> {
    if (quantity <= 0) {
      await this.removeItem(cartId, variantId, tx);
      return;
    }
    await tx.cartItem.update({
      where: { cartId_variantId: { cartId, variantId } },
      data: { quantity },
    });
    await this.touch(cartId, tx);
  }

  async removeItem(cartId: number, variantId: number, tx: Prisma.TransactionClient = prisma): Promise<void> {
    // deleteMany rather than delete: removing an absent line is a no-op instead
    // of a P2025, which keeps the endpoint idempotent.
    await tx.cartItem.deleteMany({ where: { cartId, variantId } });
    await this.touch(cartId, tx);
  }

  async clearItems(cartId: number, tx: Prisma.TransactionClient = prisma): Promise<void> {
    await tx.cartItem.deleteMany({ where: { cartId } });
    await this.touch(cartId, tx);
  }

  /**
   * Item writes do not touch the parent row, so `Cart.updatedAt` would go stale
   * and the `[storeId, status, updatedAt]` index would stop reflecting activity.
   */
  private async touch(cartId: number, tx: Prisma.TransactionClient): Promise<void> {
    await tx.cart.update({ where: { id: cartId }, data: { updatedAt: new Date() } });
  }
}
