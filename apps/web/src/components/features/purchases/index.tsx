'use client';
import { KeyboardEvent, MouseEvent, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { CalendarDays, ExternalLink, Eye, Package, PackagePlus, Receipt, Truck } from 'lucide-react';
import { PurchaseDto } from '@/dtos/purchase.dto';
import { PurchaseFilterParams } from '@/params/purchase.params';
import { useGetAllPurchases } from '@/hooks/service-hooks/usePurchaseService';
import { useCustomDataTable } from '@/hooks/use-custom-table';
import { container } from '@/config/ioc';
import { TYPES } from '@/config/types';
import IUnitOfService from '@/services/interfaces/IUnitOfService';
import config from '@/config';
import { cn } from '@/lib/utils';
import { CustomDataTable } from '@/components/Table/data-table';
import CardAction from '@/components/common/card-action';
import ListPagination from '@/components/common/list-pagination';
import { PageHeader } from '@/components/common/page-header';
import { ListView, readStoredView, storeView } from '@/components/common/view-switch';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { usePurchaseColumns } from './columns';
import PurchaseFilter, { DEFAULT_PURCHASE_FILTER, PurchaseFilterValue, SortDirection } from './filter';
import { formatPurchaseAmount, purchaseStatusLabel, purchaseStatusVariant } from './format';

const GRID = 'grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3';

// `p-0` alone loses to the Card's own `md:p-5` in tailwind-merge (different variant).
const FLUSH_CARD = 'p-0 md:p-0';

const VIEW_STORAGE_KEY = 'purchases.view';

const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0).toISOString();
const endOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999).toISOString();

