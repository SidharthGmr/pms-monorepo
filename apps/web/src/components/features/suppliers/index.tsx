'use client';
import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Plus, Truck } from 'lucide-react';
import { Status } from '@pms/types';
import { SupplierDto } from '@/dtos/supplier.dto';
import { SupplierFilterParams } from '@/params/supplier.params';
import { useDeleteSupplier, useGetAllSuppliers } from '@/hooks/service-hooks/useSupplierService';
import { useCustomDataTable } from '@/hooks/use-custom-table';
import useModalShowHide from '@/hooks/use-modal-show-hide';
import { container } from '@/config/ioc';
import { TYPES } from '@/config/types';
import IUnitOfService from '@/services/interfaces/IUnitOfService';
import config from '@/config';
import { cn } from '@/lib/utils';
import { CustomDataTable } from '@/components/Table/data-table';
import ConfirmBox from '@/components/common/confirm-box';
import ListPageHeader from '@/components/common/list-page-header';
import ListPagination from '@/components/common/list-pagination';
import { ListView, readStoredView, storeView } from '@/components/common/view-switch';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/components/ui/use-toast';
import ManageSupplier from './add-edit';
import SupplierCard from './supplier-card';
import { useSupplierColumns } from './columns';
import SupplierFilter, { DEFAULT_SUPPLIER_FILTER, SortDirection, SupplierFilterValue } from './filter';

// `p-0` alone loses to the Card's own `md:p-5` in tailwind-merge (different variant).
const FLUSH_CARD = 'p-0 md:p-0';
const GRID = 'grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4';
const VIEW_STORAGE_KEY = 'suppliers.view';

const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0).toISOString();
const endOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999).toISOString();

