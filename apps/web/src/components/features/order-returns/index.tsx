'use client';
import { useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Undo2 } from 'lucide-react';

import { CustomDataTable } from '@/components/Table/data-table';
import ListPagination from '@/components/common/list-pagination';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import config from '@/config';
import { useGetAllOrderReturns } from '@/hooks/service-hooks/useOrderReturnService';
import { useCustomDataTable } from '@/hooks/use-custom-table';
import { OrderReturnDto, OrderReturnFilterParams, ReturnStatus } from '@pms/types';
import { useOrderReturnColumns } from './columns';
import OrderReturnFilter, { DEFAULT_ORDER_RETURN_FILTER, OrderReturnFilterValue, SortDirection } from './filter';
import OrderReturnView from './view';

// `p-0` alone loses to the Card's own `md:p-5` in tailwind-merge (different variant).
const FLUSH_CARD = 'p-0 md:p-0';

const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0).toISOString();
const endOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999).toISOString();

interface OrderReturnListProps {
  onCountChange?: (total: number) => void;
}

export default function OrderReturnList({ onCountChange }: OrderReturnListProps) {
  const searchParams = useSearchParams();

  // The URL seeds the first render so a shared link opens on the same view; after that the page owns the state.
  const [filter, setFilter] = useState<OrderReturnFilterValue>(() => {
    const from = searchParams.get('startDate');
    const to = searchParams.get('endDate');
    return {
      search: searchParams.get('search') ?? DEFAULT_ORDER_RETURN_FILTER.search,
      status: (searchParams.get('status') as ReturnStatus) || DEFAULT_ORDER_RETURN_FILTER.status,
      dateRange: from || to ? { from: from ? new Date(from) : undefined, to: to ? new Date(to) : undefined } : undefined,
      sortBy: searchParams.get('sortBy') ?? DEFAULT_ORDER_RETURN_FILTER.sortBy,
      sortDirection: (searchParams.get('sortDirection')?.toUpperCase() as SortDirection) === 'ASC' ? 'ASC' : 'DESC',
    };
  });
  const [page, setPage] = useState(() => Math.max(1, Number(searchParams.get('page')) || 1));
  const [pageSize, setPageSize] = useState(() => Number(searchParams.get('recordPerPage')) || config.recordPerPage);
  const [viewId, setViewId] = useState<number | null>(null);

  const params = useMemo<OrderReturnFilterParams>(
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

  const listQuery = useGetAllOrderReturns(params);
  const result = listQuery.data?.data?.data;
  const returns: OrderReturnDto[] = useMemo(() => result?.data ?? [], [result]);
  const total = result?.totalRecord ?? 0;
  if (onCountChange && result) onCountChange(total);

  const columns = useOrderReturnColumns((id) => setViewId(id));
  const table = useCustomDataTable({
    columns,
    data: returns,
    manualFiltering: true,
    manualPagination: true,
    manualSorting: true,
    pageCount: Math.max(1, Math.ceil(total / Math.max(pageSize, 1))),
    pagination: { pageIndex: page - 1, pageSize },
    sorting: [{ id: filter.sortBy, desc: filter.sortDirection === 'DESC' }],
  });

  // Any change to what is being listed sends the user back to page 1, otherwise a narrower
  // result set can leave them on an empty page.
  const updateFilter = (patch: Partial<OrderReturnFilterValue>) => {
    setFilter((current) => ({ ...current, ...patch }));
    setPage(1);
  };

  const resetFilter = () => {
    setFilter(DEFAULT_ORDER_RETURN_FILTER);
    setPage(1);
  };

  const isFiltered = filter.search !== '' || filter.status !== null || !!filter.dateRange;

  return (
    <div className="space-y-4">
      <OrderReturnFilter value={filter} onChange={updateFilter} onReset={resetFilter} total={total} loading={listQuery.isFetching} />

      {listQuery.isPending ? (
        <Card className={FLUSH_CARD}>
          <div className="space-y-3 p-4">
            {Array.from({ length: 6 }).map((_, index) => (
              <Skeleton key={index} className="h-12 w-full" />
            ))}
          </div>
        </Card>
      ) : returns.length === 0 ? (
        <Card className="flex flex-col items-center justify-center gap-2 py-16 text-center">
          <Undo2 className="h-8 w-8 text-muted-foreground/50" />
          <p className="text-sm font-medium">{isFiltered ? 'No returns match these filters' : 'No returns yet'}</p>
          <p className="max-w-sm text-xs text-muted-foreground">
            {isFiltered ? 'Clear the filters to see everything.' : 'Open a delivered invoice and use Return / Exchange to start one.'}
          </p>
        </Card>
      ) : (
        <>
          <Card className={FLUSH_CARD}>
            <CustomDataTable columns={columns} table={table} isLoading={listQuery.isFetching} />
          </Card>
          <ListPagination page={page} pageSize={pageSize} total={total} onPageChange={setPage} onPageSizeChange={(size) => (setPageSize(size), setPage(1))} />
        </>
      )}

      {viewId !== null && <OrderReturnView id={viewId} isOpen={viewId !== null} onClose={() => setViewId(null)} />}
    </div>
  );
}
