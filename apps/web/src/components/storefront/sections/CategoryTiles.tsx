'use client';

import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useGetAllPublicCategories } from '@/hooks/service-hooks/useCategoryService';
import { ArrowRight, FolderTree } from 'lucide-react';
import Link from 'next/link';
import { useMemo } from 'react';
import SectionHeading from './SectionHeading';

const SKELETON_COUNT = 6;
const MAX_TILES = 12;

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
    <section id="categories" className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <SectionHeading title="Shop by category" href="/products" cta="All products" />

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        {isLoading
          ? Array.from({ length: SKELETON_COUNT }, (_, index) => <Skeleton key={index} className="h-40 rounded-2xl" />)
          : categories.map((category) => {
              const image = category.images?.[0];

              return (
                <Link key={category.id} href={`/products?categoryIds=${category.id}`} className="group">
                  <Card className="flex h-full flex-col items-center gap-3 overflow-hidden rounded-2xl !p-0 pb-4 text-center transition-all hover:-translate-y-1 hover:border-primary/40 hover:shadow-md">
                    <div className="flex aspect-square w-full items-center justify-center bg-muted/40 p-4">
                      {image ? (
                        // Category images come from arbitrary CDNs; next/image would need each host in
                        // `next.config.mjs` remotePatterns, so a plain <img> keeps unknown hosts working.
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={image} alt={category.name} className="max-h-full w-auto object-contain transition-transform group-hover:scale-105" />
                      ) : (
                        <FolderTree className="h-10 w-10 text-muted-foreground/30" />
                      )}
                    </div>
                    <div className="px-3 pb-4">
                      <p className="truncate text-sm font-semibold" title={category.name}>
                        {category.name}
                      </p>
                      <span className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-primary opacity-0 transition-opacity group-hover:opacity-100">
                        Shop now
                        <ArrowRight className="h-3 w-3" />
                      </span>
                    </div>
                  </Card>
                </Link>
              );
            })}
      </div>
    </section>
  );
}
