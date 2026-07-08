'use client';
import config from '@/config';
import { container } from '@/config/ioc';
import { TYPES } from '@/config/types';
import { AttributeDto } from '@/dtos/attribute.dto';
import { useDeleteAttribute, useGetAllAttributes } from '@/hooks/service-hooks/useAttributeService';
import { useCustomDataTable } from '@/hooks/use-custom-table';
import useModalShowHide from '@/hooks/use-modal-show-hide';
import { useTanstackTablePagination } from '@/hooks/use-tanstack-table-pagination';
import { useTanstackTableSorting } from '@/hooks/use-tanstack-table-sorting';
import { AttributeFilterParams } from '@/params/attribute.params';
import IUnitOfService from '@/services/interfaces/IUnitOfService';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { CustomDataTable } from '../../Table/data-table';
import { DataTablePagination } from '../../Table/data-table-pagination';
import ConfirmBox from '../../common/confirm-box';
import RecentPostSkeleton from '../../skelton/recent-post';
import { toast } from '../../ui/use-toast';
import ManageAttribute from './add-edit';
import { useAttributeColumns } from './columns';
import AttributeListFilter from './filter';

export default function AttributeList() {
  const unitOfService = container.get<IUnitOfService>(TYPES.IUnitOfService);
  const searchParams = useSearchParams();

  const [data, setData] = useState<AttributeDto[]>([]);
  const [recordCount, setRecordCount] = useState<number>(0);

  const { showModal: showEditModal, openModal: openEditModal, closeModal: closeEditModal, uniqueId: editId } = useModalShowHide();
  const { showModal: showDeleteModal, openModal: openDeleteModal, closeModal: closeDeleteModal, uniqueId: deleteId } = useModalShowHide();

  const [filterParams, setFilterParams] = useState<AttributeFilterParams>({
    search: searchParams.get('search') || '',
    status: searchParams.get('status') || null,
    startDate: searchParams.get('startDate') ? new Date(searchParams.get('startDate')!).toISOString() : undefined,
    endDate: searchParams.get('endDate') ? new Date(searchParams.get('endDate')!).toISOString() : undefined,
    page: +(searchParams.get('page') || 1),
    recordPerPage: +(searchParams.get('recordPerPage') || config.recordPerPage),
  });

  const columns = useAttributeColumns(
    (id) => openEditModal(id),
    (id) => openDeleteModal(id)
  );

  const attributesResponse = useGetAllAttributes(filterParams);
  const deleteMutation = useDeleteAttribute();

  useEffect(() => {
    if (attributesResponse.status === 'success' && attributesResponse.data?.data?.data) {
      const result = attributesResponse.data.data.data;
      const list = Array.isArray(result) ? result : (result as any).data ?? [];
      setData(list);
      setRecordCount(Array.isArray(result) ? list.length : (result as any).totalRecord ?? list.length);
    }
  }, [attributesResponse.status, attributesResponse.data?.data?.data]);

  const { sorting, onSortingChange } = useTanstackTableSorting<AttributeDto>('name', 'asc', columns);
  const { onPaginationChange, pagination } = useTanstackTablePagination(filterParams.recordPerPage ?? config.recordPerPage);

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
      status: null,
      startDate: undefined,
      endDate: undefined,
      page: 1,
      recordPerPage: config.recordPerPage,
    });
  };

  const handleDelete = async (id: number) => {
    const response = await deleteMutation.mutateAsync(id);
    if (response && response.status === 204) {
      toast({ variant: 'success', title: 'Attribute deleted successfully' });
    } else {
      const error = unitOfService.ErrorHandlerService.getErrorMessage(response);
      toast({ variant: 'destructive', title: 'Error', description: <span>{error}</span> });
    }
    closeDeleteModal(true);
  };

  if (attributesResponse.isError) {
    return <div className="text-center py-10 text-destructive">Error loading attributes</div>;
  }

  if (attributesResponse.isLoading && !data.length) {
    return (
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <RecentPostSkeleton key={i} />
        ))}
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        <AttributeListFilter
          table={table}
          resetForm={resetForm}
          onTextChange={(value) => setFilterParams((prev) => ({ ...prev, search: value || undefined, page: 1 }))}
          onStatusChange={(value) => setFilterParams((prev) => ({ ...prev, status: value || null }))}
          onStartDateChanged={(value) => {
            const selectedDate = value;
            if (selectedDate) selectedDate.setHours(0, 0, 0, 0);
            setFilterParams((prev) => ({ ...prev, startDate: selectedDate?.toISOString() }));
          }}
          onEndDateChanged={(value) => {
            const selectedDate = value;
            if (selectedDate) selectedDate.setHours(23, 59, 59, 999);
            setFilterParams((prev) => ({ ...prev, endDate: selectedDate?.toISOString() }));
          }}
        />

        <div className="rounded-md border">
          <CustomDataTable columns={columns} table={table} isLoading={attributesResponse.isLoading} />
        </div>
        <DataTablePagination table={table} totalRecord={recordCount} loading={attributesResponse.isLoading} />
      </div>

      {showEditModal && (
        <ManageAttribute
          id={+(editId ?? 0)}
          isOpen={showEditModal}
          onClose={(refresh) => {
            closeEditModal(refresh);
            if (refresh) attributesResponse.refetch();
          }}
        />
      )}

      {showDeleteModal && (
        <ConfirmBox
          isOpen={showDeleteModal}
          onClose={() => closeDeleteModal(false)}
          onSubmit={() => handleDelete(+(deleteId ?? 0))}
          bodyText="Are you sure you want to delete this attribute?"
          noButtonText="Cancel"
          yesButtonText="Delete"
          loading={deleteMutation.isPending}
        />
      )}
    </>
  );
}
