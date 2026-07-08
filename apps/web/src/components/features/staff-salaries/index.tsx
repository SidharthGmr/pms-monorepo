'use client';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { StaffSalaryDto } from '@/dtos/staff-salary.dto';
import { StaffSalaryFilterParams } from '@/params/staff-salary.params';
import { useGetAllStaffSalaries, useDeleteStaffSalary } from '@/hooks/service-hooks/useStaffSalaryService';
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
import { useStaffSalaryColumns } from './columns';
import StaffSalaryListFilter from './filter';
import ManageStaffSalary from './add-edit';
import config from '@/config';

export default function StaffSalaryList() {
  const unitOfService = container.get<IUnitOfService>(TYPES.IUnitOfService);

  const [data, setData] = useState<StaffSalaryDto[]>([]);
  const [recordCount, setRecordCount] = useState<number>(0);
  const searchParams = useSearchParams();

  const { showModal: showEditModal, openModal: openEditModal, closeModal: closeEditModal, uniqueId: editId } = useModalShowHide();
  const { showModal: showDeleteModal, openModal: openDeleteModal, closeModal: closeDeleteModal, uniqueId: deleteId } = useModalShowHide();

  const [filterParams, setFilterParams] = useState<StaffSalaryFilterParams>({
    search: searchParams.get('search') || '',
    status: searchParams.get('status') || null,
    month: searchParams.get('month') ? +searchParams.get('month')! : null,
    year: searchParams.get('year') ? +searchParams.get('year')! : null,
    startDate: searchParams.get('startDate') ? new Date(searchParams.get('startDate')!).toISOString() : undefined,
    endDate: searchParams.get('endDate') ? new Date(searchParams.get('endDate')!).toISOString() : undefined,
    page: +(searchParams.get('page') || 1),
    recordPerPage: +(searchParams.get('recordPerPage') || config.recordPerPage),
  });

  const columns = useStaffSalaryColumns(
    (id) => openEditModal(id),
    (id) => openDeleteModal(id)
  );

  const getAllStaffSalariesResponse = useGetAllStaffSalaries(filterParams);
  const deleteStaffSalaryMutation = useDeleteStaffSalary();

  useEffect(() => {
    if (getAllStaffSalariesResponse.isSuccess && getAllStaffSalariesResponse.data?.data?.data) {
      setData(getAllStaffSalariesResponse.data.data.data.data ?? []);
      setRecordCount(getAllStaffSalariesResponse.data.data.data.totalRecord);
    }
  }, [getAllStaffSalariesResponse.isSuccess, getAllStaffSalariesResponse.data]);

  const { sorting, onSortingChange } = useTanstackTableSorting<StaffSalaryDto>('', 'desc', columns);

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
      status: null,
      month: null,
      year: null,
      page: 1,
      recordPerPage: config.recordPerPage,
    });
  };

  const handleDelete = async (id: number) => {
    const response = await deleteStaffSalaryMutation.mutateAsync(id);
    if (response && response.status === 204) {
      toast({ variant: 'success', title: 'Staff salary record deleted successfully' });
    } else {
      const error = unitOfService.ErrorHandlerService.getErrorMessage(response);
      toast({ variant: 'destructive', title: 'Error', description: <span>{error}</span> });
    }
    closeDeleteModal(true);
  };

  if (getAllStaffSalariesResponse.isError) {
    return <div className="text-center py-10 text-destructive">Error loading staff salary records</div>;
  }

  return (
    <>
      <div className="space-y-4">
        <StaffSalaryListFilter
          table={table}
          resetForm={resetForm}
          onTextChange={(value) => setFilterParams((prev) => ({ ...prev, search: value || undefined, page: 1 }))}
          onStatusChange={(value) => {
            setFilterParams((oldValue) => {
              return {
                ...oldValue,
                status: value,
              };
            });
          }}
          onMonthChange={(value) => {
            setFilterParams((oldValue) => {
              return { ...oldValue, month: value ? +value : null };
            });
          }}
          onYearChange={(value) => {
            setFilterParams((oldValue) => {
              return { ...oldValue, year: value ? +value : null };
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

        {getAllStaffSalariesResponse.isLoading ? (
          <RecentPostSkeleton />
        ) : (
          <>
            <CustomDataTable table={table} columns={columns} />
            <DataTablePagination table={table} totalRecord={recordCount} />
          </>
        )}
      </div>

      {showEditModal && (
        <ManageStaffSalary
          id={editId ? (typeof editId === 'string' ? +editId : editId) : undefined}
          isOpen={showEditModal}
          onClose={closeEditModal}
        />
      )}
     
     
        {showDeleteModal && (
             <ConfirmBox
               isOpen={showDeleteModal}
               onClose={() => closeDeleteModal(false)}
               onSubmit={() => handleDelete(+(deleteId ?? 0))}
               bodyText="Are you sure you want to delete this product?"
               noButtonText="Cancel"
               yesButtonText="Delete"
               loading={deleteStaffSalaryMutation.isPending}
             />
           )}
           
          
    </>
  );
}
