'use client';
import VariantCard, { VariantCardSkeleton } from '@/components/features/public-variants/variant-card';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { useGetAllPublicProductVariants } from '@/hooks/service-hooks/useProductVariantService';
import { Sparkles } from 'lucide-react';
import { useMemo } from 'react';

const SLIDE = 'pl-4 basis-1/2 sm:basis-1/3 lg:basis-1/4';
const SKELETON_COUNT = 4;
const MAX_FEATURED = 12;

// Only variants flagged `isFeatured` are requested; the public route already limits the result
// to active variants of published products, so nothing unsellable can land in the strip.
export default function FeaturedProducts() {
  const { data, isLoading, isError } = useGetAllPublicProductVariants({
    isFeatured: true,
    page: 1,
    recordPerPage: MAX_FEATURED,
    sortBy: 'createdAt',
    sortDirection: 'DESC',
  });

  const variants = useMemo(() => data?.data?.data?.data ?? [], [data]);

  if (isError || (!isLoading && variants.length === 0)) return null;

  return (
    <section id="featured" className="py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Carousel opts={{ align: 'start', dragFree: true }} className="w-full">
          <div className="mb-6 flex items-end justify-between gap-4">
            <div className="min-w-0">
              <p className="mb-1 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-primary">
                <Sparkles className="h-3.5 w-3.5" />
                Hand-picked
              </p>
              <h2 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">Featured products</h2>
              <p className="mt-1 text-sm text-muted-foreground">Our current favourites, ready to ship.</p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <CarouselPrevious className="static translate-y-0" />
              <CarouselNext className="static translate-y-0" />
            </div>
          </div>

          <CarouselContent className="-ml-4">
            {isLoading
              ? Array.from({ length: SKELETON_COUNT }, (_, i) => (
                  <CarouselItem key={i} className={SLIDE}>
                    <VariantCardSkeleton />
                  </CarouselItem>
                ))
              : variants.map((variant) => (
                  <CarouselItem key={variant.id} className={SLIDE}>
                    <VariantCard variant={variant} />
                  </CarouselItem>
                ))}
          </CarouselContent>
        </Carousel>
      </div>
    </section>
  );
}
