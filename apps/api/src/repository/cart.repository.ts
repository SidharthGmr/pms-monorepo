import { CartDto, CartItemDto } from '@pms/types';
import { CartStatus, Prisma } from '@prisma/client';
import prisma from '../config/prisma';
import { CartOwner, ICartRepository } from './interfaces/icart.repository';

/** An untouched cart expires after this long. Every write pushes the deadline back. */
export const CART_TTL_DAYS = 30;

const expiryFrom = (from: Date = new Date()): Date => new Date(from.getTime() + CART_TTL_DAYS * 24 * 60 * 60 * 1000);

const cartInclude = {
  items: {
    include: {
      variant: {
        select: {
          id: true,
          name: true,
          productId: true,
          product: { select: { name: true, slug: true, images: true } },
        },
      },
    },
    orderBy: { addedAt: 'asc' as const },
  },
};

type CartWithItems = Prisma.CartGetPayload<{ include: typeof cartInclude }>;

// Money is summed as Decimal and rounded once at the edge. Adding JS floats line by line
// drifts (0.1 + 0.2 !== 0.3), so the cart total could disagree with the order total.
const lineTotalOf = (item: CartWithItems['items'][number]): Prisma.Decimal | null =>
  item.unitPrice === null ? null : item.unitPrice.mul(item.quantity);

const toMoney = (value: Prisma.Decimal): number => value.toDecimalPlaces(2).toNumber();

function toItemDto(item: CartWithItems['items'][number]): CartItemDto {
  const lineTotal = lineTotalOf(item);
  return {
    id: item.id,
    cartId: item.cartId,
    variantId: item.variantId,
    variantName: item.variant.name,
    productId: item.variant.productId,
    productName: item.variant.product.name,
    productSlug: item.variant.product.slug,
    productImages: item.variant.product.images,
    quantity: item.quantity,
    unitPrice: item.unitPrice === null ? null : toMoney(item.unitPrice),
    lineTotal: lineTotal === null ? null : toMoney(lineTotal),
    addedAt: item.addedAt,
    updatedAt: item.updatedAt,
  };
}

function toCartDto(cart: CartWithItems): CartDto {
  const items = cart.items.map(toItemDto);
  const totalAmount = cart.items.reduce((sum, item) => {
    const line = lineTotalOf(item);
    return line === null ? sum : sum.add(line);
  }, new Prisma.Decimal(0));

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
    totalAmount: toMoney(totalAmount),
  };
}

function ownerWhere(owner: CartOwner): Prisma.CartWhereInput {
  if (owner.userId) return { storeId: owner.storeId, userId: owner.userId };
  return { storeId: owner.storeId, sessionToken: owner.sessionToken };
}

/** An ACTIVE cart counts only while it has not passed its deadline. Null means "no deadline yet". */
function liveWhere(now: Date): Prisma.CartWhereInput {
  return { status: CartStatus.ACTIVE, OR: [{ expiresAt: null }, { expiresAt: { gt: now } }] };
}

export class CartRepository implements ICartRepository {
  async getActive(owner: CartOwner, tx: Prisma.TransactionClient = prisma): Promise<CartDto | null> {
    const cart = await tx.cart.findFirst({
      where: { ...ownerWhere(owner), ...liveWhere(new Date()) },
      include: cartInclude,
      orderBy: { updatedAt: 'desc' },
    });
    return cart ? toCartDto(cart) : null;
  }

  async getOrCreateActive(owner: CartOwner, currency: string, tx: Prisma.TransactionClient = prisma): Promise<CartDto> {
    const existing = await this.getActive(owner, tx);
    if (existing) return existing;

    const now = new Date();

    // A cart past its deadline is retired first, otherwise it would still hold the
    // one-active-cart-per-user slot enforced by `Cart_active_owner_key`.
    await tx.cart.updateMany({
      where: { ...ownerWhere(owner), status: CartStatus.ACTIVE, expiresAt: { lte: now } },
      data: { status: CartStatus.EXPIRED },
    });

    if (owner.userId) {
      // Find-then-create is a race: two quick "Add to cart" clicks both see no cart and both
      // insert, leaving two ACTIVE carts. `Cart_active_owner_key` (migration
      // 20260930120000_review_fixes) allows one per user and store, and ON CONFLICT DO NOTHING
      // makes the loser of the race fall through to reading the winner's cart.
      await tx.$executeRaw`
        INSERT INTO "Cart" ("storeId", "userId", "status", "currency", "expiresAt", "updatedAt")
        VALUES (${owner.storeId}, ${owner.userId}, 'ACTIVE'::"CartStatus", ${currency}, ${expiryFrom(now)}, ${now})
        ON CONFLICT ("storeId", "userId") WHERE "status" = 'ACTIVE'::"CartStatus" AND "userId" IS NOT NULL
        DO NOTHING`;

      const cart = await this.getActive(owner, tx);
      if (!cart) throw new Error('Active cart could not be created.');
      return cart;
    }

    const created = await tx.cart.create({
      data: {
        storeId: owner.storeId,
        userId: null,
        sessionToken: owner.sessionToken ?? null,
        status: CartStatus.ACTIVE,
        currency,
        expiresAt: expiryFrom(now),
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

  /** Any write is activity, so it also pushes the expiry deadline back. */
  private async touch(cartId: number, tx: Prisma.TransactionClient): Promise<void> {
    const now = new Date();
    await tx.cart.update({ where: { id: cartId }, data: { updatedAt: now, expiresAt: expiryFrom(now) } });
  }
}
