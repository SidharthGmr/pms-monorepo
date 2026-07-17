'use client';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { SupplierDto } from '@/dtos/supplier.dto';
import { useGetAllSuppliers, useDeleteSupplier } from '@/hooks/service-hooks/useSupplierService';
import { SupplierFilterParams } from '@/params/supplier.params';
import { useCustomDataTable } from '@/hooks/use-custom-table';
import { useTanstackTablePagination } from '@/hooks/use-tanstack-table-pagination';
import { useTanstackTableSorting } from '@/hooks/use-tanstack-table-sorting';
import { CustomDataTable } from '../../Table/data-table';
import { DataTablePagination } from '../../Table/data-table-pagination';
import ConfirmBox from '../../common/confirm-box';
import { toast } from '../../ui/use-toast';
import { container } from '@/config/ioc';
import { TYPES } from '@/config/types';
import IUnitOfService from '@/services/interfaces/IUnitOfService';
import useModalShowHide from '@/hooks/use-modal-show-hide';
import { useSupplierColumns } from './columns';
import SupplierListFilter from './filter';
import ManageSupplier from './add-edit';
import config from '@/config';

export default function SupplierList() {
  const unitOfService = container.get<IUnitOfService>(TYPES.IUnitOfService);

  const [data, setData] = useState<SupplierDto[]>([]);
  const [recordCount, setRecordCount] = useState<number>(0);

  const { showModal: showEditModal, openModal: openEditModal, closeModal: closeEditModal, uniqueId: editId } = useModalShowHide();
  const { showModal: showDeleteModal, openModal: openDeleteModal, closeModal: closeDeleteModal, uniqueId: deleteId } = useModalShowHide();

  const columns = useSupplierColumns(
    (id) => openEditModal(id),
    (id) => openDeleteModal(id)
  );

  const searchParams = useSearchParams();

  const [filterParams, setFilterParams] = useState<SupplierFilterParams>({
    q: searchParams.get('q') || '',
    page: +(searchParams.get('page') || 1),
    recordPerPage: +(searchParams.get('recordPerPage') || config.recordPerPage),
    sortBy: searchParams.get('sortBy') || 'createdon',
    sortDirection: searchParams.get('sortDirection') || 'desc',
  });

  const getAllSuppliersResponse = useGetAllSuppliers(filterParams);
  const deleteSupplierMutation = useDeleteSupplier();

  useEffect(() => {
    if (getAllSuppliersResponse.status === 'success' && getAllSuppliersResponse.data?.data?.data) {
      const result = getAllSuppliersResponse.data.data.data;
      setData(result.data ?? []);
      setRecordCount(result.totalRecord ?? 0);
    }
  }, [getAllSuppliersResponse.status, getAllSuppliersResponse.data]);

  const { sorting, onSortingChange, field, order } = useTanstackTableSorting<SupplierDto>(
    filterParams.sortBy ?? '',
    filterParams.sortDirection ?? '',
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
    onPaginationChange: onPaginationChange,
    onSortingChange: onSortingChange,
  });

  useEffect(() => {
    setFilterParams((oldValue) => {
      return {
        ...oldValue,
        page: pagination.pageIndex + 1,
        recordPerPage: pagination.pageSize,
      };
    });
  }, [pagination]);

  useEffect(() => {
    setFilterParams((oldValue) => {
      return {
        ...oldValue,
        sortBy: field,
        sortDirection: order,
      };
    });
  }, [field, order]);

  const resetForm = () => {
    setFilterParams(() => {
      return {
        status: searchParams.get('status') || '',
        page: +(searchParams.get('page') || 1),
        q: searchParams.get('q') || '',
        recordPerPage: +(searchParams.get('recordPerPage') || config.recordPerPage),
        sortBy: searchParams.get('sortBy') || 'createdon',
        sortDirection: searchParams.get('sortDirection') || 'desc',
      };
    });
  };

  const handleDelete = async (id: number) => {
    const response = await deleteSupplierMutation.mutateAsync(id);
    if (response && response.status === 204) {
      toast({ variant: 'success', title: 'Supplier deleted successfully' });
    } else {
      const error = unitOfService.ErrorHandlerService.getErrorMessage(response);
      toast({ variant: 'destructive', title: 'Error', description: <span>{error}</span> });
    }
    closeDeleteModal(true);
  };

  if (getAllSuppliersResponse.isError) {
    return <div className="text-center py-10 text-destructive">Error loading suppliers</div>;
  }

  return (
    <>
      <div className="p-4">
        <SupplierListFilter
          table={table}
          resetForm={resetForm}
          onTextChange={(value) => {
            setFilterParams((oldValue) => {
              return {
                ...oldValue,
                q: value || '',
              };
            });
          }}
        />
      </div>

      <CustomDataTable table={table} columns={columns} isLoading={getAllSuppliersResponse.isLoading} />
      <DataTablePagination table={table} />
      {showEditModal && editId && (
        <ManageSupplier
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
          heading="Delete Supplier"
          loading={deleteSupplierMutation.isPending}
          bodyText="Are you sure you want to delete this supplier? This action cannot be undone."
        />
      )}
    </>
  );
}
