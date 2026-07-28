'use client';
import { CustomDataTable } from '@/components/Table/data-table';
import { DataTablePagination } from '@/components/Table/data-table-pagination';
import ConfirmBox from '@/components/common/confirm-box';
import { toast } from '@/components/ui/use-toast';
import config from '@/config';
import { container } from '@/config/ioc';
import { TYPES } from '@/config/types';
import { MasterEntryDto } from '@/dtos/master-entry.dto';
import { useDeleteMasterEntry, useGetAllMasterEntries } from '@/hooks/service-hooks/useMasterEntryService';
import { useCustomDataTable } from '@/hooks/use-custom-table';
import useModalShowHide from '@/hooks/use-modal-show-hide';
import { useTanstackTablePagination } from '@/hooks/use-tanstack-table-pagination';
import { useTanstackTableSorting } from '@/hooks/use-tanstack-table-sorting';
import { MasterEntryFilterParams } from '@/params/master-entry.params';
import IUnitOfService from '@/services/interfaces/IUnitOfService';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import ManageMasterEntry from './add-edit';
import { useMasterEntryColumns } from './columns';
import MasterEntryFilter from './filter';

export default function MasterEntryList() {
  const unitOfService = container.get<IUnitOfService>(TYPES.IUnitOfService);
  const searchParams = useSearchParams();

  // The attributes screen deep-links here with ?attributeId=...
  const initialAttributeId = searchParams.get('attributeId') ? +searchParams.get('attributeId')! : undefined;

  const [data, setData] = useState<MasterEntryDto[]>([]);
  const [recordCount, setRecordCount] = useState<number>(0);

  const { showModal: showEditModal, openModal: openEditModal, closeModal: closeEditModal, uniqueId: editId } = useModalShowHide();
  const { showModal: showDeleteModal, openModal: openDeleteModal, closeModal: closeDeleteModal, uniqueId: deleteId } = useModalShowHide();

  const columns = useMasterEntryColumns(
    (id) => openEditModal(id),
    (id) => openDeleteModal(id)
  );

  const [filterParams, setFilterParams] = useState<MasterEntryFilterParams>({
    search: searchParams.get('search') || '',
    status: searchParams.get('status') || '',
    attributeId: initialAttributeId,
    page: +(searchParams.get('page') || 1),
    recordPerPage: +(searchParams.get('recordPerPage') || config.recordPerPage),
    sortBy: searchParams.get('sortBy') || 'createdAt',
    sortDirection: searchParams.get('sortDirection') || 'DESC',
  });

  const listResponse = useGetAllMasterEntries(filterParams);
  const deleteMutation = useDeleteMasterEntry();

  useEffect(() => {
    if (listResponse.status === 'success' && listResponse.data?.data?.data) {
      const result = listResponse.data.data.data;
      setData(result.data ?? []);
      setRecordCount(result.totalRecord ?? 0);
    }
  }, [listResponse.status, listResponse.data]);

  const { sorting, onSortingChange } = useTanstackTableSorting<MasterEntryDto>(
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
      attributeId: undefined,
      page: 1,
      recordPerPage: config.recordPerPage,
      sortBy: 'createdAt',
      sortDirection: 'DESC',
    });
  };

  const handleDelete = async (id: number) => {
    const result = await deleteMutation.mutateAsync(id);
    if (result && (result.status === 204 || result.status === 200)) {
      toast({ variant: 'success', title: 'Value deleted successfully' });
    } else {
      const error = unitOfService.ErrorHandlerService.getErrorMessage(result);
      toast({ variant: 'destructive', title: 'Error', description: <span>{error}</span> });
    }
    closeDeleteModal(true);
  };

  if (listResponse.isError) {
    return <div className="py-10 text-center text-destructive">Error loading master entries</div>;
  }

  return (
    <>
      <div className="space-y-4">
        <MasterEntryFilter
          table={table}
          initialAttributeId={initialAttributeId}
          resetForm={resetForm}
          onTextChange={(value) => setFilterParams((prev) => ({ ...prev, search: value || '', page: 1 }))}
          onAttributeChange={(attributeId) => setFilterParams((prev) => ({ ...prev, attributeId, page: 1 }))}
          onStatusChange={(value) => setFilterParams((prev) => ({ ...prev, status: value || '', page: 1 }))}
        />
        <CustomDataTable columns={columns} table={table} isLoading={listResponse.isLoading} />
        <DataTablePagination table={table} totalRecord={recordCount} loading={listResponse.isLoading} />
      </div>

      {showEditModal && editId && <ManageMasterEntry id={+editId} isOpen={showEditModal} onClose={(refresh) => closeEditModal(refresh)} />}
      {showDeleteModal && deleteId && (
        <ConfirmBox
          isOpen={showDeleteModal}
          onClose={() => closeDeleteModal(false)}
          onSubmit={() => handleDelete(+deleteId)}
          heading="Delete Master Entry"
          loading={deleteMutation.isPending}
          bodyText="Are you sure you want to delete this value? Records already storing it keep their value, but it will no longer appear in dropdowns."
        />
      )}
    </>
  );
}
