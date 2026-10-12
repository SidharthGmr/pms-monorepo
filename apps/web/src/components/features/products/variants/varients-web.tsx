'use client';
import { useGetAllPublicProductVariants } from '@/hooks/service-hooks/useProductVariantService';
import { ProductVariantListItemDto } from '@pms/types';
import { ArrowRight, Layers } from 'lucide-react';
import Link from 'next/link';
import { useMemo } from 'react';
import VariantCard, { VariantCardSkeleton } from '../../public-variants/variant-card';

const LIMIT = 8;
const SKELETON_COUNT = 4;

interface ProductWebVariantsProps {
  productId: number;
  /** The variant already on screen, so the strip offers only the alternatives. */
  excludeId?: number;
}

// Storefront strip for a product's other variants, shown under the variant detail page. The
// public endpoint only returns published, active variants, so a shopper never sees a retired row.
export default function ProductWebVariants({ productId, excludeId }: ProductWebVariantsProps) {
  const listQuery = useGetAllPublicProductVariants({ productId, recordPerPage: LIMIT }, !!productId);

  const result = listQuery.data?.data?.data;
  const variants = useMemo(
    () => ((result?.data as ProductVariantListItemDto[] | undefined) ?? []).filter((variant) => variant.id !== excludeId),
    [result, excludeId]
  );
  const total = result?.totalRecord ?? 0;

  // On a storefront an empty "no other options" box is noise; the section simply is not there.
  if (listQuery.isError || (!listQuery.isPending && variants.length === 0)) return null;

  return (
    <section aria-labelledby="product-variants-heading">
      <div className="mb-4 flex items-end justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Layers className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <h2 id="product-variants-heading" className="text-lg font-bold tracking-tight sm:text-xl">
              More options for this product
            </h2>
            <p className="text-xs text-muted-foreground sm:text-sm">Other sizes, colours and packs, each with its own price and stock.</p>
          </div>
        </div>

        {total > LIMIT && (
          <Link
            href={`/products?productIds=${productId}`}
            className="group inline-flex shrink-0 items-center gap-1 text-sm font-semibold text-primary hover:underline"
          >
            <span className="hidden sm:inline">View all {total}</span>
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {listQuery.isPending
          ? Array.from({ length: SKELETON_COUNT }, (_, index) => <VariantCardSkeleton key={index} />)
          : variants.map((variant) => <VariantCard key={variant.id} variant={variant} />)}
      </div>
    </section>
  );
}
