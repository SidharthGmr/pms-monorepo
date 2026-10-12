'use client';

import { Skeleton } from '@/components/ui/skeleton';
import { useGetAllPublicCategories } from '@/hooks/service-hooks/useCategoryService';
import { cn } from '@/lib/utils';
import { ArrowRight, FolderTree } from 'lucide-react';
import Link from 'next/link';
import { useMemo } from 'react';

const SKELETON_COUNT = 6;
const MAX_TILES = 12;

// Each tile cycles one of these tints behind the artwork, so a row of categories reads as a
// set rather than six identical grey squares - and a category with no image still has colour.
const TINTS = [
  'from-primary/10 to-primary/[0.03]',
  'from-secondary/15 to-secondary/[0.04]',
  'from-sky-500/10 to-sky-500/[0.03]',
  'from-amber-500/10 to-amber-500/[0.03]',
  'from-rose-500/10 to-rose-500/[0.03]',
  'from-violet-500/10 to-violet-500/[0.03]',
];

// Real categories from the catalogue, each tile deep-linking into the product list already
// filtered to it. Only top-level ones are shown - children belong on the filter, not the banner.
export default function CategoryTiles() {
  const { data, isLoading, isError } = useGetAllPublicCategories({ showAllRecords: true });

  const categories = useMemo(() => {
    const all = data?.data?.data?.data ?? [];
    return all
      .filter((category) => category.parentId == null)
      .sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0))
      .slice(0, MAX_TILES);
  }, [data]);

  if (isError || (!isLoading && categories.length === 0)) return null;

  return (
    <section id="categories" className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
      <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-primary">Browse the shelves</span>
          <h2 className="mt-1.5 text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">Shop by category</h2>
          <p className="mt-1.5 max-w-lg text-sm text-muted-foreground">Every category below is live stock you can order today.</p>
        </div>
        <Link
          href="/products"
          className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-border px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:border-primary/40 hover:bg-primary/5 hover:text-primary"
        >
          All products
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-6">
        {isLoading
          ? Array.from({ length: SKELETON_COUNT }, (_, index) => <Skeleton key={index} className="h-44 rounded-2xl" />)
          : categories.map((category, index) => {
              const image = category.images?.[0];

              return (
                <Link
                  key={category.id}
                  href={`/products?categoryIds=${category.id}`}
                  className="group relative flex flex-col overflow-hidden rounded-2xl border border-border/70 bg-card shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-primary/40 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <div className={cn('flex aspect-square w-full items-center justify-center bg-gradient-to-br p-5', TINTS[index % TINTS.length])}>
                    {image ? (
                      // Category images come from arbitrary CDNs; next/image would need each host in
                      // `next.config.mjs` remotePatterns, so a plain <img> keeps unknown hosts working.
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={image}
                        alt={category.name}
                        className="max-h-full w-auto object-contain drop-shadow-sm transition-transform duration-300 group-hover:scale-110"
                      />
                    ) : (
                      <FolderTree className="h-9 w-9 text-primary/35" />
                    )}
                  </div>

                  <div className="flex items-center justify-between gap-1.5 border-t border-border/70 px-3 py-2.5">
                    <p className="min-w-0 truncate text-sm font-semibold text-foreground" title={category.name}>
                      {category.name}
                    </p>
                    <ArrowRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground transition-all duration-200 group-hover:translate-x-0.5 group-hover:text-primary" />
                  </div>
                </Link>
              );
            })}
      </div>
    </section>
  );
}
