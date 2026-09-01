import { Prisma } from '@prisma/client';
import prisma from '../config/prisma';

/**
 * Price and stock are no longer cached on `ProductVariant`. Price is resolved from the
 * PriceHistory ledger and stock from the stockHistory movements, so every read path needs
 * the same derivation - these helpers are it.
 */

export interface EffectivePrice {
  sellingPrice: number;
  /** The promotional amount on this ledger row. Only charged while the variant's `isOffer` is on. */
  offerPrice: number | null;
  costPrice: number | null;
  compareAtPrice: number | null;
}

const toNumber = (value: Prisma.Decimal | null | undefined): number | null => value?.toNumber() ?? null;

/**
 * A price row is in force on `date` when it has started and has not been superseded.
 * `effectiveTo` is null for the open-ended current price and set once a later row takes over,
 * so a future-dated price stages harmlessly until its date arrives.
 */
export function effectiveOn(date: Date): Prisma.PriceHistoryWhereInput {
  return {
    effectiveFrom: { lte: date },
    OR: [{ effectiveTo: null }, { effectiveTo: { gt: date } }],
    deletedAt: null,
  };
}

/** Two rows can share an effective date; the later-recorded one wins. */
export const EFFECTIVE_ORDER: Prisma.PriceHistoryOrderByWithRelationInput[] = [{ effectiveFrom: 'desc' }, { id: 'desc' }];

export function toEffectivePrice(row: {
  sellingPrice: Prisma.Decimal;
  offerPrice: Prisma.Decimal | null;
  costPrice: Prisma.Decimal | null;
  compareAtPrice: Prisma.Decimal | null;
}): EffectivePrice {
  return {
    sellingPrice: row.sellingPrice.toNumber(),
    offerPrice: toNumber(row.offerPrice),
    costPrice: toNumber(row.costPrice),
    compareAtPrice: toNumber(row.compareAtPrice),
  };
}

/**
 * What the customer actually pays. The offer amount lives on the ledger row but the switch
 * lives on the variant, so neither alone decides it: an offer price with the flag off is a
 * staged promotion, and the flag with no offer price falls back to the selling price.
 *
 * Every money path - cart line, order line - must price through this rather than reading
 * `sellingPrice` directly, or the cart total will disagree with the card.
 */
export function payablePrice(price: EffectivePrice | null, isOffer: boolean): number | null {
  if (!price) return null;
  return isOffer && price.offerPrice != null ? price.offerPrice : price.sellingPrice;
}

/** The same rule applied to an already-decorated variant, which carries all three fields. */
export function payableForVariant(variant: { sellingPrice: number | null; offerPrice: number | null; isOffer: boolean }): number | null {
  if (variant.sellingPrice == null) return null;
  return variant.isOffer && variant.offerPrice != null ? variant.offerPrice : variant.sellingPrice;
}

/** The price in force for one variant on a date, or null if it has never been priced. */
export async function priceForVariant(
  variantId: number,
  date: Date = new Date(),
  tx: Prisma.TransactionClient = prisma
): Promise<EffectivePrice | null> {
  const row = await tx.priceHistory.findFirst({
    where: { variantId, ...effectiveOn(date) },
    orderBy: EFFECTIVE_ORDER,
  });
  return row ? toEffectivePrice(row) : null;
}

/**
 * Batched form of `priceForVariant` - one query for a whole page of variants. Rows come back
 * newest-first, so the first one seen per variant is the one in force.
 */
export async function pricesForVariants(
  variantIds: number[],
  date: Date = new Date(),
  tx: Prisma.TransactionClient = prisma
): Promise<Map<number, EffectivePrice>> {
  const prices = new Map<number, EffectivePrice>();
  if (variantIds.length === 0) return prices;

  const rows = await tx.priceHistory.findMany({
    where: { variantId: { in: variantIds }, ...effectiveOn(date) },
    orderBy: EFFECTIVE_ORDER,
  });

  for (const row of rows) {
    if (!prices.has(row.variantId)) prices.set(row.variantId, toEffectivePrice(row));
  }
  return prices;
}

/** On-hand stock for one variant: the sum of its movements. */
export async function stockForVariant(variantId: number, tx: Prisma.TransactionClient = prisma): Promise<number> {
  const result = await tx.stockHistory.aggregate({ where: { variantId }, _sum: { quantity: true } });
  return result._sum.quantity ?? 0;
}

/** Batched form of `stockForVariant`. Variants with no movements are simply absent from the map. */
export async function stockForVariants(variantIds: number[], tx: Prisma.TransactionClient = prisma): Promise<Map<number, number>> {
  const stock = new Map<number, number>();
  if (variantIds.length === 0) return stock;

  const rows = await tx.stockHistory.groupBy({
    by: ['variantId'],
    where: { variantId: { in: variantIds } },
    _sum: { quantity: true },
  });

  for (const row of rows) {
    if (row.variantId != null) stock.set(row.variantId, row._sum.quantity ?? 0);
  }
  return stock;
}