export default function PurchasesList() {
  const unitOfService = container.get<IUnitOfService>(TYPES.IUnitOfService);
  const searchParams = useSearchParams();
  const router = useRouter();

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

  // The URL seeds the first render so a shared link opens on the same view; after that the page owns the state.
  const [filter, setFilter] = useState<PurchaseFilterValue>(() => {
    const from = searchParams.get('startDate');
    const to = searchParams.get('endDate');
    return {
      search: searchParams.get('search') ?? DEFAULT_PURCHASE_FILTER.search,
      dateRange: from || to ? { from: from ? new Date(from) : undefined, to: to ? new Date(to) : undefined } : undefined,
      sortBy: searchParams.get('sortBy') ?? DEFAULT_PURCHASE_FILTER.sortBy,
      sortDirection: (searchParams.get('sortDirection')?.toUpperCase() as SortDirection) === 'ASC' ? 'ASC' : 'DESC',
    };
  });
  const [page, setPage] = useState(() => Math.max(1, Number(searchParams.get('page')) || 1));
  const [pageSize, setPageSize] = useState(() => Number(searchParams.get('recordPerPage')) || config.recordPerPage);

  const params = useMemo<PurchaseFilterParams>(
    () => ({
      search: filter.search || undefined,
      startDate: filter.dateRange?.from ? startOfDay(filter.dateRange.from) : undefined,
      endDate: filter.dateRange?.to ? endOfDay(filter.dateRange.to) : undefined,
      sortBy: filter.sortBy,
      sortDirection: filter.sortDirection,
      page,
      recordPerPage: pageSize,
    }),
    [filter, page, pageSize]
  );

  const listQuery = useGetAllPurchases(params);
  const result = listQuery.data?.data?.data;
  const purchases: PurchaseDto[] = useMemo(() => result?.data ?? [], [result]);
  const total = result?.totalRecord ?? 0;
  const pageTotal = useMemo(() => purchases.reduce((sum, p) => sum + Number(p.totalAmount ?? 0), 0), [purchases]);

  // The table view reuses the original column set. Paging and sorting are already applied by
  // the API, so the table is told it is manual and simply renders the page it is given.
  const columns = usePurchaseColumns();
  const table = useCustomDataTable({
    columns,
    data: purchases,
    manualFiltering: true,
    manualPagination: true,
    manualSorting: true,
    pageCount: Math.max(1, Math.ceil(total / Math.max(pageSize, 1))),
    pagination: { pageIndex: page - 1, pageSize },
    sorting: [{ id: filter.sortBy, desc: filter.sortDirection === 'DESC' }],
  });

  // Any change to what is being listed sends the user back to page 1, otherwise a narrower result set can leave them on an empty page.
  const updateFilter = (patch: Partial<PurchaseFilterValue>) => {
    setFilter((current) => ({ ...current, ...patch }));
    setPage(1);
  };

  const resetFilter = () => {
    setFilter(DEFAULT_PURCHASE_FILTER);
    setPage(1);
  };

  const changePageSize = (size: number) => {
    setPageSize(size);
    setPage(1);
  };

  const formatDate = (value?: string | null) => (value ? unitOfService.DateTimeService.convertToLocalDate(new Date(value), false) : '—');

  const isFiltered = filter.search !== '' || !!filter.dateRange;
  const showSkeleton = listQuery.isPending;

  return (
    <div className="space-y-4">
      <Card className="space-y-4">
        <PageHeader
          title="Purchase History"
          description={listQuery.isPending ? 'Past stock additions and their invoices' : `${total} ${total === 1 ? 'purchase' : 'purchases'} · stock received from suppliers`}
          variant="add"
          actionText="Add Stock"
          icon={PackagePlus}
          href="/admin/stock-purchase"
        />
        <Separator />
        <PurchaseFilter value={filter} onChange={updateFilter} onReset={resetFilter} view={view} onViewChange={changeView} total={listQuery.isPending ? undefined : total} loading={listQuery.isFetching} />
      </Card>

      <Card size="sm">
        <ListPagination page={page} pageSize={pageSize} total={total} loading={listQuery.isFetching} onPageChange={setPage} onPageSizeChange={changePageSize} />
      </Card>

      {listQuery.isError ? (
        <Card className="py-16 text-center">
          <p className="text-sm font-semibold text-destructive">Could not load purchases</p>
          <p className="mt-1 text-xs text-muted-foreground">Check your connection and try again.</p>
        </Card>
      ) : view === 'table' ? (
        <Card className={cn(FLUSH_CARD, 'overflow-hidden', listQuery.isFetching && !showSkeleton && 'opacity-60 transition-opacity')}>
          <CustomDataTable columns={columns} table={table} isLoading={showSkeleton} />
        </Card>
      ) : showSkeleton ? (
        <div className={GRID} aria-busy="true" aria-label="Loading purchases">
          {Array.from({ length: Math.min(pageSize, 9) }).map((_, i) => (
            <Card key={i} className={cn(FLUSH_CARD, 'border')}>
              <div className="flex items-start gap-3 p-4">
                <Skeleton className="h-11 w-11 shrink-0 rounded-lg" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-3 w-2/3" />
                </div>
                <Skeleton className="h-5 w-20" />
              </div>
              <div className="flex items-center justify-between border-t px-4 py-2.5">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-3 w-16" />
              </div>
            </Card>
          ))}
        </div>
      ) : purchases.length === 0 ? (
        <Card className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
          <div className="rounded-full bg-muted p-4 text-muted-foreground">
            <Receipt className="h-7 w-7" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-semibold">{isFiltered ? 'No purchases match these filters' : 'No stock received yet'}</p>
            <p className="text-xs text-muted-foreground">{isFiltered ? 'Try a different search or date range.' : 'Use "Add Stock" above to record the first delivery.'}</p>
          </div>
        </Card>
      ) : (
        <>
          <div className={cn(GRID, listQuery.isFetching && 'opacity-60 transition-opacity')} aria-busy={listQuery.isFetching}>
            {purchases.map((purchase) => (
              <PurchaseCard key={purchase.id} purchase={purchase} formatDate={formatDate} onOpen={() => router.push(`/admin/stock-purchase/history/${purchase.id}`)} />
            ))}
          </div>
          <p className="text-right text-xs text-muted-foreground">
            This page: <span className="font-semibold tabular-nums text-foreground">{formatPurchaseAmount(pageTotal)}</span> across {purchases.length} {purchases.length === 1 ? 'purchase' : 'purchases'}
          </p>
        </>
      )}

      {total > pageSize && (
        <Card size="sm">
          <ListPagination page={page} pageSize={pageSize} total={total} loading={listQuery.isFetching} onPageChange={setPage} onPageSizeChange={changePageSize} />
        </Card>
      )}
    </div>
  );
}

