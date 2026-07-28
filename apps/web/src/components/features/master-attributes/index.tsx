'use client';
import { CustomDataTable } from '@/components/Table/data-table';
import { DataTablePagination } from '@/components/Table/data-table-pagination';
import ConfirmBox from '@/components/common/confirm-box';
import { toast } from '@/components/ui/use-toast';
import config from '@/config';
import { container } from '@/config/ioc';
import { TYPES } from '@/config/types';
import { MasterAttributeDto } from '@/dtos/master-entry.dto';
import { useDeleteMasterAttribute, useGetAllMasterAttributes } from '@/hooks/service-hooks/useMasterEntryService';
import { useCustomDataTable } from '@/hooks/use-custom-table';
import useModalShowHide from '@/hooks/use-modal-show-hide';
import { useTanstackTablePagination } from '@/hooks/use-tanstack-table-pagination';
import { useTanstackTableSorting } from '@/hooks/use-tanstack-table-sorting';
import { MasterAttributeFilterParams } from '@/params/master-entry.params';
import IUnitOfService from '@/services/interfaces/IUnitOfService';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import ManageMasterAttribute from './add-edit';
import { useMasterAttributeColumns } from './columns';
import MasterAttributeFilter from './filter';

export default function MasterAttributeList() {
  const unitOfService = container.get<IUnitOfService>(TYPES.IUnitOfService);
  const searchParams = useSearchParams();

  const [data, setData] = useState<MasterAttributeDto[]>([]);
  const [recordCount, setRecordCount] = useState<number>(0);

  const { showModal: showEditModal, openModal: openEditModal, closeModal: closeEditModal, uniqueId: editId } = useModalShowHide();
  const { showModal: showDeleteModal, openModal: openDeleteModal, closeModal: closeDeleteModal, uniqueId: deleteId } = useModalShowHide();

  const columns = useMasterAttributeColumns(
    (id) => openEditModal(id),
    (id) => openDeleteModal(id)
  );

  const [filterParams, setFilterParams] = useState<MasterAttributeFilterParams>({
    search: searchParams.get('search') || '',
    status: searchParams.get('status') || '',
    page: +(searchParams.get('page') || 1),
    recordPerPage: +(searchParams.get('recordPerPage') || config.recordPerPage),
    // Newest-first, matching the rest of the admin lists.
    sortBy: searchParams.get('sortBy') || 'createdAt',
    sortDirection: searchParams.get('sortDirection') || 'DESC',
  });

  const listResponse = useGetAllMasterAttributes(filterParams);
  const deleteMutation = useDeleteMasterAttribute();

  useEffect(() => {
    if (listResponse.status === 'success' && listResponse.data?.data?.data) {
      const result = listResponse.data.data.data;
      setData(result.data ?? []);
      setRecordCount(result.totalRecord ?? 0);
    }
  }, [listResponse.status, listResponse.data]);

  const { sorting, onSortingChange } = useTanstackTableSorting<MasterAttributeDto>(
    filterParams.sortBy ?? 'createdAt',
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
      status: '',
      page: 1,
      recordPerPage: config.recordPerPage,
      sortBy: 'createdAt',
      sortDirection: 'DESC',
    });
  };

  const handleDelete = async (id: number) => {
    const result = await deleteMutation.mutateAsync(id);
    if (result && (result.status === 204 || result.status === 200)) {
      toast({ variant: 'success', title: 'Attribute deleted successfully' });
    } else {
      const error = unitOfService.ErrorHandlerService.getErrorMessage(result);
      toast({ variant: 'destructive', title: 'Error', description: <span>{error}</span> });
    }
    closeDeleteModal(true);
  };

  if (listResponse.isError) {
    return <div className="py-10 text-center text-destructive">Error loading master attributes</div>;
  }

  return (
    <>
      <div className="space-y-4">
        <MasterAttributeFilter
          table={table}
          resetForm={resetForm}
          onTextChange={(value) => setFilterParams((prev) => ({ ...prev, search: value || '', page: 1 }))}
          onStatusChange={(value) => setFilterParams((prev) => ({ ...prev, status: value || '', page: 1 }))}
        />
        <CustomDataTable columns={columns} table={table} isLoading={listResponse.isLoading} />
        <DataTablePagination table={table} totalRecord={recordCount} loading={listResponse.isLoading} />
      </div>

      {showEditModal && editId && <ManageMasterAttribute id={+editId} isOpen={showEditModal} onClose={(refresh) => closeEditModal(refresh)} />}
      {showDeleteModal && deleteId && (
        <ConfirmBox
          isOpen={showDeleteModal}
          onClose={() => closeDeleteModal(false)}
          onSubmit={() => handleDelete(+deleteId)}
          heading="Delete Master Attribute"
          loading={deleteMutation.isPending}
          bodyText="This moves the attribute and all of its values to Trash. Anything selecting this attribute's code will stop finding values."
        />
      )}
    </>
  );
}
