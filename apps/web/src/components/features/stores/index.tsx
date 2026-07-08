'use client';
import { useEffect, useState } from 'react';
import { StoreDto } from '@/dtos/store.dto';
import { useGetAllStores, useDeleteStore } from '@/hooks/service-hooks/useStoreService';
import { useCustomDataTable } from '@/hooks/use-custom-table';
import { useTanstackTablePagination } from '@/hooks/use-tanstack-table-pagination';
import { useTanstackTableSorting } from '@/hooks/use-tanstack-table-sorting';
import { CustomDataTable } from '../../Table/data-table';
import { DataTablePagination } from '../../Table/data-table-pagination';
import Loader from '../../loader';
import ConfirmBox from '../../common/confirm-box';
import { toast } from '../../ui/use-toast';
import { container } from '@/config/ioc';
import { TYPES } from '@/config/types';
import IUnitOfService from '@/services/interfaces/IUnitOfService';
import useModalShowHide from '@/hooks/use-modal-show-hide';
import { useStoreColumns } from './columns';
import StoreListFilter from './filter';
import ManageStore from './add-edit';
import config from '@/config';

export default function StoreList() {
  const unitOfService = container.get<IUnitOfService>(TYPES.IUnitOfService);

  const [data, setData] = useState<StoreDto[]>([]);
  const [recordCount, setRecordCount] = useState<number>(0);

  const { showModal: showEditModal, openModal: openEditModal, closeModal: closeEditModal, uniqueId: editId } = useModalShowHide();
  const { showModal: showDeleteModal, openModal: openDeleteModal, closeModal: closeDeleteModal, uniqueId: deleteId } = useModalShowHide();

  const columns = useStoreColumns(
    (id) => openEditModal(id),
    (id) => openDeleteModal(id)
  );

  const getAllStoresResponse = useGetAllStores();
  const deleteStoreMutation = useDeleteStore();

  useEffect(() => {
    if (getAllStoresResponse.status === 'success' && getAllStoresResponse.data?.data?.data) {
      const result = getAllStoresResponse.data.data.data;
      setData(result.data ?? []);
      setRecordCount(result.totalRecord ?? 0);
    }
  }, [getAllStoresResponse.status, getAllStoresResponse.data]);

  const { sorting, onSortingChange } = useTanstackTableSorting<StoreDto>('', 'desc', columns);
  const { onPaginationChange, pagination } = useTanstackTablePagination(config.recordPerPage);

  const table = useCustomDataTable({
    columns,
    data,
    manualFiltering: true,
    manualPagination: true,
    manualSorting: true,
    pageCount: Math.ceil((recordCount || 0) / config.recordPerPage),
    pagination,
    sorting,
    onPaginationChange,
    onSortingChange,
  });

  const handleDelete = async (id: number) => {
    const response = await deleteStoreMutation.mutateAsync(id);
    if (response && response.status === 204) {
      toast({ variant: 'success', title: 'Store deleted successfully' });
    } else {
      const error = unitOfService.ErrorHandlerService.getErrorMessage(response);
      toast({ variant: 'destructive', title: 'Error', description: <span>{error}</span> });
    }
    closeDeleteModal(true);
  };

  if (getAllStoresResponse.isError) {
    return <div className="text-center py-10 text-destructive">Error loading stores</div>;
  }

  return (
    <>
      <div className="p-4">
        <StoreListFilter table={table} />
      </div>
      {deleteStoreMutation.isPending && <Loader />}
      <CustomDataTable table={table} columns={columns} isLoading={getAllStoresResponse.isLoading} />
      <DataTablePagination table={table} />
      {showEditModal && editId && (
        <ManageStore
          id={+editId}
          isOpen={showEditModal}
          onClose={(refresh) => {
            closeEditModal(refresh);
          }}
        />
      )}
      {showDeleteModal && deleteId && (
        <ConfirmBox
          isOpen={showDeleteModal}
          onClose={() => closeDeleteModal(false)}
          onSubmit={() => handleDelete(+deleteId)}
          heading="Delete Store"
          bodyText="Are you sure you want to delete this store? This action cannot be undone."
        />
      )}
    </>
  );
}
