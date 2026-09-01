'use client';
import { ProductVariantListItemDto } from '@/dtos/product-variant.dto';
import { ProductVariantSummaryDto } from '@/dtos/product.dto';
import { useMemo } from 'react';
import { useGetAllProductVariants } from './service-hooks/useProductVariantService';

/**
 * Money and stock for one product, aggregated from its variants.
 *
 * `GET /products` is a thin list - price lives in the PriceHistory ledger and stock is the
 * sum of the stockHistory movements, both held per variant - so the screens that show either
 * figure resolve them from `/product-variants` instead.
 */
export interface ProductPricing {
  /** The first priced active variant's amounts, ordered by variant id. Null when unpriced. */
  sellingPrice: number | null;
  costPrice: number | null;
  /** Sellable stock: the sum across this product's active variants. */
  stock: number;
  /** The lowest threshold among the variants - one low size makes the product low. */
  lowStockThreshold: number | null;
  variantCount: number;
  /** Priced variants, for the callers that list "S / M / L" chips. */
  variants: ProductVariantSummaryDto[];
}

export type ProductPricingMap = Map<number, ProductPricing>;

function aggregate(variants: ProductVariantListItemDto[]): ProductPricingMap {
  const map: ProductPricingMap = new Map();

  // Ascending id, so "the first priced variant" is stable rather than whichever row the
  // API happened to return first. This mirrors what the products list used to compute
  // server-side, so the displayed price does not move with this change.
  const ordered = [...variants].sort((a, b) => a.id - b.id);

  for (const variant of ordered) {
    // The list row carries its parent nested; there is no top-level productId on it.
    const productId = variant.product.id;
    const existing = map.get(productId);

    // Only priced variants are listed: the chips show a price range, and an unpriced row
    // would drag it to a fabricated zero.
    const summary: ProductVariantSummaryDto[] =
      variant.sellingPrice != null
        ? [
          {
            id: variant.id,
            sku: variant.sku ?? '',
            // The shared DTO types this as JsonValue; the chips only ever render scalars.
            attributes: (variant.attributes as Record<string, string | number | boolean> | null) ?? null,
            stockQuantity: variant.stockQuantity ?? 0,
            sellingPrice: variant.sellingPrice,
            costPrice: variant.costPrice ?? null,
          },
        ]
        : [];

    if (!existing) {
      map.set(productId, {
        sellingPrice: variant.sellingPrice ?? null,
        costPrice: variant.costPrice ?? null,
        stock: variant.stockQuantity ?? 0,
        lowStockThreshold: variant.lowStockThreshold ?? null,
        variantCount: 1,
        variants: summary,
      });
      continue;
    }

    existing.stock += variant.stockQuantity ?? 0;
    existing.variantCount += 1;
    existing.variants.push(...summary);

    // An unpriced first variant must not leave the product looking unpriced when a later
    // one does carry a price.
    if (existing.sellingPrice == null && variant.sellingPrice != null) {
      existing.sellingPrice = variant.sellingPrice;
      existing.costPrice = variant.costPrice ?? null;
    }

    if (variant.lowStockThreshold != null) {
      existing.lowStockThreshold =
        existing.lowStockThreshold == null ? variant.lowStockThreshold : Math.min(existing.lowStockThreshold, variant.lowStockThreshold);
    }
  }

  return map;
}

/**
 * Resolves price and stock for the products currently on screen in a single request.
 *
 * ```ts
 * const { pricing, isLoading } = useProductPricing(products.map((p) => p.id));
 * const price = pricing.get(product.id)?.sellingPrice; // null = unpriced, undefined = not loaded
 * ```
 */
export const useProductPricing = (productIds: number[]) => {
  // Deduped, sorted and joined so a re-render that reorders the same ids does not invalidate
  // the React Query cache key. `filter` rather than a Set: this project's tsconfig target
  // cannot iterate one.
  const idsParam = useMemo(
    () =>
      productIds
        .filter((id, index) => productIds.indexOf(id) === index)
        .sort((a, b) => a - b)
        .join(','),
    [productIds]
  );

  const { data, isLoading, isFetching, error } = useGetAllProductVariants(
    { productIds: idsParam, isActive: true, showAllRecords: true },
    idsParam.length > 0
  );

  const pricing = useMemo(() => aggregate(data?.data?.data?.data ?? []), [data]);

  return {
    pricing,
    /** True while the figures are unknown - render a placeholder rather than a zero. */
    isLoading: idsParam.length > 0 && (isLoading || isFetching),
    error,
  };
};

export default useProductPricing;
