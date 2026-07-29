'use client';
import { Badge } from '@/components/ui/badge';
import { ProductVariantSummaryDto } from '@/dtos/product.dto';
import { cn } from '@/lib/utils';
import { useMemo } from 'react';

interface ProductVariantsStripProps {
  variants?: ProductVariantSummaryDto[] | null;
}

const money = (value: number) => `$${Number(value).toFixed(2)}`;

/** "Red / L" from `{ color: 'Red', size: 'L' }`. */
const describe = (variant: ProductVariantSummaryDto): string => {
  const attributes = variant.attributes;
  if (!attributes || typeof attributes !== 'object') return '';
  const values = Object.values(attributes).filter((value) => value !== null && value !== undefined && value !== '');
  return values.map(String).join(' / ');
};

const MAX_SHOWN = 4;

/**
 * The product's variants on a POS catalog card.
 *
 * Read-only on purpose: the cart API addresses lines by product and resolves the variant
 * server-side, so a picker here could not change what actually gets sold. These chips
 * tell the operator what exists and at what price.
 */
export default function ProductVariantsStrip({ variants }: ProductVariantsStripProps) {
  const real = useMemo(
    // A product priced through the product form has one attribute-less variant; that is
    // a price row, not a variant worth listing.
    () => (variants ?? []).filter((variant) => describe(variant) !== ''),
    [variants]
  );

  if (real.length === 0) return null;

  const prices = real.map((variant) => variant.sellingPrice);
  const low = Math.min(...prices);
  const high = Math.max(...prices);
  const shown = real.slice(0, MAX_SHOWN);
  const hidden = real.length - shown.length;

  return (
    <div className="mb-2 space-y-1.5">
      <div className="flex items-baseline gap-1.5 text-[11px] text-muted-foreground">
        <span className="font-medium text-foreground">
          {real.length} variant{real.length === 1 ? '' : 's'}
        </span>
        <span>{low === high ? money(low) : `${money(low)} – ${money(high)}`}</span>
      </div>

      <div className="flex flex-wrap gap-1">
        {shown.map((variant) => {
          const soldOut = variant.stockQuantity <= 0;
          return (
            <Badge
              key={variant.id}
              variant={soldOut ? 'zinc' : 'blue'}
              className={cn('font-normal', soldOut && 'opacity-60 line-through')}
              title={`${describe(variant)} · ${money(variant.sellingPrice)} · ${variant.stockQuantity} in stock${
                variant.sku ? ` · ${variant.sku}` : ''
              }`}
            >
              {describe(variant)}
            </Badge>
          );
        })}
        {hidden > 0 && (
          <Badge variant="zinc" className="font-normal" title={real.slice(MAX_SHOWN).map(describe).join(', ')}>
            +{hidden}
          </Badge>
        )}
      </div>
    </div>
  );
}
