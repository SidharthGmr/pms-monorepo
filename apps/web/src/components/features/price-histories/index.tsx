'use client';
import { CustomDataTable } from '@/components/Table/data-table';
import { DataTablePagination } from '@/components/Table/data-table-pagination';
import ConfirmBox from '@/components/common/confirm-box';
import { toast } from '@/components/ui/use-toast';
import config from '@/config';
import { container } from '@/config/ioc';
import { TYPES } from '@/config/types';
import { PriceHistoryDto } from '@/dtos/price-history.dto';
import {
  useDeletePriceHistory,
  useGetAllPriceHistories,
  useGetEffectivePrice,
} from '@/hooks/service-hooks/usePriceHistoryService';
import { useCustomDataTable } from '@/hooks/use-custom-table';
import useModalShowHide from '@/hooks/use-modal-show-hide';
import { useTanstackTablePagination } from '@/hooks/use-tanstack-table-pagination';
import { useTanstackTableSorting } from '@/hooks/use-tanstack-table-sorting';
import useGetCurrentUser from '@/hooks/useGetCurrentUser';
import { PriceHistoryFilterParams } from '@/params/price-history.params';
import { Roles } from '@/enums/roles.enum';
import IUnitOfService from '@/services/interfaces/IUnitOfService';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import ManagePriceHistory from './add-edit';
import { usePriceHistoryColumns } from './columns';
import PriceHistoryFilter from './filter';
import PriceHistorySummary from './summary';

export default function PriceHistoryList() {
  const unitOfService = container.get<IUnitOfService>(TYPES.IUnitOfService);
  const searchParams = useSearchParams();
  const { currentUser } = useGetCurrentUser();

  // Only admins may correct or delete a ledger row (enforced by the API too).
  const canManage = currentUser?.role === Roles.ADMIN || currentUser?.role === Roles.SUPER_ADMIN;

  // Product/variant screens deep-link here with ?productId=/?variantId=
  const initialProductId = searchParams.get('productId') ? +searchParams.get('productId')! : undefined;
  const initialVariantId = searchParams.get('variantId') ? +searchParams.get('variantId')! : undefined;

  const [data, setData] = useState<PriceHistoryDto[]>([]);
  const [recordCount, setRecordCount] = useState<number>(0);

  const { showModal: showEditModal, openModal: openEditModal, closeModal: closeEditModal, uniqueId: editId } = useModalShowHide();
  const { showModal: showDeleteModal, openModal: openDeleteModal, closeModal: closeDeleteModal, uniqueId: deleteId } = useModalShowHide();

  const [filterParams, setFilterParams] = useState<PriceHistoryFilterParams>({
    search: searchParams.get('search') || '',
    productId: initialProductId,
    variantId: initialVariantId,
    page: +(searchParams.get('page') || 1),
    recordPerPage: +(searchParams.get('recordPerPage') || config.recordPerPage),
    sortBy: searchParams.get('sortBy') || 'effectiveFrom',
    sortDirection: searchParams.get('sortDirection') || 'DESC',
  });

  const listResponse = useGetAllPriceHistories(filterParams);
  const deleteMutation = useDeletePriceHistory();

  // Which row is live right now - asked of the API instead of inferred from the page,
  // which would be wrong past page one. Only meaningful for a single variant.
  const { data: effectiveResponse } = useGetEffectivePrice(filterParams.variantId ?? 0, undefined, !!filterParams.variantId);

  const columns = usePriceHistoryColumns({
    editRecord: (id) => openEditModal(id),
    deleteRecord: (id) => openDeleteModal(id),
    effectiveRowId: effectiveResponse?.data?.data?.id,
    canManage,
  });

  useEffect(() => {
    if (listResponse.status === 'success' && listResponse.data?.data?.data) {
      const result = listResponse.data.data.data;
      setData(result.data ?? []);
      setRecordCount(result.totalRecord ?? 0);
    }
  }, [listResponse.status, listResponse.data]);

  const { sorting, onSortingChange } = useTanstackTableSorting<PriceHistoryDto>(
    filterParams.sortBy ?? 'effectiveFrom',
    filterParams.sortDirection ?? 'DESC',
    columns
  );
  const { onPaginationChange, pagination } = useTanstackTablePagination(filterParams.recordPerPage);

  const table = useCustomDataTable({
    columns,
    data,
    manualFiltering: true,
    manualPagination: true,
    manualSorting: true,
    pageCount: Math.ceil((recordCount || 0) / (filterParams.recordPerPage || 1)),
    pagination,
    sorting,
    onPaginationChange,
    onSortingChange,
  });

  useEffect(() => {
    setFilterParams((prev) => ({ ...prev, page: pagination.pageIndex + 1, recordPerPage: pagination.pageSize }));
  }, [pagination]);

  const resetForm = () => {
    setFilterParams({
      search: '',
      productId: undefined,
      variantId: undefined,
      startDate: undefined,
      endDate: undefined,
      changeDirection: undefined,
      page: 1,
      recordPerPage: config.recordPerPage,
      sortBy: 'effectiveFrom',
      sortDirection: 'DESC',
    });
  };

  const handleDelete = async (id: number) => {
    const result = await deleteMutation.mutateAsync(id);
    if (result && (result.status === 200 || result.status === 204)) {
      toast({ variant: 'success', title: 'Price row deleted successfully' });
    } else {
      const error = unitOfService.ErrorHandlerService.getErrorMessage(result);
      toast({ variant: 'destructive', title: 'Error', description: <span>{error}</span> });
    }
    closeDeleteModal(true);
  };

  if (listResponse.isError) {
    return <div className="py-10 text-center text-destructive">Error loading price history</div>;
  }

  return (
    <>
      <div className="space-y-4">
        {filterParams.variantId && <PriceHistorySummary variantId={filterParams.variantId} />}

        <PriceHistoryFilter
          table={table}
          initialProductId={initialProductId}
          initialVariantId={initialVariantId}
          resetForm={resetForm}
          onTextChange={(value) => setFilterParams((prev) => ({ ...prev, search: value || '', page: 1 }))}
          onProductChange={(productId) => setFilterParams((prev) => ({ ...prev, productId, variantId: undefined, page: 1 }))}
          onVariantChange={(variantId) => setFilterParams((prev) => ({ ...prev, variantId, page: 1 }))}
          onDateRangeChange={(startDate, endDate) => setFilterParams((prev) => ({ ...prev, startDate, endDate, page: 1 }))}
          onDirectionChange={(changeDirection) => setFilterParams((prev) => ({ ...prev, changeDirection, page: 1 }))}
        />
        <CustomDataTable columns={columns} table={table} isLoading={listResponse.isLoading} />
        <DataTablePagination table={table} totalRecord={recordCount} loading={listResponse.isLoading} />
      </div>

      {showEditModal && editId && <ManagePriceHistory id={+editId} isOpen={showEditModal} onClose={(refresh) => closeEditModal(refresh)} />}
      {showDeleteModal && deleteId && (
        <ConfirmBox
          isOpen={showDeleteModal}
          onClose={() => closeDeleteModal(false)}
          onSubmit={() => handleDelete(+deleteId)}
          heading="Delete Price Row"
          loading={deleteMutation.isPending}
          bodyText="This removes the row from the ledger for good. If it is the live price, the variant rolls back to the price before it."
        />
      )}
    </>
  );
}
