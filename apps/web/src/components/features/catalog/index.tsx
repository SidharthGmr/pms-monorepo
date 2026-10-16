'use client';
import ListPagination from '@/components/common/list-pagination';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { useGetCatalogFacets, useGetCatalogProducts } from '@/hooks/service-hooks/useCatalogService';
import { cn } from '@/lib/utils';
import { CatalogFilterParams, CatalogProductDto } from '@pms/types';
import { PackageSearch, Search, SlidersHorizontal, X } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useDebounce } from 'use-debounce';
import CatalogFilters, { CatalogFilterValue, EMPTY_CATALOG_FILTER, isFiltered } from './filters';
import CatalogProductCard from './product-card';

/**
 * Demo storefront listing for the new /catalog API: faceted sidebar on the left, product grid
 * on the right, the way an e-commerce category page works. All filtering happens server-side -
 * this page only holds the selection and renders what comes back.
 */

const SORT_OPTIONS = [
  { value: 'newest:desc', label: 'Newest first' },
  { value: 'price:asc', label: 'Price: low to high' },
  { value: 'price:desc', label: 'Price: high to low' },
  { value: 'rating:desc', label: 'Top rated' },
  { value: 'name:asc', label: 'Name A–Z' },
] as const;

const PAGE_SIZE = 12;

export default function CatalogDemo() {
  const [filter, setFilter] = useState<CatalogFilterValue>(EMPTY_CATALOG_FILTER);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<string>('newest:desc');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(PAGE_SIZE);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [debouncedSearch] = useDebounce(search.trim(), 400);

  const params = useMemo<CatalogFilterParams>(() => {
    const [sortBy, sortDirection] = sort.split(':') as [string, 'asc' | 'desc'];
    return {
      search: debouncedSearch || undefined,
      categoryIds: filter.categoryIds.length ? filter.categoryIds : undefined,
      brandNameIds: filter.brandNameIds.length ? filter.brandNameIds : undefined,
      entryIds: filter.entryIds.length ? filter.entryIds : undefined,
      minPrice: filter.minPrice,
      maxPrice: filter.maxPrice,
      minRating: filter.minRating,
      inStockOnly: filter.inStockOnly || undefined,
      offersOnly: filter.offersOnly || undefined,
      sortBy,
      sortDirection,
      page,
      recordPerPage: pageSize,
    };
  }, [filter, debouncedSearch, sort, page, pageSize]);

  const productsQuery = useGetCatalogProducts(params);
  const facetsQuery = useGetCatalogFacets();

  const result = productsQuery.data?.data?.data;
  const products: CatalogProductDto[] = result?.data ?? [];
  const total = result?.totalRecord ?? 0;
  const facets = facetsQuery.data?.data?.data;

  const updateFilter = (patch: Partial<CatalogFilterValue>) => {
    setFilter((current) => ({ ...current, ...patch }));
    setPage(1);
  };

  const resetFilter = () => {
    setFilter(EMPTY_CATALOG_FILTER);
    setSearch('');
    setPage(1);
  };

  const activeCount =
    filter.categoryIds.length +
    filter.brandNameIds.length +
    filter.entryIds.length +
    (filter.minPrice != null || filter.maxPrice != null ? 1 : 0) +
    (filter.inStockOnly ? 1 : 0) +
    (filter.offersOnly ? 1 : 0) +
    (filter.minRating != null ? 1 : 0);

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8">
      <header className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Shop the catalog</h1>
        <p className="mt-1 text-sm text-muted-foreground">Demo of the new catalog API - every product with its variants, filtered at variant level.</p>
      </header>

      <div className="mb-5 flex flex-wrap items-center gap-2">
        <div className="relative min-w-0 flex-1 basis-60">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search products, variants or SKU"
            className="h-9 pl-9 pr-8"
            aria-label="Search the catalog"
          />
          {search && (
            <button type="button" onClick={() => setSearch('')} aria-label="Clear search" className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        <Select
          value={sort}
          onValueChange={(next) => {
            setSort(next);
            setPage(1);
          }}
        >
          <SelectTrigger className="h-9 w-44" aria-label="Sort by">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SORT_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button type="button" variant="outline" size="sm" className="h-9 gap-1.5 lg:hidden" onClick={() => setFiltersOpen((open) => !open)}>
          <SlidersHorizontal className="h-4 w-4" />
          Filters
          {activeCount > 0 && <span className="rounded-full bg-primary px-1.5 text-[10px] font-bold text-primary-foreground">{activeCount}</span>}
        </Button>

        {!productsQuery.isPending && (
          <span className="ml-auto text-xs text-muted-foreground">
            {total} product{total === 1 ? '' : 's'}
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[240px_minmax(0,1fr)]">
        <aside className={cn('lg:block', filtersOpen ? 'block' : 'hidden')}>
          <Card className="p-4 md:p-4">
            <CatalogFilters facets={facets} loading={facetsQuery.isPending} value={filter} onChange={updateFilter} onReset={resetFilter} />
          </Card>
        </aside>

        <div className="min-w-0 space-y-5">
          {productsQuery.isError ? (
            <Card className="py-16 text-center">
              <p className="text-sm font-semibold text-destructive">Could not load the catalog</p>
              <p className="mt-1 text-xs text-muted-foreground">Check your connection and try again.</p>
            </Card>
          ) : productsQuery.isPending ? (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4" aria-busy="true">
              {Array.from({ length: 8 }).map((_, index) => (
                <div key={index} className="space-y-2">
                  <Skeleton className="aspect-square w-full rounded-xl" />
                  <Skeleton className="h-3.5 w-3/4" />
                  <Skeleton className="h-3.5 w-1/2" />
                </div>
              ))}
            </div>
          ) : products.length === 0 ? (
            <Card className="py-16 text-center">
              <PackageSearch className="mx-auto h-8 w-8 text-muted-foreground/40" />
              <p className="mt-3 text-sm font-semibold">{isFiltered(filter) || debouncedSearch ? 'Nothing matches these filters' : 'No products published yet'}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {isFiltered(filter) || debouncedSearch ? 'Loosen a filter or clear them all.' : 'Published products with active variants appear here.'}
              </p>
              {(isFiltered(filter) || debouncedSearch) && (
                <Button variant="outline" size="sm" className="mt-5" onClick={resetFilter}>
                  Clear filters
                </Button>
              )}
            </Card>
          ) : (
            <div className={cn('grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4', productsQuery.isFetching && 'opacity-60 transition-opacity')}>
              {products.map((product) => (
                <CatalogProductCard key={product.id} product={product} />
              ))}
            </div>
          )}

          {total > pageSize && (
            <Card size="sm">
              <ListPagination
                page={page}
                pageSize={pageSize}
                total={total}
                loading={productsQuery.isFetching}
                pageSizes={[12, 24, 48]}
                onPageChange={setPage}
                onPageSizeChange={(size) => {
                  setPageSize(size);
                  setPage(1);
                }}
              />
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
