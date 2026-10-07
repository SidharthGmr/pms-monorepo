'use client';

import VariantCard, { VariantCardSkeleton } from '@/components/features/public-variants/variant-card';
import { Button } from '@/components/ui/button';
import { useGetAllPublicProductVariants } from '@/hooks/service-hooks/useProductVariantService';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { useMemo } from 'react';
import SectionHeading from './SectionHeading';

const GRID_SIZE = 8;

// The newest sellable SKUs as a taster grid; the full, filterable catalogue lives on /products,
// so the homepage stays a shop window instead of embedding the whole list.
export default function NewArrivals() {
  const { data, isLoading, isError } = useGetAllPublicProductVariants({ page: 1, recordPerPage: GRID_SIZE, sortBy: 'createdAt', sortDirection: 'DESC' });

  const variants = useMemo(() => data?.data?.data?.data ?? [], [data]);
  const total = data?.data?.data?.totalRecord ?? 0;

  if (isError || (!isLoading && variants.length === 0)) return null;

  return (
    <section id="new-arrivals" className="bg-muted/40 py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading title="New arrivals" href="/products" cta="View all" />

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {isLoading
            ? Array.from({ length: GRID_SIZE }, (_, index) => <VariantCardSkeleton key={index} />)
            : variants.map((variant) => <VariantCard key={variant.id} variant={variant} />)}
        </div>

        {total > GRID_SIZE && (
          <div className="mt-8 text-center">
            <Link href="/products">
              <Button size="lg" variant="outline" className="h-11 gap-2 rounded-full px-8 font-semibold">
                Browse all {total} products
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
