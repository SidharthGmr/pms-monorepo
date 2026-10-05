'use client';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { ProductDto } from '@/dtos/product.dto';
import { cn } from '@/lib/utils';
import Autoplay from 'embla-carousel-autoplay';
import { useMemo, useRef } from 'react';
import ProductCard, { ProductCardSkeleton } from './product-card';

const SLIDE = 'pl-3 basis-1/2 sm:basis-1/3 md:basis-1/4 lg:basis-1/5 xl:basis-1/6';
const SKELETON_COUNT = 6;

interface ProductCarouselProps {
  products: ProductDto[];
  loading?: boolean;
  selectedIds?: number[];
  onSelect?: (product: ProductDto) => void;
  title?: string;
  description?: string;
  className?: string;
}

// Autoplay pauses while the pointer is over the strip and resumes after a manual scroll, so
// browsing never fights the user; the plugin instance is kept in a ref so it is created once.
export default function ProductCarousel({
  products,
  loading = false,
  selectedIds = [],
  onSelect,
  title = 'Shop by product',
  description = 'Pick a product to see only its variants below.',
  className,
}: ProductCarouselProps) {
  const autoplay = useRef(Autoplay({ delay: 4000, stopOnInteraction: false, stopOnMouseEnter: true }));
  const selected = useMemo(() => new Set(selectedIds), [selectedIds]);

  if (!loading && products.length === 0) return null;

  return (
    <Carousel opts={{ align: 'start', dragFree: true, loop: products.length > SKELETON_COUNT }} plugins={[autoplay.current]} className={cn('w-full', className)}>
      <div className="mb-3 flex items-end justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-base font-semibold tracking-tight">{title}</h2>
          <p className="truncate text-xs text-muted-foreground">
            {description}
            {!loading && (
              <span className="ml-1 text-muted-foreground/70">
                · {products.length} {products.length === 1 ? 'product' : 'products'}
              </span>
            )}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <CarouselPrevious className="static translate-y-0" />
          <CarouselNext className="static translate-y-0" />
        </div>
      </div>

      <CarouselContent className="-ml-3">
        {loading
          ? Array.from({ length: SKELETON_COUNT }, (_, i) => (
              <CarouselItem key={i} className={SLIDE}>
                <ProductCardSkeleton />
              </CarouselItem>
            ))
          : products.map((product) => (
              <CarouselItem key={product.id} className={SLIDE}>
                <ProductCard product={product} selected={selected.has(product.id)} onSelect={onSelect} />
              </CarouselItem>
            ))}
      </CarouselContent>
    </Carousel>
  );
}
