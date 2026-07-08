'use client';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { StaffDto } from '@/dtos/staff.dto';
import { StaffFilterParams } from '@/params/staff.params';
import { useGetAllStaff, useDeleteStaff } from '@/hooks/service-hooks/useStaffService';
import { useCustomDataTable } from '@/hooks/use-custom-table';
import { useTanstackTablePagination } from '@/hooks/use-tanstack-table-pagination';
import { useTanstackTableSorting } from '@/hooks/use-tanstack-table-sorting';
import { CustomDataTable } from '../../Table/data-table';
import { DataTablePagination } from '../../Table/data-table-pagination';
import RecentPostSkeleton from '../../skelton/recent-post';
import ConfirmBox from '../../common/confirm-box';
import { toast } from '../../ui/use-toast';
import { container } from '@/config/ioc';
import { TYPES } from '@/config/types';
import IUnitOfService from '@/services/interfaces/IUnitOfService';
import useModalShowHide from '@/hooks/use-modal-show-hide';
import { useStaffColumns } from './columns';
import StaffListFilter from './filter';
import ManageStaff from './add-edit';
import config from '@/config';

export default function StaffList() {
  const unitOfService = container.get<IUnitOfService>(TYPES.IUnitOfService);

  const [data, setData] = useState<StaffDto[]>([]);
  const [recordCount, setRecordCount] = useState<number>(0);
  const searchParams = useSearchParams();

  const { showModal: showEditModal, openModal: openEditModal, closeModal: closeEditModal, uniqueId: editId } = useModalShowHide();
  const { showModal: showDeleteModal, openModal: openDeleteModal, closeModal: closeDeleteModal, uniqueId: deleteId } = useModalShowHide();

  const [filterParams, setFilterParams] = useState<StaffFilterParams>({
    search: searchParams.get('search') || '',
    isActive: searchParams.get('isActive') ? searchParams.get('isActive') === 'true' : undefined,
    department: searchParams.get('department') || undefined,
    position: searchParams.get('position') || undefined,
    startDate: searchParams.get('startDate') ? new Date(searchParams.get('startDate')!).toISOString() : undefined,
    endDate: searchParams.get('endDate') ? new Date(searchParams.get('endDate')!).toISOString() : undefined,
    page: +(searchParams.get('page') || 1),
    recordPerPage: +(searchParams.get('recordPerPage') || config.recordPerPage),
  });

  const columns = useStaffColumns(
    (id) => openEditModal(id),
    (id) => openDeleteModal(id)
  );

  const getAllStaffResponse = useGetAllStaff(filterParams);
  const deleteStaffMutation = useDeleteStaff();

  useEffect(() => {
    if (getAllStaffResponse.isSuccess && getAllStaffResponse.data?.data?.data) {
      setData(getAllStaffResponse.data.data.data.data ?? []);
      setRecordCount(getAllStaffResponse.data.data.data.totalRecord);
    }
  }, [getAllStaffResponse.isSuccess, getAllStaffResponse.data]);

  const { sorting, onSortingChange } = useTanstackTableSorting<StaffDto>('', 'desc', columns);

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
      isActive: undefined,
      department: undefined,
      position: undefined,
      page: 1,
      recordPerPage: config.recordPerPage,
    });
  };

  const handleDelete = async (id: number) => {
    const response = await deleteStaffMutation.mutateAsync(id);
    if (response && response.status === 204) {
      toast({ variant: 'success', title: 'Staff member deleted successfully' });
    } else {
      const error = unitOfService.ErrorHandlerService.getErrorMessage(response);
      toast({ variant: 'destructive', title: 'Error', description: <span>{error}</span> });
    }
    closeDeleteModal(true);
  };

  if (getAllStaffResponse.isError) {
    return <div className="text-center py-10 text-destructive">Error loading staff members</div>;
  }

  return (
    <>
      <div className="space-y-4">
        <StaffListFilter
          table={table}
          resetForm={resetForm}
          onTextChange={(value) => setFilterParams((prev) => ({ ...prev, search: value || undefined, page: 1 }))}
          onIsActiveChange={(value) => {
            setFilterParams((oldValue) => {
              return {
                ...oldValue,
                isActive: value ? value === 'true' : undefined,
              };
            });
          }}
          onDepartmentChange={(value) => {
            setFilterParams((oldValue) => {
              return { ...oldValue, department: value || undefined };
            });
          }}
          onPositionChange={(value) => {
            setFilterParams((oldValue) => {
              return { ...oldValue, position: value || undefined };
            });
          }}
          onStartDateChanged={(value) => {
            const selectedDate = value;
            if (selectedDate) {
              selectedDate.setHours(0, 0, 0, 0);
            }

            setFilterParams((oldValue) => {
              return {
                ...oldValue,
                startDate: selectedDate?.toISOString(),
              };
            });
          }}
          onEndDateChanged={(value) => {
            const selectedDate = value;
            if (selectedDate) {
              selectedDate.setHours(23, 59, 59, 999);
            }

            setFilterParams((oldValue) => {
              return {
                ...oldValue,
                endDate: selectedDate?.toISOString(),
              };
            });
          }}
        />

        {getAllStaffResponse.isLoading ? (
          <RecentPostSkeleton />
        ) : (
          <>
            <CustomDataTable table={table} columns={columns} />
            <DataTablePagination table={table} totalRecord={recordCount} />
          </>
        )}
      </div>

      {showEditModal && <ManageStaff id={+(editId ?? 0)} isOpen={showEditModal} onClose={closeEditModal} />}
   
   
   
      {showDeleteModal && (
           <ConfirmBox
             isOpen={showDeleteModal}
             onClose={() => closeDeleteModal(false)}
             onSubmit={() => handleDelete(+(deleteId ?? 0))}
             bodyText="Are you sure you want to delete this staff member? This action cannot be undone."
             noButtonText="Cancel"
             yesButtonText="Delete"
             loading={deleteStaffMutation.isPending}
           />
         )}
             
   
    </>
  );
}
