'use client';
import ConfirmBox from '@/components/common/confirm-box';
import ListPagination from '@/components/common/list-pagination';
import { CustomDataTable } from '@/components/Table/data-table';
import { Card } from '@/components/ui/card';
import { toast } from '@/components/ui/use-toast';
import config from '@/config';
import { container } from '@/config/ioc';
import { TYPES } from '@/config/types';
import { useDeleteEstimate, useGetAllEstimates } from '@/hooks/service-hooks/useEstimateService';
import { useCustomDataTable } from '@/hooks/use-custom-table';
import useModalShowHide from '@/hooks/use-modal-show-hide';
import { cn } from '@/lib/utils';
import IUnitOfService from '@/services/interfaces/IUnitOfService';
import { EstimateDto, EstimateFilterParams, EstimateStatus } from '@pms/types';
import { FileText } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useEstimateColumns } from './columns';
import EstimateListFilter, { DEFAULT_ESTIMATE_FILTER, EstimateFilterValue, SortDirection } from './filter';

const FLUSH_CARD = 'p-0 md:p-0';

const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0).toISOString();
const endOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999).toISOString();

interface EstimateListProps {
  onCountChange?: (total: number) => void;
}

export default function EstimateList({ onCountChange }: EstimateListProps) {
  const unitOfService = container.get<IUnitOfService>(TYPES.IUnitOfService);
  const searchParams = useSearchParams();
  const router = useRouter();

  // The URL seeds the first render so a shared link opens on the same view; after that the page owns the state.
  const [filter, setFilter] = useState<EstimateFilterValue>(() => {
    const from = searchParams.get('startDate');
    const to = searchParams.get('endDate');
    return {
      search: searchParams.get('search') ?? DEFAULT_ESTIMATE_FILTER.search,
      status: (searchParams.get('status') as EstimateStatus) || DEFAULT_ESTIMATE_FILTER.status,
      dateRange: from || to ? { from: from ? new Date(from) : undefined, to: to ? new Date(to) : undefined } : undefined,
      sortBy: searchParams.get('sortBy') ?? DEFAULT_ESTIMATE_FILTER.sortBy,
      sortDirection: (searchParams.get('sortDirection')?.toUpperCase() as SortDirection) === 'ASC' ? 'ASC' : 'DESC',
    };
  });
  const [page, setPage] = useState(() => Math.max(1, Number(searchParams.get('page')) || 1));
  const [pageSize, setPageSize] = useState(() => Number(searchParams.get('recordPerPage')) || config.recordPerPage);

  const params = useMemo<EstimateFilterParams>(
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

  const listQuery = useGetAllEstimates(params);
  const deleteMutation = useDeleteEstimate();

  const result = listQuery.data?.data?.data;
  const estimates: EstimateDto[] = useMemo(() => result?.data ?? [], [result]);
  const total = result?.totalRecord ?? 0;

  useEffect(() => {
    onCountChange?.(total);
  }, [total, onCountChange]);

  const { showModal: showDeleteModal, openModal: openDeleteModal, closeModal: closeDeleteModal, uniqueId: deleteId } = useModalShowHide();

  const openView = useCallback((id: number) => router.push(`/admin/estimates/${id}`), [router]);
  const openEdit = useCallback((id: number) => router.push(`/admin/estimates/${id}/edit`), [router]);
  const openDelete = useCallback((id: number) => openDeleteModal(id), [openDeleteModal]);

  // Paging and sorting are already applied by the API, so the table is told it is manual and simply renders the page it is given.
  const columns = useEstimateColumns(openEdit, openDelete, openView);
  const table = useCustomDataTable({
    columns,
    data: estimates,
    manualFiltering: true,
    manualPagination: true,
    manualSorting: true,
    pageCount: Math.max(1, Math.ceil(total / Math.max(pageSize, 1))),
    pagination: { pageIndex: page - 1, pageSize },
    sorting: [{ id: filter.sortBy, desc: filter.sortDirection === 'DESC' }],
  });

  // Any change to what is being listed sends the user back to page 1, otherwise a narrower result set can leave them on an empty page.
  const updateFilter = (patch: Partial<EstimateFilterValue>) => {
    setFilter((current) => ({ ...current, ...patch }));
    setPage(1);
  };

  const resetFilter = () => {
    setFilter(DEFAULT_ESTIMATE_FILTER);
    setPage(1);
  };

  const changePageSize = (size: number) => {
    setPageSize(size);
    setPage(1);
  };

  const handleDelete = async (id: number) => {
    const response = await deleteMutation.mutateAsync(id);
    if (response && response.status === 200) {
      toast({ variant: 'success', title: 'Estimate deleted successfully' });
    } else {
      const error = unitOfService.ErrorHandlerService.getErrorMessage(response);
      toast({ variant: 'destructive', title: 'Error', description: <span>{error}</span> });
    }
    closeDeleteModal(true);
  };

  const isFiltered = filter.search !== '' || filter.status !== null || !!filter.dateRange;

  return (
    <div className="space-y-4">
      <EstimateListFilter
        value={filter}
        onChange={updateFilter}
        onReset={resetFilter}
        total={listQuery.isPending ? undefined : total}
        loading={listQuery.isFetching}
      />

      {listQuery.isError ? (
        <Card className="py-16 text-center">
          <p className="text-sm font-semibold text-destructive">Could not load estimates</p>
          <p className="mt-1 text-xs text-muted-foreground">Check your connection and try again.</p>
        </Card>
      ) : (
        <Card className={cn(FLUSH_CARD, 'overflow-hidden', listQuery.isFetching && !listQuery.isPending && 'opacity-60 transition-opacity')}>
          <CustomDataTable
            columns={columns}
            table={table}
            isLoading={listQuery.isPending}
            flush
            emptyMessage={
              <div className="flex flex-col items-center gap-2 py-6 text-muted-foreground">
                <FileText className="h-6 w-6 text-muted-foreground/40" />
                <span className="text-sm">
                  {isFiltered ? 'No estimates match these filters.' : 'No estimates yet. Use "New Estimate" above to create the first one.'}
                </span>
              </div>
            }
          />
        </Card>
      )}

      {total > pageSize && (
        <Card size="sm">
          <ListPagination
            page={page}
            pageSize={pageSize}
            total={total}
            loading={listQuery.isFetching}
            onPageChange={setPage}
            onPageSizeChange={changePageSize}
          />
        </Card>
      )}

      {showDeleteModal && deleteId && (
        <ConfirmBox
          isOpen={showDeleteModal}
          onClose={() => closeDeleteModal(false)}
          onSubmit={() => handleDelete(+deleteId)}
          heading="Delete estimate"
          loading={deleteMutation.isPending}
          bodyText="Delete this estimate? This cannot be undone."
        />
      )}
    </div>
  );
}
