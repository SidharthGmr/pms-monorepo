'use client';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

import { cn } from '@/lib/utils';
import { ArrowRight, Check, ImageOff } from 'lucide-react';
import { KeyboardEvent } from 'react';
import { ProductResponseDto } from '@pms/types';

// `category` and `brandName` arrive as `{ id, name }` objects on the wire, while the web DTO
// still types category as a string, so both shapes are accepted here.
const nameOf = (value: unknown): string | null => {
  if (!value) return null;
  if (typeof value === 'string') return value;
  if (typeof value === 'object' && 'name' in value) return String((value as { name: unknown }).name);
  return null;
};

interface ProductCardProps {
  product: ProductResponseDto;
  selected?: boolean;
  onSelect?: (product: ProductResponseDto) => void;
}

export default function ProductCard({ product, selected = false, onSelect }: ProductCardProps) {
  const image = product.images?.[0];
  const category = nameOf(product.category);
  const brand = nameOf((product as { brandName?: unknown }).brandName);
  const interactive = !!onSelect;

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onSelect?.(product);
    }
  };

  return (
    <Card
      role={interactive ? 'button' : undefined}
      tabIndex={interactive ? 0 : undefined}
      aria-pressed={interactive ? selected : undefined}
      onClick={() => onSelect?.(product)}
      onKeyDown={interactive ? handleKeyDown : undefined}
      title={product.name}
      className={cn(
        'group relative flex h-full flex-col overflow-hidden rounded-2xl border !p-0 shadow-none transition-all duration-300',
        interactive && 'cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2',
        selected
          ? 'border-primary/60 shadow-[0_8px_30px_hsl(var(--primary)/0.12)] ring-1 ring-primary/30'
          : 'border-border/60 hover:-translate-y-1 hover:border-primary/30 hover:shadow-[0_12px_32px_rgba(0,0,0,0.10)]'
      )}
    >
      <span
        aria-hidden
        className={cn('absolute inset-x-0 top-0 z-10 h-0.5 bg-primary transition-transform duration-300', selected ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100')}
      />

      <div className="relative aspect-square overflow-hidden bg-gradient-to-br from-muted/70 via-muted/25 to-transparent">
        {image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={image} alt={product.name} loading="lazy" className="h-full w-full object-contain p-3 transition-transform duration-500 ease-out group-hover:scale-110" />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-1.5 text-muted-foreground/25">
            <ImageOff className="h-6 w-6" />
            <span className="text-[10px] font-medium uppercase tracking-wide">No image</span>
          </div>
        )}

        {brand && (
          <span className="absolute bottom-1.5 left-1.5 max-w-[calc(100%-0.75rem)] truncate rounded-full border border-border/50 bg-background/85 px-1.5 py-0.5 text-[9px] font-semibold tracking-wide text-foreground/80 shadow-sm backdrop-blur-sm">
            {brand}
          </span>
        )}

        <span
          aria-hidden
          className={cn(
            'absolute right-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm ring-2 ring-background transition-all duration-200',
            selected ? 'scale-100 opacity-100' : 'scale-50 opacity-0'
          )}
        >
          <Check className="h-3 w-3" strokeWidth={3} />
        </span>
      </div>

      <div className="flex flex-1 flex-col gap-0.5 p-2.5">
        <p className="line-clamp-2 text-xs font-semibold leading-snug tracking-tight transition-colors group-hover:text-primary">{product.name}</p>
        {category && <p className="line-clamp-1 text-[10px] text-muted-foreground">{category}</p>}

        {interactive && (
          <p
            className={cn(
              'mt-auto flex items-center gap-1 pt-1.5 text-[10px] font-semibold transition-all duration-200',
              selected ? 'text-primary opacity-100' : 'translate-y-0.5 text-muted-foreground opacity-0 group-hover:translate-y-0 group-hover:text-primary group-hover:opacity-100 group-focus-visible:translate-y-0 group-focus-visible:opacity-100'
            )}
          >
            {selected ? 'Showing its variants' : 'View variants'}
            {!selected && <ArrowRight className="h-2.5 w-2.5 transition-transform group-hover:translate-x-0.5" />}
          </p>
        )}
      </div>
    </Card>
  );
}

export function ProductCardSkeleton() {
  return (
    <Card className="flex h-full flex-col overflow-hidden rounded-2xl border border-border/60 !p-0 shadow-none">
      <Skeleton className="aspect-square w-full rounded-none" />
      <div className="flex flex-1 flex-col gap-1.5 p-2.5">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
        <Skeleton className="mt-auto h-3 w-2/5" />
      </div>
    </Card>
  );
}
