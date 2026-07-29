'use client';
import { CustomDataTable } from '@/components/Table/data-table';
import { DataTablePagination } from '@/components/Table/data-table-pagination';
import ConfirmBox from '@/components/common/confirm-box';
import { toast } from '@/components/ui/use-toast';
import config from '@/config';
import { container } from '@/config/ioc';
import { TYPES } from '@/config/types';
import { WishlistDto } from '@/dtos/wishlist.dto';
import { useCustomDataTable } from '@/hooks/use-custom-table';
import useModalShowHide from '@/hooks/use-modal-show-hide';
import { useTanstackTablePagination } from '@/hooks/use-tanstack-table-pagination';
import { useTanstackTableSorting } from '@/hooks/use-tanstack-table-sorting';
import { useGetAllWishlists, useRemoveFromWishlist } from '@/hooks/service-hooks/useWishlistService';
import { WishlistFilterParams } from '@/params/wishlist.params';
import IUnitOfService from '@/services/interfaces/IUnitOfService';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useWishlistColumns } from './columns';
import WishlistFilter from './filter';

/**
 * Staff view of every customer's saved products - a demand signal for what people want
 * but have not bought. No `userId` filter is sent by default: the API treats staff as
 * staff, so an unset userId is what returns the whole store's wishlists here.
 */
export default function WishlistList() {
  const unitOfService = container.get<IUnitOfService>(TYPES.IUnitOfService);
  const searchParams = useSearchParams();

  // The products screen can deep-link here with ?productId=...
  const initialProductId = searchParams.get('productId') ? +searchParams.get('productId')! : undefined;

  const [data, setData] = useState<WishlistDto[]>([]);
  const [recordCount, setRecordCount] = useState<number>(0);

  const { showModal: showRemoveModal, openModal: openRemoveModal, closeModal: closeRemoveModal, uniqueId: removeId } = useModalShowHide();

  const columns = useWishlistColumns({ removeRecord: (id) => openRemoveModal(id) });

  const [filterParams, setFilterParams] = useState<WishlistFilterParams>({
    search: searchParams.get('search') || '',
    userId: searchParams.get('userId') || undefined,
    productId: initialProductId,
    page: +(searchParams.get('page') || 1),
    recordPerPage: +(searchParams.get('recordPerPage') || config.recordPerPage),
    sortBy: searchParams.get('sortBy') || 'addedAt',
    sortDirection: searchParams.get('sortDirection') || 'DESC',
  });

  const listResponse = useGetAllWishlists(filterParams);
  const removeMutation = useRemoveFromWishlist();

  useEffect(() => {
    if (listResponse.status === 'success' && listResponse.data?.data?.data) {
      const result = listResponse.data.data.data;
      setData(result.data ?? []);
      setRecordCount(result.totalRecord ?? 0);
    }
  }, [listResponse.status, listResponse.data]);

  const { sorting, onSortingChange } = useTanstackTableSorting<WishlistDto>(
    filterParams.sortBy ?? 'addedAt',
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
      userId: undefined,
      productId: undefined,
      page: 1,
      recordPerPage: config.recordPerPage,
      sortBy: 'addedAt',
      sortDirection: 'DESC',
    });
  };

  const handleRemove = async (id: number) => {
    const result = await removeMutation.mutateAsync(id);
    if (result && (result.status === 200 || result.status === 204)) {
      toast({ variant: 'success', title: 'Removed from the customer wishlist' });
    } else {
      const error = unitOfService.ErrorHandlerService.getErrorMessage(result);
      toast({ variant: 'destructive', title: 'Error', description: <span>{error}</span> });
    }
    closeRemoveModal(true);
  };

  if (listResponse.isError) {
    return <div className="py-10 text-center text-destructive">Error loading wishlists</div>;
  }

  return (
    <>
      <div className="space-y-4">
        <WishlistFilter
          table={table}
          resetForm={resetForm}
          onTextChange={(value) => setFilterParams((prev) => ({ ...prev, search: value || '', page: 1 }))}
          onCustomerChange={(userId) => setFilterParams((prev) => ({ ...prev, userId, page: 1 }))}
          onProductChange={(productId) => setFilterParams((prev) => ({ ...prev, productId, page: 1 }))}
        />
        <CustomDataTable columns={columns} table={table} isLoading={listResponse.isLoading} />
        <DataTablePagination table={table} totalRecord={recordCount} loading={listResponse.isLoading} />
      </div>

      {showRemoveModal && removeId && (
        <ConfirmBox
          isOpen={showRemoveModal}
          onClose={() => closeRemoveModal(false)}
          onSubmit={() => handleRemove(+removeId)}
          heading="Remove Wishlist Item"
          loading={removeMutation.isPending}
          bodyText="This deletes the entry from the customer's own wishlist. They are not notified."
        />
      )}
    </>
  );
}