export default function SupplierList() {
  const unitOfService = container.get<IUnitOfService>(TYPES.IUnitOfService);
  const searchParams = useSearchParams();
  const [showAddModal, setShowAddModal] = useState(false);

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
  const [filter, setFilter] = useState<SupplierFilterValue>(() => {
    const from = searchParams.get('startDate');
    const to = searchParams.get('endDate');
    return {
      search: searchParams.get('search') ?? DEFAULT_SUPPLIER_FILTER.search,
      status: (searchParams.get('status') as Status) || DEFAULT_SUPPLIER_FILTER.status,
      dateRange: from || to ? { from: from ? new Date(from) : undefined, to: to ? new Date(to) : undefined } : undefined,
      sortBy: searchParams.get('sortBy') ?? DEFAULT_SUPPLIER_FILTER.sortBy,
      sortDirection: (searchParams.get('sortDirection')?.toUpperCase() as SortDirection) === 'DESC' ? 'DESC' : 'ASC',
    };
  });
  const [page, setPage] = useState(() => Math.max(1, Number(searchParams.get('page')) || 1));
  const [pageSize, setPageSize] = useState(() => Number(searchParams.get('recordPerPage')) || config.recordPerPage);

  const params = useMemo<SupplierFilterParams>(
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

  const listQuery = useGetAllSuppliers(params);
  const deleteMutation = useDeleteSupplier();

  const result = listQuery.data?.data?.data;
  const suppliers: SupplierDto[] = useMemo(() => result?.data ?? [], [result]);
  const total = result?.totalRecord ?? 0;

  const { showModal: showEditModal, openModal: openEditModal, closeModal: closeEditModal, uniqueId: editId } = useModalShowHide();
  const { showModal: showViewModal, openModal: openViewModal, closeModal: closeViewModal, uniqueId: viewId } = useModalShowHide();
  const { showModal: showDeleteModal, openModal: openDeleteModal, closeModal: closeDeleteModal, uniqueId: deleteId } = useModalShowHide();

  // Paging and sorting are already applied by the API, so the table is told it is manual and simply renders the page it is given.
  const columns = useSupplierColumns(
    (id) => openEditModal(id),
    (id) => openDeleteModal(id),
    (id) => openViewModal(id)
  );
  const table = useCustomDataTable({
    columns,
    data: suppliers,
    manualFiltering: true,
    manualPagination: true,
    manualSorting: true,
    pageCount: Math.max(1, Math.ceil(total / Math.max(pageSize, 1))),
    pagination: { pageIndex: page - 1, pageSize },
    sorting: [{ id: filter.sortBy, desc: filter.sortDirection === 'DESC' }],
  });

  // Any change to what is being listed sends the user back to page 1, otherwise a narrower result set can leave them on an empty page.
  const updateFilter = (patch: Partial<SupplierFilterValue>) => {
    setFilter((current) => ({ ...current, ...patch }));
    setPage(1);
  };

  const resetFilter = () => {
    setFilter(DEFAULT_SUPPLIER_FILTER);
    setPage(1);
  };

  const changePageSize = (size: number) => {
    setPageSize(size);
    setPage(1);
  };

  const handleDelete = async (id: number) => {
    const response = await deleteMutation.mutateAsync(id);
    if (response && (response.status === 204 || response.status === 200)) {
      toast({ variant: 'success', title: 'Supplier deleted' });
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
      <ListPageHeader
        icon={Truck}
        title="Suppliers"
        description={listQuery.isPending ? 'Who you buy stock from and how to reach them' : `${total} ${total === 1 ? 'supplier' : 'suppliers'} · who you buy stock from and how to reach them`}
        actions={
          <Button type="button" className="h-9 gap-1.5" onClick={() => setShowAddModal(true)}>
            <Plus className="h-4 w-4" />
            Add supplier
          </Button>
        }
      />

      <SupplierFilter
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
          <p className="text-sm font-semibold text-destructive">Could not load suppliers</p>
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
                <Truck className="h-6 w-6 text-muted-foreground/40" />
                <span className="text-sm">{isFiltered ? 'No suppliers match these filters.' : 'No suppliers yet. Use "Add supplier" above to create the first one.'}</span>
              </div>
            }
          />
        </Card>
      ) : showSkeleton ? (
        <div className={GRID} aria-busy="true" aria-label="Loading suppliers">
          {Array.from({ length: Math.min(pageSize, 12) }).map((_, i) => (
            <Card key={i} className={cn(FLUSH_CARD, 'overflow-hidden border')}>
              <Skeleton className="h-20 w-full rounded-none" />
              <div className="space-y-2 p-4">
                <Skeleton className="h-3 w-2/3" />
                <Skeleton className="h-3 w-1/2" />
                <Skeleton className="h-3 w-3/4" />
              </div>
            </Card>
          ))}
        </div>
      ) : suppliers.length === 0 ? (
        <Card className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
          <div className="rounded-full bg-muted p-4 text-muted-foreground">
            <Truck className="h-7 w-7" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-semibold">{isFiltered ? 'No suppliers match these filters' : 'No suppliers yet'}</p>
            <p className="text-xs text-muted-foreground">{isFiltered ? 'Try a different search, status or date range.' : 'Use "Add supplier" above to create the first one.'}</p>
          </div>
        </Card>
      ) : (
        <div className={cn(GRID, listQuery.isFetching && 'opacity-60 transition-opacity')} aria-busy={listQuery.isFetching}>
          {suppliers.map((supplier) => (
            <SupplierCard key={supplier.id} supplier={supplier} onView={() => openViewModal(supplier.id)} onEdit={() => openEditModal(supplier.id)} onDelete={() => openDeleteModal(supplier.id)} />
          ))}
        </div>
      )}

      {total > pageSize && (
        <Card size="sm">
          <ListPagination page={page} pageSize={pageSize} total={total} loading={listQuery.isFetching} onPageChange={setPage} onPageSizeChange={changePageSize} />
        </Card>
      )}

      {showAddModal && <ManageSupplier isOpen={showAddModal} onClose={() => setShowAddModal(false)} />}
      {showViewModal && viewId && <ManageSupplier id={+viewId} isOpen={showViewModal} mode="view" onClose={(refresh) => closeViewModal(refresh)} />}
      {showEditModal && editId && <ManageSupplier id={+editId} isOpen={showEditModal} onClose={(refresh) => closeEditModal(refresh)} />}
      {showDeleteModal && deleteId && (
        <ConfirmBox
          isOpen={showDeleteModal}
          onClose={() => closeDeleteModal(false)}
          onSubmit={() => handleDelete(+deleteId)}
          heading="Delete supplier"
          loading={deleteMutation.isPending}
          bodyText="Delete this supplier? Purchase history that references it is kept, but it will no longer be offered when receiving stock."
        />
      )}
    </div>
  );
}
