import { Prisma } from '@prisma/client';
import { CartDto } from '../../dtos/cart.dto';

/**
 * A cart belongs to exactly one of a signed-in user or a guest session, so both
 * fields are always present and one of them is null. They are nullable rather
 * than optional because `exactOptionalPropertyTypes` is on: an absent property
 * and an explicitly-undefined one are not interchangeable here.
 */
export interface CartOwner {
  storeId: number;
  userId: string | null;
  sessionToken: string | null;
}

export interface ICartRepository {
  /** The owner's ACTIVE cart for a store, or null when they have none yet. */
  getActive(owner: CartOwner, tx?: Prisma.TransactionClient): Promise<CartDto | null>;

  /**
   * The owner's ACTIVE cart, created if it does not exist. Callers should run
   * this inside a transaction so the find-then-create pair cannot interleave
   * (the schema has no unique index on (userId, storeId, status)).
   */
  getOrCreateActive(owner: CartOwner, currency: string, tx?: Prisma.TransactionClient): Promise<CartDto>;

  getById(cartId: number, tx?: Prisma.TransactionClient): Promise<CartDto | null>;

  /**
   * Adds `quantity` of a variant, summing onto the existing line when the
   * variant is already in the cart.
   */
  addItem(
    cartId: number,
    variantId: number,
    quantity: number,
    unitPrice: number | null,
    tx?: Prisma.TransactionClient
  ): Promise<void>;

  /** Sets an absolute quantity for a variant's line. */
  setItemQuantity(cartId: number, variantId: number, quantity: number, tx?: Prisma.TransactionClient): Promise<void>;

  removeItem(cartId: number, variantId: number, tx?: Prisma.TransactionClient): Promise<void>;

  /** Deletes every line but keeps the cart row itself. */
  clearItems(cartId: number, tx?: Prisma.TransactionClient): Promise<void>;
}