interface PurchaseCardProps {
  purchase: PurchaseDto;
  formatDate: (value?: string | null) => string;
  onOpen: () => void;
}

function PurchaseCard({ purchase, formatDate, onOpen }: PurchaseCardProps) {
  const items = purchase.items ?? [];
  const units = items.reduce((sum, item) => sum + (item.quantity ?? 0), 0);
  const names = items.map((item) => item.product?.name).filter(Boolean) as string[];
  const preview = names.slice(0, 2).join(', ') + (names.length > 2 ? ` +${names.length - 2} more` : '');

  // The whole card opens the detail page; the overlay buttons and the invoice link stop propagation.
  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.target !== e.currentTarget) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onOpen();
    }
  };
  const stop = (e: MouseEvent) => e.stopPropagation();

  return (
    <Card
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={onKeyDown}
      aria-label={`Open purchase ${purchase.invoiceNumber || purchase.id}`}
      className={cn(
        FLUSH_CARD,
        'group relative flex cursor-pointer flex-col border transition-all duration-200',
        'hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2'
      )}
    >
      <div className="flex items-start gap-3 p-4">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Receipt className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <p className="truncate font-mono text-sm font-semibold leading-tight" title={purchase.invoiceNumber || `#${purchase.id}`}>
              {purchase.invoiceNumber || `#${purchase.id}`}
            </p>
            <Badge variant={purchaseStatusVariant(purchase.status)} className="shrink-0 px-1.5 py-0 text-[10px]">
              {purchaseStatusLabel(purchase.status)}
            </Badge>
          </div>
          <p className="mt-0.5 flex items-center gap-1 truncate text-xs text-muted-foreground">
            <Truck className="h-3 w-3 shrink-0" />
            {purchase.supplierName || 'No supplier recorded'}
          </p>
          <p className="mt-1 truncate text-[11px] text-muted-foreground" title={names.join(', ')}>
            {preview || 'No items'}
          </p>
        </div>

        <div className="absolute right-3 top-3 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100 [@media(hover:none)]:opacity-100">
          <CardAction label="View details" icon={Eye} onClick={onOpen} className="hover:bg-primary hover:text-primary-foreground" />
          {purchase.invoiceUrl && (
            <a
              href={purchase.invoiceUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={stop}
              aria-label="Open invoice file"
              className="inline-flex h-7 w-7 items-center justify-center rounded-md border bg-background/90 text-muted-foreground shadow-sm backdrop-blur transition-colors hover:bg-primary hover:text-primary-foreground"
            >
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          )}
        </div>
      </div>

      <div className="mt-auto flex items-center justify-between gap-2 border-t px-4 py-2.5 text-[11px] text-muted-foreground">
        <span className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1" title="Lines and units">
            <Package className="h-3.5 w-3.5" />
            {items.length} {items.length === 1 ? 'line' : 'lines'} · {units} units
          </span>
          <span className="inline-flex items-center gap-1" title="Purchase date">
            <CalendarDays className="h-3.5 w-3.5" />
            {formatDate(purchase.purchaseDate || purchase.createdAt)}
          </span>
        </span>
        <span className="text-sm font-semibold tabular-nums text-foreground">{formatPurchaseAmount(purchase.totalAmount)}</span>
      </div>
      <Link href={`/admin/stock-purchase/history/${purchase.id}`} className="sr-only" onClick={stop}>
        Open purchase {purchase.invoiceNumber || purchase.id}
      </Link>
    </Card>
  );
}
