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
import { OrderDto } from '@/dtos/order.dto';
import { OrderStatus } from '@/enums/order-status.enum';
import { useDeleteOrder, useGetAllOrders } from '@/hooks/service-hooks/useOrderService';
import { useCustomDataTable } from '@/hooks/use-custom-table';
import useModalShowHide from '@/hooks/use-modal-show-hide';
import { cn } from '@/lib/utils';
import { OrderFilterParams } from '@/params/order.params';
import IUnitOfService from '@/services/interfaces/IUnitOfService';
import { ShoppingBag } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';
import ManageOrder from './add-edit';
import { useOrderColumns } from './columns';
import OrderListFilter, { DEFAULT_ORDER_FILTER, OrderFilterValue, SortDirection } from './filter';
import OrderCard from './order-card';

// `p-0` alone loses to the Card's own `md:p-5` in tailwind-merge (different variant).
const FLUSH_CARD = 'p-0 md:p-0';
const GRID = 'grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4';
const VIEW_STORAGE_KEY = 'orders.view';

const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0).toISOString();
const endOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999).toISOString();

interface OrderListProps {
  onCountChange?: (total: number) => void;
}

export default function OrderList({ onCountChange }: OrderListProps) {
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
  const [filter, setFilter] = useState<OrderFilterValue>(() => {
    const from = searchParams.get('startDate');
    const to = searchParams.get('endDate');
    return {
      search: searchParams.get('search') ?? DEFAULT_ORDER_FILTER.search,
      status: (searchParams.get('status') as OrderStatus) || DEFAULT_ORDER_FILTER.status,
      dateRange: from || to ? { from: from ? new Date(from) : undefined, to: to ? new Date(to) : undefined } : undefined,
      sortBy: searchParams.get('sortBy') ?? DEFAULT_ORDER_FILTER.sortBy,
      sortDirection: (searchParams.get('sortDirection')?.toUpperCase() as SortDirection) === 'ASC' ? 'ASC' : 'DESC',
    };
  });
  const [page, setPage] = useState(() => Math.max(1, Number(searchParams.get('page')) || 1));
  const [pageSize, setPageSize] = useState(() => Number(searchParams.get('recordPerPage')) || config.recordPerPage);

  const params = useMemo<OrderFilterParams>(
    () => ({
      search: filter.search || undefined,
      status: filter.status ?? undefined,
      startDate: filter.dateRange?.from ? startOfDay(filter.dateRange.from) : undefined,
      endDate: filter.dateRange?.to ? endOfDay(filter.dateRange.to) : undefined,
      sortBy: filter.sortBy,
      sortDirection: filter.sortDirection,
      page,
      recordPerPage: pageSize,
    }),
    [filter, page, pageSize]
  );

  const listQuery = useGetAllOrders(params);
  const deleteMutation = useDeleteOrder();

  const result = listQuery.data?.data?.data;
  const orders: OrderDto[] = useMemo(() => result?.data ?? [], [result]);
  const total = result?.totalRecord ?? 0;

  useEffect(() => {
    onCountChange?.(total);
  }, [total, onCountChange]);

  const { showModal: showEditModal, openModal: openEditModal, closeModal: closeEditModal, uniqueId: editId } = useModalShowHide();
  const { showModal: showDeleteModal, openModal: openDeleteModal, closeModal: closeDeleteModal, uniqueId: deleteId } = useModalShowHide();

  // An order carries its items, bill and timeline, which is more than a dialog can hold, so
  // viewing one opens its own page.
  const openView = useCallback((id: number) => router.push(`/admin/orders/${id}`), [router]);

  // Paging and sorting are already applied by the API, so the table is told it is manual and simply renders the page it is given.
  const columns = useOrderColumns((id) => openEditModal(id), (id) => openDeleteModal(id), openView);
  const table = useCustomDataTable({
    columns,
    data: orders,
    manualFiltering: true,
    manualPagination: true,
    manualSorting: true,
    pageCount: Math.max(1, Math.ceil(total / Math.max(pageSize, 1))),
    pagination: { pageIndex: page - 1, pageSize },
    sorting: [{ id: filter.sortBy, desc: filter.sortDirection === 'DESC' }],
  });

  // Any change to what is being listed sends the user back to page 1, otherwise a narrower result set can leave them on an empty page.
  const updateFilter = (patch: Partial<OrderFilterValue>) => {
    setFilter((current) => ({ ...current, ...patch }));
    setPage(1);
  };

  const resetFilter = () => {
    setFilter(DEFAULT_ORDER_FILTER);
    setPage(1);
  };

  const changePageSize = (size: number) => {
    setPageSize(size);
    setPage(1);
  };

  const handleDelete = async (id: number) => {
    const response = await deleteMutation.mutateAsync(id);
    if (response && (response.status === 200 || response.status === 204)) {
      toast({ variant: 'success', title: 'Order deleted successfully' });
    } else {
      const error = unitOfService.ErrorHandlerService.getErrorMessage(response);
      toast({ variant: 'destructive', title: 'Error', description: <span>{error}</span> });
    }
    closeDeleteModal(true);
  };

  const isFiltered = filter.search !== '' || filter.status !== null || !!filter.dateRange;
  const showSkeleton = listQuery.isPending;

  return (
    <div className="space-y-4">
      <OrderListFilter
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
          <p className="text-sm font-semibold text-destructive">Could not load orders</p>
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
                <ShoppingBag className="h-6 w-6 text-muted-foreground/40" />
                <span className="text-sm">{isFiltered ? 'No orders match these filters.' : 'No orders yet. Use "Add order" above to record the first one.'}</span>
              </div>
            }
          />
        </Card>
      ) : showSkeleton ? (
        <div className={GRID} aria-busy="true" aria-label="Loading orders">
          {Array.from({ length: Math.min(pageSize, 12) }).map((_, index) => (
            <Card key={index} className={cn(FLUSH_CARD, 'overflow-hidden border')}>
              <div className="space-y-2 p-4">
                <Skeleton className="h-3.5 w-2/3" />
                <Skeleton className="h-2.5 w-1/3" />
                <Skeleton className="h-6 w-1/2" />
              </div>
            </Card>
          ))}
        </div>
      ) : orders.length === 0 ? (
        <Card className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
          <div className="rounded-full bg-muted p-4 text-muted-foreground">
            <ShoppingBag className="h-7 w-7" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-semibold">{isFiltered ? 'No orders match these filters' : 'No orders yet'}</p>
            <p className="text-xs text-muted-foreground">{isFiltered ? 'Try a different search, status or date range.' : 'Use "Add order" above to record the first one.'}</p>
          </div>
        </Card>
      ) : (
        <div className={cn(GRID, listQuery.isFetching && 'opacity-60 transition-opacity')} aria-busy={listQuery.isFetching}>
          {orders.map((order) => (
            <OrderCard key={order.id} order={order} onView={() => openView(order.id)} onEdit={() => openEditModal(order.id)} onDelete={() => openDeleteModal(order.id)} />
          ))}
        </div>
      )}

      {total > pageSize && (
        <Card size="sm">
          <ListPagination page={page} pageSize={pageSize} total={total} loading={listQuery.isFetching} onPageChange={setPage} onPageSizeChange={changePageSize} />
        </Card>
      )}

      {showEditModal && editId && <ManageOrder id={+editId} isOpen={showEditModal} onClose={(refresh) => closeEditModal(refresh)} />}
      {showDeleteModal && deleteId && (
        <ConfirmBox
          isOpen={showDeleteModal}
          onClose={() => closeDeleteModal(false)}
          onSubmit={() => handleDelete(+deleteId)}
          heading="Delete order"
          loading={deleteMutation.isPending}
          bodyText="Delete this order? This cannot be undone."
        />
      )}
    </div>
  );
}
