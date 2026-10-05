'use client';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ProductDto } from '@/dtos/product.dto';
import { cn } from '@/lib/utils';
import { Check, ImageOff } from 'lucide-react';
import { KeyboardEvent } from 'react';

// `category` and `brandName` arrive as `{ id, name }` objects on the wire, while the web DTO
// still types category as a string, so both shapes are accepted here.
const nameOf = (value: unknown): string | null => {
  if (!value) return null;
  if (typeof value === 'string') return value;
  if (typeof value === 'object' && 'name' in value) return String((value as { name: unknown }).name);
  return null;
};

interface ProductCardProps {
  product: ProductDto;
  selected?: boolean;
  onSelect?: (product: ProductDto) => void;
}

export default function ProductCard({ product, selected = false, onSelect }: ProductCardProps) {
  const image = product.images?.[0];
  const category = nameOf(product.category);
  const brand = nameOf((product as { brandName?: unknown }).brandName);
  const meta = [category, brand].filter(Boolean).join(' · ');
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
        'group flex h-full flex-col overflow-hidden rounded-2xl border !p-0 shadow-none transition-all duration-300',
        interactive && 'cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40',
        selected ? 'border-primary ring-2 ring-primary/20' : 'border-border/60 hover:border-border hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)]'
      )}
    >
      <div className="relative aspect-square overflow-hidden bg-muted/40">
        {image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={image} alt={product.name} loading="lazy" className="h-full w-full object-contain p-4 transition-transform duration-500 ease-out group-hover:scale-105" />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-1.5 text-muted-foreground/25">
            <ImageOff className="h-7 w-7" />
            <span className="text-[10px] font-medium uppercase tracking-wide">No image</span>
          </div>
        )}

        {selected && (
          <span className="absolute right-2 top-2 rounded-full bg-primary p-1 text-primary-foreground shadow-sm">
            <Check className="h-3 w-3" strokeWidth={3} />
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col p-3">
        <p className="line-clamp-2 text-sm font-semibold leading-snug tracking-tight">{product.name}</p>
        {meta && <p className="mt-1 line-clamp-1 text-[11px] text-muted-foreground">{meta}</p>}
        {interactive && (
          <p
            className={cn(
              'mt-auto pt-2 text-[11px] font-medium text-primary transition-opacity',
              selected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100'
            )}
          >
            {selected ? 'Showing its variants' : 'View variants'}
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
      <div className="flex flex-1 flex-col gap-1.5 p-3">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
      </div>
    </Card>
  );
}
