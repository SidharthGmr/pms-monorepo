'use client';
import ConfirmBox from '@/components/common/confirm-box';
import ListPagination from '@/components/common/list-pagination';
import { ListView, readStoredView, storeView } from '@/components/common/view-switch';
import { CustomDataTable } from '@/components/Table/data-table';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/components/ui/use-toast';
import config from '@/config';
import { container } from '@/config/ioc';
import { TYPES } from '@/config/types';
import { PriceHistoryDto } from '@/dtos/price-history.dto';
import { Roles } from '@/enums/roles.enum';
import { useDeletePriceHistory, useGetAllPriceHistories } from '@/hooks/service-hooks/usePriceHistoryService';
import { useCustomDataTable } from '@/hooks/use-custom-table';
import useModalShowHide from '@/hooks/use-modal-show-hide';
import useGetCurrentUser from '@/hooks/useGetCurrentUser';
import { cn } from '@/lib/utils';
import { PriceHistoryFilterParams } from '@/params/price-history.params';
import IUnitOfService from '@/services/interfaces/IUnitOfService';
import { Tags } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';
import ManagePriceHistory from './add-edit';
import { usePriceHistoryColumns } from './columns';
import PriceHistoryFilter, { DEFAULT_PRICE_FILTER, PriceHistoryFilterValue, SortDirection } from './filter';
import PriceCard from './price-card';
import PriceTimeline from './price-timeline';
import PriceHistorySummary from './summary';

// `p-0` alone loses to the Card's own `md:p-5` in tailwind-merge (different variant).
const FLUSH_CARD = 'p-0 md:p-0';
const GRID = 'grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4';
const VIEW_STORAGE_KEY = 'price-histories.view';

// `to` is the start of that day, so push it to the end of it - otherwise a change made
// at 14:00 on the last day of the range falls outside it.
const endOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999).toISOString();

interface PriceHistoryListProps {
  onCountChange?: (total: number) => void;
}

