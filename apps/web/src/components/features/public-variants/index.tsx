'use client';
import { SelectSearch } from '@/components/common/select-search';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { ProductVariantListItemDto } from '@/dtos/product-variant.dto';
import { useGetAllCategories } from '@/hooks/service-hooks/useCategoryService';
import { useGetAllPublicProductVariants } from '@/hooks/service-hooks/useProductVariantService';
import { formatPrice } from '@/lib/format-price';
import { ProductVariantFilterParams } from '@/params/product-variant.params';
import { ChevronLeft, ChevronRight, Package, PackageX, Search, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

const PAGE_SIZE = 12;

const SORT_OPTIONS = [
  { label: 'Newest first', value: 'createdAt:desc' },
  { label: 'Oldest first', value: 'createdAt:asc' },
  { label: 'Name A–Z', value: 'name:asc' },
  { label: 'Name Z–A', value: 'name:desc' },
  { label: 'SKU A–Z', value: 'sku:asc' },
];

const describeVariant = (variant: ProductVariantListItemDto): string => {
  if (variant.name) return variant.name;
  const attributes = variant.attributes;
  if (!attributes || typeof attributes !== 'object') return '';
  return Object.entries(attributes)
    .map(([key, value]) => `${key}: ${String(value)}`)
    .join(' · ');
};

const imageFor = (variant: ProductVariantListItemDto): string | undefined => variant.images?.[0] ?? variant.product?.images?.[0];

function VariantCard({ variant }: { variant: ProductVariantListItemDto }) {
  const stock = variant.stockQuantity ?? 0;
  const soldOut = stock <= 0;
  const unpriced = variant.sellingPrice == null;
  const lowStock = !soldOut && !unpriced && stock <= (variant.lowStockThreshold || 5);
  const description = describeVariant(variant);
  const image = imageFor(variant);
  const title = variant.product?.name ?? variant.sku ?? 'Product';

  return (
    <Card className="group flex flex-col overflow-hidden rounded-xl p-0 shadow-sm transition-shadow hover:shadow-md">
      <div className="relative aspect-square overflow-hidden bg-muted/30">
        {image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={image}
            alt={`${title}${description ? ` - ${description}` : ''}`}
            className="h-full w-full object-contain p-4 transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <Package className="h-9 w-9 text-muted-foreground/30" />
          </div>
        )}
        {soldOut && (
          <span className="absolute left-2.5 top-2.5 rounded-full bg-foreground/85 px-2 py-0.5 text-[10px] font-bold uppercase text-background">
            Sold out
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-0.5 p-3">
        {variant.product?.category?.name && (
          <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">{variant.product.category.name}</span>
        )}
        <h3 className="line-clamp-2 text-[13px] font-semibold leading-snug">{title}</h3>
        <p className="line-clamp-1 min-h-[1rem] text-[11px] text-muted-foreground">{description}</p>
        {variant.sku && <code className="font-mono text-[10px] text-muted-foreground/80">{variant.sku}</code>}

        <div className="mt-auto flex items-baseline gap-2 pt-2">
          {unpriced ? (
            <span className="text-sm font-semibold text-muted-foreground">Coming soon</span>
          ) : (
            <span className="text-base font-bold tracking-tight">{formatPrice(variant.sellingPrice as number)}</span>
          )}
          {lowStock && <span className="text-[11px] font-semibold text-amber-600">Only {stock} left</span>}
        </div>
      </div>
    </Card>
  );
}

function VariantCardSkeleton() {
  return (
    <Card className="flex flex-col overflow-hidden rounded-xl p-0 shadow-sm">
      <Skeleton className="aspect-square w-full rounded-none" />
      <div className="space-y-2 p-3">
        <Skeleton className="h-2.5 w-16" />
        <Skeleton className="h-3.5 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
        <Skeleton className="mt-2 h-5 w-20" />
      </div>
    </Card>
  );
}

export default function PublicVariantList() {
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [categoryId, setCategoryId] = useState<number | undefined>();
  const [sort, setSort] = useState(SORT_OPTIONS[0].value);
  const [page, setPage] = useState(1);

  useEffect(() => {
    const handle = setTimeout(() => setDebouncedSearch(search.trim()), 350);
    return () => clearTimeout(handle);
  }, [search]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, categoryId, sort]);

  const [sortBy, sortDirection] = sort.split(':');

  const filters: ProductVariantFilterParams = useMemo(
    () => ({
      page,
      recordPerPage: PAGE_SIZE,
      sortBy,
      sortDirection,
      ...(debouncedSearch && { search: debouncedSearch }),
      ...(categoryId && { categoryId }),
    }),
    [page, sortBy, sortDirection, debouncedSearch, categoryId]
  );

  const { data: response, isLoading, isFetching, isError, refetch } = useGetAllPublicProductVariants(filters);
  const variants = response?.data?.data?.data ?? [];
  const totalRecord = response?.data?.data?.totalRecord ?? 0;
  const pageCount = Math.max(1, Math.ceil(totalRecord / PAGE_SIZE));

  const { data: categoriesResponse } = useGetAllCategories({ showAllRecords: true });
  const categoryItems = useMemo(
    () => (categoriesResponse?.data?.data?.data ?? []).map((category) => ({ value: category.id, label: category.name })),
    [categoriesResponse]
  );

  const hasFilters = !!debouncedSearch || !!categoryId;
  const clearFilters = () => {
    setSearch('');
    setCategoryId(undefined);
  };

  return (
    <div className="space-y-5">
      <Card size="sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by product, variant, SKU or barcode"
              className="pl-9"
              aria-label="Search variants"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-full p-0.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                aria-label="Clear search"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3 lg:w-auto lg:grid-cols-[minmax(11rem,1fr)_minmax(10rem,1fr)]">
            <SelectSearch
              items={categoryItems}
              value={categoryId ?? ''}
              placeholder="All categories"
              buttonClass="w-full"
              containerName="public-variant-category"
              onChange={(value) => setCategoryId(value ? Number(value) : undefined)}
            />
            <SelectSearch
              items={SORT_OPTIONS}
              value={sort}
              valueType="string"
              disableSearch
              placeholder="Sort"
              buttonClass="w-full"
              containerName="public-variant-sort"
              onChange={(value) => setSort(String(value) || SORT_OPTIONS[0].value)}
            />
          </div>
        </div>
      </Card>

      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>
          {isLoading ? 'Loading…' : totalRecord === 0 ? 'No variants' : `${totalRecord} variant${totalRecord === 1 ? '' : 's'}`}
          {isFetching && !isLoading && <span className="ml-2 text-xs">(updating…)</span>}
        </span>
        {hasFilters && (
          <Button type="button" variant="ghost" size="sm" onClick={clearFilters} icon={X} iconPlacement="left">
            Clear filters
          </Button>
        )}
      </div>

      {isError ? (
        <Card>
          <div className="flex flex-col items-center gap-3 py-12 text-center">
            <PackageX className="h-8 w-8 text-destructive/70" />
            <p className="text-sm text-muted-foreground">Could not load variants right now.</p>
            <Button type="button" variant="outline" size="sm" onClick={() => refetch()}>
              Try again
            </Button>
          </div>
        </Card>
      ) : isLoading ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: PAGE_SIZE }, (_, i) => (
            <VariantCardSkeleton key={i} />
          ))}
        </div>
      ) : variants.length === 0 ? (
        <Card>
          <div className="flex flex-col items-center gap-3 py-12 text-center">
            <span className="rounded-full bg-primary/10 p-3 text-primary">
              <Package className="h-5 w-5" />
            </span>
            <div className="space-y-1">
              <p className="font-medium">{hasFilters ? 'Nothing matches those filters' : 'No variants available yet'}</p>
              <p className="text-sm text-muted-foreground">
                {hasFilters ? 'Try a different search or category.' : 'Check back soon — new products are on their way.'}
              </p>
            </div>
            {hasFilters && (
              <Button type="button" variant="outline" size="sm" onClick={clearFilters}>
                Clear filters
              </Button>
            )}
          </div>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {variants.map((variant) => (
              <VariantCard key={variant.id} variant={variant} />
            ))}
          </div>

          {pageCount > 1 && (
            <div className="flex items-center justify-center gap-3 pt-2">
              <Button type="button" variant="outline" size="sm" disabled={page <= 1 || isFetching} onClick={() => setPage((p) => p - 1)}>
                <ChevronLeft className="mr-1 h-4 w-4" />
                Previous
              </Button>
              <Badge variant="zinc" className="font-normal">
                Page {page} of {pageCount}
              </Badge>
              <Button type="button" variant="outline" size="sm" disabled={page >= pageCount || isFetching} onClick={() => setPage((p) => p + 1)}>
                Next
                <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
