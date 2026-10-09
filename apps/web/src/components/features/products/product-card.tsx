'use client';

import CardAction from '@/components/common/card-action';
import { Card } from '@/components/ui/card';
import { StatusValues } from '@/enums/status-values.enum';
import { cn } from '@/lib/utils';
import { ProductResponseDto } from '@pms/types';
import { formatDistanceToNow } from 'date-fns';
import { Boxes, Eye, ImageOff, Pencil, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

const STATUS_TONE: Record<string, { dot: string; text: string }> = {
  [StatusValues.Published]: { dot: 'bg-emerald-500', text: 'text-emerald-700 dark:text-emerald-400' },
  [StatusValues.Draft]: { dot: 'bg-amber-500', text: 'text-amber-700 dark:text-amber-400' },
  [StatusValues.Trash]: { dot: 'bg-rose-500', text: 'text-rose-700 dark:text-rose-400' },
};

interface ProductCardProps {
  product: ProductResponseDto;
  onView: () => void;
  /** When given, Edit opens the form where the list is instead of navigating to the product. */
  onEdit?: () => void;
  onDelete: () => void;
}

// Card layout for the products grid: photo on top, identity and taxonomy below, status and
// age along the footer. The photo and name open the read-only view; the overlay buttons hold
// the rest (Edit and Variants are pages, so they navigate).
export default function ProductCard({ product, onView, onEdit, onDelete }: ProductCardProps) {
  const router = useRouter();
  const tone = STATUS_TONE[product.status] ?? { dot: 'bg-muted-foreground', text: 'text-muted-foreground' };
  const trashed = product.status === StatusValues.Trash;
  const image = product.images?.[0] ?? null;

  return (
    <Card className={cn('group relative !p-0 flex flex-col overflow-hidden transition-shadow hover:shadow-md', trashed && 'opacity-70')}>
      <div className="absolute right-2 top-2 z-10 flex gap-1 opacity-0 transition-opacity focus-within:opacity-100 group-hover:opacity-100 [@media(hover:none)]:opacity-100">
        <CardAction label={`View ${product.name}`} icon={Eye} onClick={onView} className="hover:bg-primary hover:text-primary-foreground" />
        <CardAction label={`Variants of ${product.name}`} icon={Boxes} onClick={() => router.push(`/admin/products/${product.id}/variants`)} className="hover:bg-primary hover:text-primary-foreground" />
        <CardAction label={`Edit ${product.name}`} icon={Pencil} onClick={onEdit ?? (() => router.push(`/admin/products/${product.id}?edit=1`))} className="hover:bg-primary hover:text-primary-foreground" />
        {!trashed && <CardAction label={`Delete ${product.name}`} icon={Trash2} onClick={onDelete} className="hover:bg-destructive hover:text-destructive-foreground" />}
      </div>

      <button type="button" onClick={onView} aria-label={`View ${product.name}`} className="block w-full">
        <div className="flex aspect-[4/3] w-full items-center justify-center overflow-hidden bg-muted/40">
          {image ? (
            // Product images come from arbitrary CDNs; next/image would need each host in
            // `next.config.mjs` remotePatterns, so a plain <img> keeps unknown hosts working.
            // eslint-disable-next-line @next/next/no-img-element
            <img src={image} alt={product.name} className="h-full w-full object-cover transition-transform group-hover:scale-105" />
          ) : (
            <ImageOff className="h-8 w-8 text-muted-foreground/30" />
          )}
        </div>
      </button>

      <div className="min-w-0 space-y-0.5 p-3">
        <button type="button" onClick={onView} className="block w-full truncate text-left text-sm font-semibold hover:underline" title={product.name}>
          {product.name}
        </button>
        <p className="truncate text-[11px] text-muted-foreground">
          {product.category?.name ?? '—'}
          {product.brandName?.name ? ` · ${product.brandName.name}` : ''}
        </p>
      </div>

      <div className="mt-auto flex items-center justify-between gap-2 border-t px-3 py-2.5 text-[11px]">
        <span className={cn('inline-flex items-center gap-1.5 font-medium', tone.text)}>
          <span className={cn('h-1.5 w-1.5 rounded-full', tone.dot)} />
          {product.status}
        </span>
        <span className="truncate text-muted-foreground" title={product.createdAt ? new Date(product.createdAt).toLocaleString() : undefined}>
          {product.createdAt ? formatDistanceToNow(new Date(product.createdAt), { addSuffix: true }) : '—'}
        </span>
      </div>
    </Card>
  );
}
