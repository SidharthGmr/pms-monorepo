import { Prisma } from '@prisma/client';
import { CartChargesDto } from '@pms/types';
import env from '../config/env';

/**
 * The store-wide charges added on top of a cart's subtotal. They come from configuration
 * (CART_* in .env) rather than the database, so every cart and checkout on this server
 * applies the same rule: tax as a percentage of the subtotal, a flat platform fee, and a
 * flat shipping charge that is waived once the subtotal reaches the free-shipping threshold.
 */
const money = (value: Prisma.Decimal): number => value.toDecimalPlaces(2).toNumber();

export function computeCartCharges(subtotal: Prisma.Decimal | number): CartChargesDto {
  const base = new Prisma.Decimal(subtotal);
  const hasItems = base.greaterThan(0);

  const taxRate = env.CART_TAX_RATE;
  const tax = hasItems ? base.mul(taxRate).div(100) : new Prisma.Decimal(0);
  const platformFee = hasItems ? new Prisma.Decimal(env.CART_PLATFORM_FEE) : new Prisma.Decimal(0);

  const freeShippingAbove = env.CART_FREE_SHIPPING_ABOVE ?? null;
  const shippingWaived = hasItems && freeShippingAbove !== null && base.greaterThanOrEqualTo(freeShippingAbove);
  const shippingCharge = hasItems && !shippingWaived ? new Prisma.Decimal(env.CART_SHIPPING_CHARGE) : new Prisma.Decimal(0);

  const grandTotal = base.add(tax).add(platformFee).add(shippingCharge);

  return {
    subtotal: money(base),
    taxRate,
    tax: money(tax),
    platformFee: money(platformFee),
    shippingCharge: money(shippingCharge),
    freeShippingAbove,
    shippingWaived,
    grandTotal: money(grandTotal),
  };
}
