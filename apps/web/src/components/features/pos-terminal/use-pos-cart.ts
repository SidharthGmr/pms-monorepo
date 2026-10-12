'use client';
import { ProductVariantListItemDto } from '@pms/types';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { HeldOrder, PosCartLine } from './types';

const CART_KEY = 'pos.cart.v1';
const HELD_KEY = 'pos.held.v1';

// The price the till charges: the offer price while one is on, else the selling price.
export const payableOf = (variant: ProductVariantListItemDto): number =>
  Number(variant.isOffer && variant.offerPrice != null ? variant.offerPrice : variant.sellingPrice) || 0;

const read = <T,>(key: string, fallback: T): T => {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
};

const persist = (key: string, value: unknown) => {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    return;
  }
};

/**
 * The till's order state. Both the running cart and the held orders live in localStorage, so a
 * refresh, a crash or an accidental tab close never loses a sale in progress. Hydration happens
 * after mount so the server and first client render agree.
 */
export function usePosCart() {
  const [lines, setLines] = useState<PosCartLine[]>([]);
  const [held, setHeld] = useState<HeldOrder[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setLines(read<PosCartLine[]>(CART_KEY, []));
    setHeld(read<HeldOrder[]>(HELD_KEY, []));
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) persist(CART_KEY, lines);
  }, [lines, hydrated]);

  useEffect(() => {
    if (hydrated) persist(HELD_KEY, held);
  }, [held, hydrated]);

  const addVariant = useCallback((variant: ProductVariantListItemDto) => {
    setLines((current) => {
      const existing = current.find((line) => line.variantId === variant.id);
      const stock = variant.stockQuantity ?? 0;
      if (existing) {
        if (existing.quantity >= stock) return current;
        return current.map((line) => (line.variantId === variant.id ? { ...line, quantity: line.quantity + 1 } : line));
      }
      if (stock <= 0) return current;
      return [
        ...current,
        {
          variantId: variant.id,
          name: variant.name ?? variant.sku,
          sku: variant.sku,
          image: variant.images?.[0] ?? null,
          unitPrice: payableOf(variant),
          stock,
          quantity: 1,
        },
      ];
    });
  }, []);

  const setQuantity = useCallback((variantId: number, quantity: number) => {
    setLines((current) =>
      quantity <= 0
        ? current.filter((line) => line.variantId !== variantId)
        : current.map((line) => (line.variantId === variantId ? { ...line, quantity: Math.min(quantity, line.stock) } : line))
    );
  }, []);

  const removeLine = useCallback((variantId: number) => {
    setLines((current) => current.filter((line) => line.variantId !== variantId));
  }, []);

  const clear = useCallback(() => setLines([]), []);

  const hold = useCallback(() => {
    setLines((current) => {
      if (current.length === 0) return current;
      const order: HeldOrder = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        label: `${current.reduce((n, line) => n + line.quantity, 0)} items \· ${current[0].name}${current.length > 1 ? ` +${current.length - 1}` : ''}`,
        heldAt: new Date().toISOString(),
        lines: current,
      };
      setHeld((orders) => [order, ...orders]);
      return [];
    });
  }, []);

  // Resuming swaps the carts: whatever is on the till goes on hold so neither order is lost.
  const resume = useCallback((id: string) => {
    setHeld((orders) => {
      const target = orders.find((order) => order.id === id);
      if (!target) return orders;
      let rest = orders.filter((order) => order.id !== id);
      setLines((current) => {
        if (current.length > 0) {
          rest = [
            {
              id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
              label: `${current.reduce((n, line) => n + line.quantity, 0)} items \· ${current[0].name}${current.length > 1 ? ` +${current.length - 1}` : ''}`,
              heldAt: new Date().toISOString(),
              lines: current,
            },
            ...rest,
          ];
        }
        return target.lines;
      });
      return rest;
    });
  }, []);

  const discardHeld = useCallback((id: string) => {
    setHeld((orders) => orders.filter((order) => order.id !== id));
  }, []);

  const totals = useMemo(() => {
    const units = lines.reduce((n, line) => n + line.quantity, 0);
    const subtotal = lines.reduce((n, line) => n + line.quantity * line.unitPrice, 0);
    return { units, subtotal };
  }, [lines]);

  const quantityOf = useCallback((variantId: number) => lines.find((line) => line.variantId === variantId)?.quantity ?? 0, [lines]);

  return { lines, held, hydrated, totals, quantityOf, addVariant, setQuantity, removeLine, clear, hold, resume, discardHeld };
}
