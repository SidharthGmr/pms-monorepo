'use client';
import config from '@/config';
import { container } from '@/config/ioc';
import { TYPES } from '@/config/types';
import { UserDto } from '@/dtos/UserDto';
import { useDeleteUserById, useGetAllUserList } from '@/hooks/service-hooks/useUserList.service.hook';
import { useCustomDataTable } from '@/hooks/use-custom-table';
import useModalShowHide from '@/hooks/use-modal-show-hide';
import { useTanstackTablePagination } from '@/hooks/use-tanstack-table-pagination';
import { useTanstackTableSorting } from '@/hooks/use-tanstack-table-sorting';
import { UserListParams } from '@/params/user-list.params';
import IUnitOfService from '@/services/interfaces/IUnitOfService';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { CustomDataTable } from '../../Table/data-table';
import { DataTablePagination } from '../../Table/data-table-pagination';
import ConfirmBox from '../../common/confirm-box';
import { toast } from '../../ui/use-toast';
import { useUserColumns } from './columns';
import UserListFilter from './filter';

export default function UserList() {
  const unitOfService = container.get<IUnitOfService>(TYPES.IUnitOfService);

  const [data, setData] = useState<UserDto[]>([]);
  const [recordCount, setRecordCount] = useState<number>(0);
  const searchParams = useSearchParams();

  const { showModal: showDeleteModal, openModal: openDeleteModal, closeModal: closeDeleteModal, uniqueId: deleteId } = useModalShowHide();

  const [filterParams, setFilterParams] = useState<UserListParams>({
    search: searchParams.get('search') || '',
    page: +(searchParams.get('page') || 1),
    recordPerPage: +(searchParams.get('recordPerPage') || config.recordPerPage),
    role: 'USER',
  });

  const columns = useUserColumns(
    undefined, // We can implement edit later if needed
    (id) => openDeleteModal(id)
  );

  const getAllUsersResponse = useGetAllUserList(filterParams);
  const deleteUserMutation = useDeleteUserById();

  useEffect(() => {
    if (getAllUsersResponse.isSuccess && getAllUsersResponse.data?.data?.data) {
      setData(getAllUsersResponse.data.data.data.data ?? []);
      setRecordCount(getAllUsersResponse.data.data.data.totalRecord ?? 0);
    }
  }, [getAllUsersResponse.isSuccess, getAllUsersResponse.data]);

  const { sorting, onSortingChange } = useTanstackTableSorting<UserDto>('', 'desc', columns);

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
      role: 'USER',
    });
  };

  const handleDelete = async (id: string) => {
    const response = await deleteUserMutation.mutateAsync(id);
    if (response && response.status === 204) {
      toast({ variant: 'success', title: 'User deleted successfully' });
    } else {
      const error = unitOfService.ErrorHandlerService.getErrorMessage(response);
      toast({ variant: 'destructive', title: 'Error', description: <span>{error}</span> });
    }
    closeDeleteModal(true);
  };

  if (getAllUsersResponse.isError) {
    return <div className="text-center py-10 text-destructive">Error loading users</div>;
  }

  return (
    <>
      <div className="space-y-4">
        <UserListFilter
          table={table}
          resetForm={resetForm}
          onTextChange={(value) => setFilterParams((prev) => ({ ...prev, search: value || undefined, page: 1 }))}
        />

        <div className="rounded-md border">
          <CustomDataTable columns={columns} table={table} isLoading={getAllUsersResponse.isLoading} />
        </div>

        <DataTablePagination table={table} totalRecord={recordCount} loading={getAllUsersResponse.isLoading} />
      </div>

      {showDeleteModal && (
        <ConfirmBox
          isOpen={showDeleteModal}
          onClose={() => closeDeleteModal(false)}
          onSubmit={() => handleDelete(deleteId as string)}
          bodyText="Are you sure you want to delete this user?"
          noButtonText="Cancel"
          yesButtonText="Delete"
          loading={deleteUserMutation.isPending}
        />
      )}
    </>
  );
}
