'use client';
import config from '@/config';
import { UserDto } from '@/dtos/UserDto';
import { useGetAllUserList } from '@/hooks/service-hooks/useUserList.service.hook';
import { useCustomDataTable } from '@/hooks/use-custom-table';
import useModalShowHide from '@/hooks/use-modal-show-hide';
import { useTanstackTablePagination } from '@/hooks/use-tanstack-table-pagination';
import { useTanstackTableSorting } from '@/hooks/use-tanstack-table-sorting';

import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { CustomDataTable } from '../../Table/data-table';
import { DataTablePagination } from '../../Table/data-table-pagination';
import { useUserColumns } from './columns';
import EditUserProfile from './edit-profile';
import UserListListFilter from './filter';
import { UserListParams } from '@pms/types';

export default function GetAllUserss({ role }: { role?: string }) {
  const [data, setData] = useState<UserDto[]>([]);
  const [recordCount, setRecordCount] = useState<number>(0);
  const searchParams = useSearchParams();
  const { showModal: showEditModal, openModal: openEditModal, closeModal: closeEditModal, uniqueId: editId } = useModalShowHide();
  const columns = useUserColumns((id: string) => openEditModal(id));

  const [filterParams, setFilterParams] = useState<UserListParams>({
    status: searchParams.get('status') || '',
    role: searchParams.get('role') || role,
    page: +(searchParams.get('page') || 1),
    search: searchParams.get('search') || '',
    recordPerPage: +(searchParams.get('recordPerPage') || config.recordPerPage),
    sortBy: searchParams.get('sortBy') || 'createdon',
    sortDirection: searchParams.get('sortDirection') || 'desc',
  });

  const getAllUserResponse = useGetAllUserList(filterParams);
  useEffect(() => {
    if (getAllUserResponse.status === 'success' && getAllUserResponse.data?.data?.data?.data) {
      setData(getAllUserResponse?.data?.data?.data?.data);
      setRecordCount(getAllUserResponse.data?.data?.data?.totalRecord);
    }
  }, [getAllUserResponse.status, getAllUserResponse.data?.data?.data?.data]);

  const { sorting, onSortingChange, field, order } = useTanstackTableSorting<UserDto>(
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
        role: searchParams.get('role') || role,
        page: +(searchParams.get('page') || 1),
        search: searchParams.get('search') || '',
        recordPerPage: +(searchParams.get('recordPerPage') || config.recordPerPage),
        sortBy: searchParams.get('sortBy') || 'createdon',
        sortDirection: searchParams.get('sortDirection') || 'desc',
      };
    });
  };

  const error = getAllUserResponse.isError;
  const loading = getAllUserResponse.isLoading;

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
        <p className="text-sm font-semibold text-destructive">Error loading users</p>
        <p className="text-xs text-muted-foreground">Please refresh the page or try again later.</p>
      </div>
    );
  }
  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-16 w-full rounded-xl" />
        <div className="overflow-hidden rounded-xl border border-border/60">
          {[...Array(6)].map((_, index) => (
            <div key={index} className="flex items-center gap-4 border-b border-border/60 p-4 last:border-b-0">
              <Skeleton className="h-9 w-9 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-3 w-40" />
                <Skeleton className="h-3 w-24" />
              </div>
              <Skeleton className="h-6 w-16 rounded-full" />
              <Skeleton className="h-6 w-20 rounded-full" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        <UserListListFilter
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
          onStatusChange={(value) => {
            setFilterParams((oldValue) => {
              return {
                ...oldValue,
                status: value || '',
              };
            });
          }}
        />

        <div className="overflow-hidden rounded-xl border border-border/60">
          <CustomDataTable columns={columns} table={table} isLoading={getAllUserResponse.isLoading} />
        </div>
        <DataTablePagination table={table} totalRecord={recordCount} loading={getAllUserResponse.isLoading} />
      </div>

      {showEditModal && editId && (
        <EditUserProfile
          isOpen={showEditModal}
          onClose={(refresh) => {
            closeEditModal(refresh);
            if (refresh) getAllUserResponse.refetch();
          }}
          userId={editId.toString()}
        />
      )}
    </>
  );
}
