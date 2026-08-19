'use client';
import { useEffect, useState } from 'react';
import { CategoryDto } from '@/dtos/category.dto';
import { useGetAllCategories, useDeleteCategory } from '@/hooks/service-hooks/useCategoryService';
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
import { useCategoryColumns } from './columns';
import CategoryListFilter from './filter';
import ManageCategory from './add-edit';
import config from '@/config';
import { useSearchParams } from 'next/navigation';
import { CategoryFilterParams } from '@pms/types';

export default function CategoryList() {
  const unitOfService = container.get<IUnitOfService>(TYPES.IUnitOfService);
  const searchParams = useSearchParams();

  const [data, setData] = useState<CategoryDto[]>([]);
  const [recordCount, setRecordCount] = useState<number>(0);

  const { showModal: showEditModal, openModal: openEditModal, closeModal: closeEditModal, uniqueId: editId } = useModalShowHide();
  const { showModal: showDeleteModal, openModal: openDeleteModal, closeModal: closeDeleteModal, uniqueId: deleteId } = useModalShowHide();

  const columns = useCategoryColumns(
    (id) => openEditModal(id),
    (id) => openDeleteModal(id)
  );

  const [filterParams, setFilterParams] = useState<CategoryFilterParams>({
    status: searchParams.get('status') || 'Published',
    page: +(searchParams.get('page') || 1),
    search: searchParams.get('search') || '',
    recordPerPage: +(searchParams.get('recordPerPage') || config.recordPerPage),
    startDate: searchParams.get('startDate') ? new Date(searchParams.get('startDate')!).toISOString() : undefined,
    endDate: searchParams.get('endDate') ? new Date(searchParams.get('endDate')!).toISOString() : undefined,
    sortBy: searchParams.get('sortBy') || 'createdAt',
    sortDirection: searchParams.get('sortDirection') || 'DESC',
  });

  const getAllCategoriesResponse = useGetAllCategories(filterParams);
  const deleteCategoryMutation = useDeleteCategory();

  useEffect(() => {
    if (getAllCategoriesResponse.status === 'success' && getAllCategoriesResponse.data?.data?.data) {
      const result = getAllCategoriesResponse.data.data.data;
      setData(result.data ?? []);
      setRecordCount(result.totalRecord ?? 0);
    }
  }, [getAllCategoriesResponse.status, getAllCategoriesResponse.data]);

  const { sorting, onSortingChange } = useTanstackTableSorting<CategoryDto>('name', 'asc', columns);
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
      status: undefined,
      startDate: undefined,
      endDate: undefined,
      includeDeleted: undefined,
      page: 1,
      recordPerPage: config.recordPerPage,
      sortBy: 'createdAt',
      sortDirection: 'DESC',
    });
  };
  const handleDelete = async (id: number) => {
    // HttpService rejects on a non-2xx, so the 409 the API returns while sub-categories or
    // products still reference the category arrives as a throw, not as a response.
    try {
      const response = await deleteCategoryMutation.mutateAsync(id);
      if (response && response.status === 200) {
        toast({ variant: 'success', title: 'Category deleted successfully' });
        getAllCategoriesResponse.refetch();
      } else {
        const error = unitOfService.ErrorHandlerService.getErrorMessage(response);
        toast({ variant: 'destructive', title: 'Error', description: <span>{error}</span> });
      }
    } catch (error) {
      const message = unitOfService.ErrorHandlerService.getErrorMessage(error as never);
      toast({ variant: 'destructive', title: 'Error', description: <span>{message}</span> });
    }
    closeDeleteModal(true);
  };

  if (getAllCategoriesResponse.isError) {
    return <div className="text-center py-10 text-destructive">Error loading categories</div>;
  }

  return (
    <>
      <div className="space-y-4">
        <CategoryListFilter
          table={table}
          resetForm={resetForm}
          onTextChange={(value) => setFilterParams((prev) => ({ ...prev, search: value || undefined, page: 1 }))}
          onStatusChange={(value) => setFilterParams((prev) => ({ ...prev, status: value || '' }))}
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
          onIncludeDeletedChange={(value) => setFilterParams((prev) => ({ ...prev, includeDeleted: value || undefined, page: 1 }))}
        />

        <div className="overflow-hidden rounded-xl border border-border/60">
          <CustomDataTable columns={columns} table={table} isLoading={getAllCategoriesResponse.isLoading} />
        </div>
        <DataTablePagination table={table} totalRecord={recordCount} loading={getAllCategoriesResponse.isLoading} />
      </div>

      {showEditModal && (
        <ManageCategory
          id={+(editId ?? 0)}
          isOpen={showEditModal}
          onClose={(refresh) => {
            closeEditModal(refresh);
            if (refresh) getAllCategoriesResponse.refetch();
          }}
        />
      )}

      {showDeleteModal && (
        <ConfirmBox
          isOpen={showDeleteModal}
          onClose={() => closeDeleteModal(false)}
          onSubmit={() => handleDelete(+(deleteId ?? 0))}
          bodyText="Are you sure you want to delete this category?"
          noButtonText="Cancel"
          yesButtonText="Delete"
          loading={deleteCategoryMutation.isPending}
        />
      )}
    </>
  );
}
