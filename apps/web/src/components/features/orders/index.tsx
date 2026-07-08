'use client';
import config from '@/config';
import { container } from '@/config/ioc';
import { TYPES } from '@/config/types';
import { OrderDto } from '@/dtos/order.dto';
import { useDeleteOrder, useGetAllOrders } from '@/hooks/service-hooks/useOrderService';
import { useCustomDataTable } from '@/hooks/use-custom-table';
import useModalShowHide from '@/hooks/use-modal-show-hide';
import { useTanstackTablePagination } from '@/hooks/use-tanstack-table-pagination';
import { useTanstackTableSorting } from '@/hooks/use-tanstack-table-sorting';
import { PageFilterParams } from '@/params/page.params';
import IUnitOfService from '@/services/interfaces/IUnitOfService';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { CustomDataTable } from '../../Table/data-table';
import { DataTablePagination } from '../../Table/data-table-pagination';
import ConfirmBox from '../../common/confirm-box';
import { toast } from '../../ui/use-toast';
import ManageOrder from './add-edit';
import { useOrderColumns } from './columns';
import OrderListFilter from './filter';

export default function OrderList() {
  const unitOfService = container.get<IUnitOfService>(TYPES.IUnitOfService);

  const [data, setData] = useState<OrderDto[]>([]);
  const [recordCount, setRecordCount] = useState<number>(0);
  const searchParams = useSearchParams();

  const { showModal: showEditModal, openModal: openEditModal, closeModal: closeEditModal, uniqueId: editId } = useModalShowHide();
  const { showModal: showDeleteModal, openModal: openDeleteModal, closeModal: closeDeleteModal, uniqueId: deleteId } = useModalShowHide();

  const [filterParams, setFilterParams] = useState<PageFilterParams>({
    search: searchParams.get('search') || '',
    page: +(searchParams.get('page') || 1),
    recordPerPage: +(searchParams.get('recordPerPage') || config.recordPerPage),
  });

  const columns = useOrderColumns(
    (id) => openEditModal(id),
    (id) => openDeleteModal(id)
  );

  const getAllOrdersResponse = useGetAllOrders(filterParams);
  const deleteOrderMutation = useDeleteOrder();

  useEffect(() => {
    if (getAllOrdersResponse.isSuccess && getAllOrdersResponse.data?.data?.data) {
      setData(getAllOrdersResponse.data.data.data.data ?? []);
      setRecordCount(getAllOrdersResponse.data.data.data.totalRecord ?? 0);
    }
  }, [getAllOrdersResponse.isSuccess, getAllOrdersResponse.data]);

  const { sorting, onSortingChange } = useTanstackTableSorting<OrderDto>('', 'desc', columns);

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
    setFilterParams((prev) => ({
      ...prev,
      page: pagination.pageIndex + 1,
      recordPerPage: pagination.pageSize,
    }));
  }, [pagination]);

  const resetForm = () => {
    setFilterParams({
      search: undefined,
      page: 1,
      recordPerPage: config.recordPerPage,
    });
  };

  const handleDelete = async (id: number) => {
    const response = await deleteOrderMutation.mutateAsync(id);
    if (response && response.status === 204) {
      toast({ variant: 'success', title: 'Order deleted successfully' });
    } else {
      const error = unitOfService.ErrorHandlerService.getErrorMessage(response);
      toast({ variant: 'destructive', title: 'Error', description: <span>{error}</span> });
    }
    closeDeleteModal(true);
  };

  if (getAllOrdersResponse.isError) {
    return <div className="text-center py-10 text-destructive">Error loading orders</div>;
  }

  return (
    <>
      <div className="space-y-4">
        <OrderListFilter
          table={table}
          resetForm={resetForm}
          onTextChange={(value) => setFilterParams((prev) => ({ ...prev, search: value || undefined, page: 1 }))}
        />

        <div className="rounded-md border">
          <CustomDataTable columns={columns} table={table} isLoading={getAllOrdersResponse.isLoading} />
        </div>

        <DataTablePagination table={table} totalRecord={recordCount} loading={getAllOrdersResponse.isLoading} />
      </div>

      {showEditModal && (
        <ManageOrder
          id={+(editId ?? 0)}
          isOpen={showEditModal}
          onClose={(refresh) => {
            closeEditModal(refresh);
            if (refresh) getAllOrdersResponse.refetch();
          }}
        />
      )}

      {showDeleteModal && (
        <ConfirmBox
          isOpen={showDeleteModal}
          onClose={() => closeDeleteModal(false)}
          onSubmit={() => handleDelete(+(deleteId ?? 0))}
          bodyText="Are you sure you want to delete this order?"
          noButtonText="Cancel"
          yesButtonText="Delete"
          loading={deleteOrderMutation.isPending}
        />
      )}
    </>
  );
}