export default function PriceHistoryList({ onCountChange }: PriceHistoryListProps) {
  const unitOfService = container.get<IUnitOfService>(TYPES.IUnitOfService);
  const searchParams = useSearchParams();
  const { currentUser } = useGetCurrentUser();

  // Only admins may correct or delete a ledger row (enforced by the API too).
  const canManage = currentUser?.role === Roles.ADMIN || currentUser?.role === Roles.SUPER_ADMIN;

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

  // Product/variant screens deep-link here with ?productId=/?variantId=, and the URL seeds the
  // first render so a shared link opens on the same view; after that the page owns the state.
  const [filter, setFilter] = useState<PriceHistoryFilterValue>(() => ({
    ...DEFAULT_PRICE_FILTER,
    search: searchParams.get('search') ?? '',
    productId: searchParams.get('productId') ? +searchParams.get('productId')! : undefined,
    variantId: searchParams.get('variantId') ? +searchParams.get('variantId')! : undefined,
    sortBy: searchParams.get('sortBy') ?? DEFAULT_PRICE_FILTER.sortBy,
    sortDirection: (searchParams.get('sortDirection')?.toUpperCase() as SortDirection) === 'ASC' ? 'ASC' : 'DESC',
  }));
  const [page, setPage] = useState(() => Math.max(1, Number(searchParams.get('page')) || 1));
  const [pageSize, setPageSize] = useState(() => Number(searchParams.get('recordPerPage')) || config.recordPerPage);

  const params = useMemo<PriceHistoryFilterParams>(
    () => ({
      search: filter.search || undefined,
      productId: filter.productId,
      variantId: filter.variantId,
      startDate: filter.dateRange?.from ? filter.dateRange.from.toISOString() : undefined,
      endDate: filter.dateRange?.to ? endOfDay(filter.dateRange.to) : undefined,
      changeDirection: filter.changeDirection,
      state: filter.state ?? undefined,
      sortBy: filter.sortBy,
      sortDirection: filter.sortDirection,
      page,
      recordPerPage: pageSize,
    }),
    [filter, page, pageSize]
  );

  const listQuery = useGetAllPriceHistories(params);
  const deleteMutation = useDeletePriceHistory();

  const result = listQuery.data?.data?.data;
  const rows: PriceHistoryDto[] = useMemo(() => result?.data ?? [], [result]);
  const total = result?.totalRecord ?? 0;

  useEffect(() => {
    onCountChange?.(total);
  }, [total, onCountChange]);

  // A deep link can carry only ?variantId=; the product is read off the first row that arrives
  // so the product/variant selects in the toolbar show the real selection instead of placeholders.
  useEffect(() => {
    if (filter.variantId === undefined || filter.productId !== undefined) return;
    const productId = rows.find((row) => row.variantId === filter.variantId)?.productId;
    if (productId !== undefined) setFilter((current) => ({ ...current, productId }));
  }, [rows, filter.variantId, filter.productId]);

  // The timeline is opened per row but shows the whole variant, so it keeps the variant, not the row.
  const [timeline, setTimeline] = useState<{ variantId: number; title: string; sku?: string | null; productId?: number } | null>(null);
  const [recordFor, setRecordFor] = useState<{ variantId: number; productId?: number } | null>(null);

  const openTimeline = useCallback(
    (row: PriceHistoryDto) =>
      setTimeline({
        variantId: row.variantId,
        title: row.variant?.product?.name || `Variant #${row.variantId}`,
        sku: row.variant?.sku,
        productId: row.variant?.productId,
      }),
    []
  );

  const { showModal: showEditModal, openModal: openEditModal, closeModal: closeEditModal, uniqueId: editId } = useModalShowHide();
  const { showModal: showDeleteModal, openModal: openDeleteModal, closeModal: closeDeleteModal, uniqueId: deleteId } = useModalShowHide();

  // Paging and sorting are already applied by the API, so the table is told it is manual and simply renders the page it is given.
  const columns = usePriceHistoryColumns({
    editRecord: (id) => openEditModal(id),
    deleteRecord: (id) => openDeleteModal(id),
    viewTimeline: openTimeline,
    canManage,
  });

  const table = useCustomDataTable({
    columns,
    data: rows,
    manualFiltering: true,
    manualPagination: true,
    manualSorting: true,
    pageCount: Math.max(1, Math.ceil(total / Math.max(pageSize, 1))),
    pagination: { pageIndex: page - 1, pageSize },
    sorting: [{ id: filter.sortBy, desc: filter.sortDirection === 'DESC' }],
  });

  // Any change to what is being listed sends the user back to page 1, otherwise a narrower result set can leave them on an empty page.
  const updateFilter = (patch: Partial<PriceHistoryFilterValue>) => {
    setFilter((current) => ({ ...current, ...patch }));
    setPage(1);
  };

  const resetFilter = () => {
    setFilter(DEFAULT_PRICE_FILTER);
    setPage(1);
  };

  const changePageSize = (size: number) => {
    setPageSize(size);
    setPage(1);
  };

  const handleDelete = async (id: number) => {
    const response = await deleteMutation.mutateAsync(id);
    if (response && (response.status === 200 || response.status === 204)) {
      toast({ variant: 'success', title: 'Price row deleted' });
    } else {
      const error = unitOfService.ErrorHandlerService.getErrorMessage(response);
      toast({ variant: 'destructive', title: 'Error', description: <span>{error}</span> });
    }
    closeDeleteModal(true);
  };

  const isFiltered =
    filter.search !== '' ||
    filter.productId !== undefined ||
    filter.variantId !== undefined ||
    !!(filter.dateRange?.from || filter.dateRange?.to) ||
    filter.changeDirection !== undefined ||
    filter.state !== null;
  const showSkeleton = listQuery.isPending;

  return (
    <div className="space-y-4">
      {filter.variantId && <PriceHistorySummary variantId={filter.variantId} />}

      <PriceHistoryFilter
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
          <p className="text-sm font-semibold text-destructive">Could not load the price ledger</p>
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
                <Tags className="h-6 w-6 text-muted-foreground/40" />
                <span className="text-sm">{isFiltered ? 'No price rows match these filters.' : 'No prices recorded yet.'}</span>
              </div>
            }
          />
        </Card>
      ) : showSkeleton ? (
        <div className={GRID} aria-busy="true" aria-label="Loading price history">
          {Array.from({ length: Math.min(pageSize, 12) }).map((_, i) => (
            <Card key={i} className={cn(FLUSH_CARD, 'overflow-hidden border')}>
              <Skeleton className="h-16 w-full rounded-none" />
              <div className="space-y-2 p-4">
                <Skeleton className="h-7 w-1/2" />
                <Skeleton className="h-12 w-full" />
              </div>
            </Card>
          ))}
        </div>
      ) : rows.length === 0 ? (
        <Card className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
          <div className="rounded-full bg-muted p-4 text-muted-foreground">
            <Tags className="h-7 w-7" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-semibold">{isFiltered ? 'No price rows match these filters' : 'No prices recorded yet'}</p>
            <p className="text-xs text-muted-foreground">
              {isFiltered ? 'Try a different product, variant, date range or direction.' : 'Use "Record price" above to add the first entry.'}
            </p>
          </div>
        </Card>
      ) : (
        <div className={cn(GRID, listQuery.isFetching && 'opacity-60 transition-opacity')} aria-busy={listQuery.isFetching}>
          {rows.map((row) => (
            <PriceCard
              key={row.id}
              row={row}
              canManage={canManage}
              onEdit={() => openEditModal(row.id)}
              onDelete={() => openDeleteModal(row.id)}
              onViewTimeline={() => openTimeline(row)}
            />
          ))}
        </div>
      )}

      {total > pageSize && (
        <Card size="sm">
          <ListPagination page={page} pageSize={pageSize} total={total} loading={listQuery.isFetching} onPageChange={setPage} onPageSizeChange={changePageSize} />
        </Card>
      )}

      {timeline && (
        <PriceTimeline
          isOpen
          variantId={timeline.variantId}
          title={timeline.title}
          sku={timeline.sku}
          onClose={() => setTimeline(null)}
          onRecordNew={
            canManage
              ? () => {
                  setRecordFor({ variantId: timeline.variantId, productId: timeline.productId });
                  setTimeline(null);
                }
              : undefined
          }
        />
      )}

      {recordFor && (
        <ManagePriceHistory
          isOpen
          defaultProductId={recordFor.productId}
          defaultVariantId={recordFor.variantId}
          onClose={() => setRecordFor(null)}
        />
      )}

      {showEditModal && editId && <ManagePriceHistory id={+editId} isOpen={showEditModal} onClose={(refresh) => closeEditModal(refresh)} />}
      {showDeleteModal && deleteId && (
        <ConfirmBox
          isOpen={showDeleteModal}
          onClose={() => closeDeleteModal(false)}
          onSubmit={() => handleDelete(+deleteId)}
          heading="Delete price row"
          loading={deleteMutation.isPending}
          bodyText="This removes the row from the ledger for good. If it is the live price, the variant rolls back to the price before it."
        />
      )}
    </div>
  );
}
