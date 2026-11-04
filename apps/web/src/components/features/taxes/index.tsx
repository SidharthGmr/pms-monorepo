'use client';
import { useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Percent, Plus } from 'lucide-react';
import { TaxDto, TaxFilterParams } from '@pms/types';
import { useDeleteTax, useGetAllTaxes } from '@/hooks/service-hooks/useTaxService';
import useModalShowHide from '@/hooks/use-modal-show-hide';
import { container } from '@/config/ioc';
import { TYPES } from '@/config/types';
import IUnitOfService from '@/services/interfaces/IUnitOfService';
import config from '@/config';

import { cn } from '@/lib/utils';
import ConfirmBox from '@/components/common/confirm-box';
import { Card } from '@/components/ui/card';
import { toast } from '@/components/ui/use-toast';
import ManageTax from './add-edit';
import { useTaxColumns } from './columns';
import { useCustomDataTable } from '@/hooks/use-custom-table';
import { CustomDataTable } from '@/components/Table/data-table';
import TaxFilter, { DEFAULT_TAX_FILTER, SortDirection, TaxFilterValue } from './filter';
import ListPagination from '@/components/common/list-pagination';
import { Button } from '@/components/ui/button';
import ListPageHeader from '@/components/common/list-page-header';

const FLUSH_CARD = 'p-0 md:p-0';

export default function Taxes() {
  const unitOfService = container.get<IUnitOfService>(TYPES.IUnitOfService);
  const searchParams = useSearchParams();
  const [showAddModal, setShowAddModal] = useState(false);

  const [filter, setFilter] = useState<TaxFilterValue>(() => ({
    search: searchParams.get('search') ?? DEFAULT_TAX_FILTER.search,
    active: DEFAULT_TAX_FILTER.active,
    sortBy: searchParams.get('sortBy') ?? DEFAULT_TAX_FILTER.sortBy,
    sortDirection: (searchParams.get('sortDirection')?.toUpperCase() as SortDirection) === 'ASC' ? 'ASC' : 'DESC',
  }));

  const [page, setPage] = useState(() => Math.max(1, Number(searchParams.get('page')) || 1));
  const [pageSize, setPageSize] = useState(() => Number(searchParams.get('recordPerPage')) || config.recordPerPage);

  const params = useMemo<TaxFilterParams>(
    () => ({
      search: filter.search,
      ...(filter.active !== null && { isActive: filter.active === 'active' }),
      sortBy: filter.sortBy,
      sortDirection: filter.sortDirection,
      page,
      recordPerPage: pageSize,
    }),
    [filter, page, pageSize]
  );

  const listQuery = useGetAllTaxes(params);
  const deleteMutation = useDeleteTax();

  const result = listQuery.data?.data?.data;
  const taxes: TaxDto[] = result?.data ?? [];
  const total = result?.totalRecord ?? 0;

  const { showModal: showEditModal, openModal: openEditModal, closeModal: closeEditModal, uniqueId: editId } = useModalShowHide();
  const { showModal: showDeleteModal, openModal: openDeleteModal, closeModal: closeDeleteModal, uniqueId: deleteId } = useModalShowHide();

  // Paging and sorting are already applied by the API, so the table is told it is
  // manual and simply renders the page it is given.
  const columns = useTaxColumns(
    (id) => openEditModal(id),
    (id) => openDeleteModal(id)
  );
  const table = useCustomDataTable({
    columns,
    data: taxes,
    manualFiltering: true,
    manualPagination: true,
    manualSorting: true,
    pageCount: Math.max(1, Math.ceil(total / Math.max(pageSize, 1))),
    pagination: { pageIndex: page - 1, pageSize },
    sorting: [{ id: filter.sortBy, desc: filter.sortDirection === 'DESC' }],
  });

  const updateFilter = (patch: Partial<TaxFilterValue>) => {
    setFilter((current) => ({ ...current, ...patch }));
    setPage(1);
  };

  const resetFilter = () => {
    setFilter(DEFAULT_TAX_FILTER);
    setPage(1);
  };

  const changePageSize = (size: number) => {
    setPageSize(size);
    setPage(1);
  };

  const handleDelete = async (id: string) => {
    const response = await deleteMutation.mutateAsync(id);
    if (response && response.status === 200) {
      toast({ variant: 'success', title: 'Tax deleted' });
    } else {
      const error = unitOfService.ErrorHandlerService.getErrorMessage(response);
      toast({ variant: 'destructive', title: 'Error', description: <span>{error}</span> });
    }
    closeDeleteModal(true);
  };

  const isFiltered = filter.search !== '' || filter.active !== null;
  const showSkeleton = listQuery.isPending;

  return (
    <div className="space-y-4">
      <ListPageHeader
        icon={Percent}
        title="Taxes"
        description={listQuery.isPending ? 'Manage tax rates' : `${total} ${total === 1 ? 'tax' : 'taxes'}, shared by every store`}
        actions={
          <Button type="button" className="h-9 gap-1.5" onClick={() => setShowAddModal(true)}>
            <Plus className="h-4 w-4" />
            Add tax
          </Button>
        }
      />

      <TaxFilter value={filter} onChange={updateFilter} onReset={resetFilter} total={listQuery.isPending ? undefined : total} loading={listQuery.isFetching} />

      {listQuery.isError ? (
        <Card className="py-16 text-center">
          <p className="text-sm font-semibold text-destructive">Could not load taxes</p>
          <p className="mt-1 text-xs text-muted-foreground">Check your connection and try again.</p>
        </Card>
      ) : (
        <Card className={cn(FLUSH_CARD, 'overflow-hidden', listQuery.isFetching && !showSkeleton && 'opacity-60 transition-opacity')}>
          <CustomDataTable
            columns={columns}
            table={table}
            isLoading={showSkeleton}
            flush
            emptyMessage={
              <div className="flex flex-col items-center gap-2 py-6 text-muted-foreground">
                <Percent className="h-6 w-6 text-muted-foreground/40" />
                <span className="text-sm">{isFiltered ? 'No taxes match these filters.' : 'No taxes yet. Use "Add tax" above to create the first one.'}</span>
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

      {showAddModal && <ManageTax isOpen={showAddModal} onClose={() => setShowAddModal(false)} />}
      {showEditModal && editId && <ManageTax id={String(editId)} isOpen={showEditModal} onClose={(refresh) => closeEditModal(refresh)} />}
      {showDeleteModal && deleteId && (
        <ConfirmBox
          isOpen={showDeleteModal}
          onClose={() => closeDeleteModal(false)}
          onSubmit={() => handleDelete(String(deleteId))}
          heading="Delete tax"
          loading={deleteMutation.isPending}
          bodyText="Delete this tax? Records that already reference it keep their history."
        />
      )}
    </div>
  );
}
