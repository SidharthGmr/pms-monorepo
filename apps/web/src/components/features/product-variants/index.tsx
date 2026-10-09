'use client';

import ListPagination from '@/components/common/list-pagination';
import { ListView, readStoredView, storeView } from '@/components/common/view-switch';
import { CustomDataTable } from '@/components/Table/data-table';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import config from '@/config';
import { useGetAllProductVariants } from '@/hooks/service-hooks/useProductVariantService';
import { useCustomDataTable } from '@/hooks/use-custom-table';
import { cn } from '@/lib/utils';
import { ProductVariantFilterParams } from '@/params/product-variant.params';
import { ProductVariantListItemDto } from '@pms/types';
import { Layers } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import AdminVariantCard from './admin-variant-card';
import { useProductVariantColumns } from './columns';
import ProductVariantFilter, { DEFAULT_VARIANT_FILTER, SortDirection, VariantFilterValue } from './filter';

// `p-0` alone loses to the Card's own `md:p-5` in tailwind-merge (different variant).
const FLUSH_CARD = 'p-0 md:p-0';
const GRID = 'grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4';
const VIEW_STORAGE_KEY = 'product-variants.view';

interface ProductVariantListProps {
  onCountChange?: (total: number) => void;
}

export default function ProductVariantList({ onCountChange }: ProductVariantListProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Cards are the default view; the stored preference is applied after mount so server and first client render agree.
  const [view, setView] = useState<ListView>('grid');
  useEffect(() => {
    const stored = readStoredView(VIEW_STORAGE_KEY);
    if (stored) setView(stored);
  }, []);

  const changeView = (next: ListView) => {
    setView(next);
    storeView(VIEW_STORAGE_KEY, next);
  };

  // Product screens deep-link here with ?productId=, and the URL seeds the first render so a
  // shared link opens on the same view; after that the page owns the state.
  const [filter, setFilter] = useState<VariantFilterValue>(() => ({
    ...DEFAULT_VARIANT_FILTER,
    search: searchParams.get('search') ?? '',
    productId: searchParams.get('productId') ? +searchParams.get('productId')! : undefined,
    categoryId: searchParams.get('categoryId') ? +searchParams.get('categoryId')! : undefined,
    sortBy: searchParams.get('sortBy') ?? DEFAULT_VARIANT_FILTER.sortBy,
    sortDirection: (searchParams.get('sortDirection')?.toUpperCase() as SortDirection) === 'ASC' ? 'ASC' : 'DESC',
  }));
  const [page, setPage] = useState(() => Math.max(1, Number(searchParams.get('page')) || 1));
  const [pageSize, setPageSize] = useState(() => Number(searchParams.get('recordPerPage')) || config.recordPerPage);

  const params = useMemo<ProductVariantFilterParams>(
    () => ({
      search: filter.search || undefined,
      productId: filter.productId,
      categoryId: filter.categoryId,
      isActive: filter.active === null ? undefined : filter.active === 'active',
      sortBy: filter.sortBy,
      sortDirection: filter.sortDirection,
      page,
      recordPerPage: pageSize,
    }),
    [filter, page, pageSize]
  );

  const listQuery = useGetAllProductVariants(params);

  const result = listQuery.data?.data?.data;
  const variants: ProductVariantListItemDto[] = useMemo(() => result?.data ?? [], [result]);
  const total = result?.totalRecord ?? 0;

  useEffect(() => {
    onCountChange?.(total);
  }, [total, onCountChange]);

  const openEditor = (variant: ProductVariantListItemDto) => router.push(`/admin/products/variants/${variant.id}?edit=1`);
  const openPriceHistory = (variant: ProductVariantListItemDto) => router.push(`/admin/product-variants/price-histories?productId=${variant.product?.id}&variantId=${variant.id}`);

  // Paging and sorting are already applied by the API, so the table is told it is manual and simply renders the page it is given.
  const columns = useProductVariantColumns(openEditor);
  const table = useCustomDataTable({
    columns,
    data: variants,
    manualFiltering: true,
    manualPagination: true,
    manualSorting: true,
    pageCount: Math.max(1, Math.ceil(total / Math.max(pageSize, 1))),
    pagination: { pageIndex: page - 1, pageSize },
    sorting: [{ id: filter.sortBy, desc: filter.sortDirection === 'DESC' }],
  });

  // Any change to what is being listed sends the user back to page 1, otherwise a narrower result set can leave them on an empty page.
  const updateFilter = (patch: Partial<VariantFilterValue>) => {
    setFilter((current) => ({ ...current, ...patch }));
    setPage(1);
  };

  const resetFilter = () => {
    setFilter(DEFAULT_VARIANT_FILTER);
    setPage(1);
  };

  const changePageSize = (size: number) => {
    setPageSize(size);
    setPage(1);
  };

  const isFiltered = filter.search !== '' || filter.productId !== undefined || filter.categoryId !== undefined || filter.active !== null;
  const showSkeleton = listQuery.isPending;

  return (
    <div className="space-y-4">
      <ProductVariantFilter
        value={filter}
        onChange={updateFilter}
        onReset={resetFilter}
        view={view}
        onViewChange={changeView}
        total={listQuery.isPending ? undefined : total}
        loading={listQuery.isFetching}
      />

      <Card size="sm">
        <ListPagination page={page} pageSize={pageSize} total={total} loading={listQuery.isFetching} onPageChange={setPage} onPageSizeChange={changePageSize} />
      </Card>

      {listQuery.isError ? (
        <Card className="py-16 text-center">
          <p className="text-sm font-semibold text-destructive">Could not load variants</p>
          <p className="mt-1 text-xs text-muted-foreground">Check your connection and try again.</p>
        </Card>
      ) : view === 'table' ? (
        <Card className={cn(FLUSH_CARD, 'overflow-hidden', listQuery.isFetching && !showSkeleton && 'opacity-60 transition-opacity')}>
          <CustomDataTable
            columns={columns}
            table={table}
            isLoading={showSkeleton}
            flush
            emptyMessage={
              <div className="flex flex-col items-center gap-2 py-6 text-muted-foreground">
                <Layers className="h-6 w-6 text-muted-foreground/40" />
                <span className="text-sm">{isFiltered ? 'No variants match these filters.' : 'No variants yet.'}</span>
              </div>
            }
          />
        </Card>
      ) : showSkeleton ? (
        <div className={GRID} aria-busy="true" aria-label="Loading variants">
          {Array.from({ length: Math.min(pageSize, 12) }).map((_, index) => (
            <Card key={index} className={cn(FLUSH_CARD, 'overflow-hidden border')}>
              <Skeleton className="aspect-[4/3] w-full rounded-none" />
              <div className="space-y-2 p-3">
                <Skeleton className="h-3.5 w-2/3" />
                <Skeleton className="h-2.5 w-1/3" />
                <Skeleton className="h-6 w-full" />
              </div>
            </Card>
          ))}
        </div>
      ) : variants.length === 0 ? (
        <Card className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
          <div className="rounded-full bg-muted p-4 text-muted-foreground">
            <Layers className="h-7 w-7" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-semibold">{isFiltered ? 'No variants match these filters' : 'No variants yet'}</p>
            <p className="text-xs text-muted-foreground">{isFiltered ? 'Try a different search, product, category or status.' : 'Use "Add variant" above to create the first one.'}</p>
          </div>
        </Card>
      ) : (
        <div className={cn(GRID, listQuery.isFetching && 'opacity-60 transition-opacity')} aria-busy={listQuery.isFetching}>
          {variants.map((variant) => (
            <AdminVariantCard key={variant.id} variant={variant} onEdit={() => openEditor(variant)} onPriceHistory={() => openPriceHistory(variant)} />
          ))}
        </div>
      )}

      {total > pageSize && (
        <Card size="sm">
          <ListPagination page={page} pageSize={pageSize} total={total} loading={listQuery.isFetching} onPageChange={setPage} onPageSizeChange={changePageSize} />
        </Card>
      )}

    </div>
  );
}
