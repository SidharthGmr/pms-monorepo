'use client';
import { CustomDataTable } from '@/components/Table/data-table';
import { DataTablePagination } from '@/components/Table/data-table-pagination';
import ConfirmBox from '@/components/common/confirm-box';
import { toast } from '@/components/ui/use-toast';
import config from '@/config';
import { container } from '@/config/ioc';
import { TYPES } from '@/config/types';
import { ReviewDto } from '@/dtos/review.dto';
import { StatusValues } from '@/enums/status-values.enum';
import { useDeleteReview, useGetAllReviews, useModerateReview } from '@/hooks/service-hooks/useReviewService';
import { useCustomDataTable } from '@/hooks/use-custom-table';
import useModalShowHide from '@/hooks/use-modal-show-hide';
import { useTanstackTablePagination } from '@/hooks/use-tanstack-table-pagination';
import { useTanstackTableSorting } from '@/hooks/use-tanstack-table-sorting';
import { ReviewFilterParams } from '@/params/review.params';
import IUnitOfService from '@/services/interfaces/IUnitOfService';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useReviewColumns } from './columns';
import ReviewFilter from './filter';
import ReviewReplyDialog from './reply-dialog';

export default function ReviewList() {
  const unitOfService = container.get<IUnitOfService>(TYPES.IUnitOfService);
  const searchParams = useSearchParams();

  // The products screen can deep-link here with ?productId=...
  const initialProductId = searchParams.get('productId') ? +searchParams.get('productId')! : undefined;

  const [data, setData] = useState<ReviewDto[]>([]);
  const [recordCount, setRecordCount] = useState<number>(0);

  const { showModal: showReplyModal, openModal: openReplyModal, closeModal: closeReplyModal, uniqueId: replyId } = useModalShowHide();
  const { showModal: showDeleteModal, openModal: openDeleteModal, closeModal: closeDeleteModal, uniqueId: deleteId } = useModalShowHide();

  const [filterParams, setFilterParams] = useState<ReviewFilterParams>({
    search: searchParams.get('search') || '',
    status: searchParams.get('status') || '',
    productId: initialProductId,
    page: +(searchParams.get('page') || 1),
    recordPerPage: +(searchParams.get('recordPerPage') || config.recordPerPage),
    sortBy: searchParams.get('sortBy') || 'createdAt',
    sortDirection: searchParams.get('sortDirection') || 'DESC',
  });

  const listResponse = useGetAllReviews(filterParams);
  const moderateMutation = useModerateReview();
  const deleteMutation = useDeleteReview();

  const handleModerate = async (id: number, status: StatusValues) => {
    const result = await moderateMutation.mutateAsync({ id, status });
    if (result && result.status === 200) {
      toast({ variant: 'success', title: `Review moved to ${status}` });
    } else {
      const error = unitOfService.ErrorHandlerService.getErrorMessage(result);
      toast({ variant: 'destructive', title: 'Error', description: <span>{error}</span> });
    }
  };

  const columns = useReviewColumns({
    replyRecord: (id) => openReplyModal(id),
    moderateRecord: (id, status) => handleModerate(id, status),
    deleteRecord: (id) => openDeleteModal(id),
  });

  useEffect(() => {
    if (listResponse.status === 'success' && listResponse.data?.data?.data) {
      const result = listResponse.data.data.data;
      setData(result.data ?? []);
      setRecordCount(result.totalRecord ?? 0);
    }
  }, [listResponse.status, listResponse.data]);

  const { sorting, onSortingChange } = useTanstackTableSorting<ReviewDto>(
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
      productId: undefined,
      rating: undefined,
      isVerified: undefined,
      page: 1,
      recordPerPage: config.recordPerPage,
      sortBy: 'createdAt',
      sortDirection: 'DESC',
    });
  };

  const handleDelete = async (id: number) => {
    const result = await deleteMutation.mutateAsync(id);
    if (result && (result.status === 200 || result.status === 204)) {
      toast({ variant: 'success', title: 'Review moved to Trash' });
    } else {
      const error = unitOfService.ErrorHandlerService.getErrorMessage(result);
      toast({ variant: 'destructive', title: 'Error', description: <span>{error}</span> });
    }
    closeDeleteModal(true);
  };

  const replying = data.find((review) => review.id === +(replyId ?? 0));

  if (listResponse.isError) {
    return <div className="py-10 text-center text-destructive">Error loading reviews</div>;
  }

  return (
    <>
      <div className="space-y-4">
        <ReviewFilter
          table={table}
          resetForm={resetForm}
          onTextChange={(value) => setFilterParams((prev) => ({ ...prev, search: value || '', page: 1 }))}
          onStatusChange={(value) => setFilterParams((prev) => ({ ...prev, status: value || '', page: 1 }))}
          onRatingChange={(rating) => setFilterParams((prev) => ({ ...prev, rating, page: 1 }))}
          onVerifiedChange={(isVerified) => setFilterParams((prev) => ({ ...prev, isVerified, page: 1 }))}
        />
        <CustomDataTable columns={columns} table={table} isLoading={listResponse.isLoading} />
        <DataTablePagination table={table} totalRecord={recordCount} loading={listResponse.isLoading} />
      </div>

      {showReplyModal && replying && (
        <ReviewReplyDialog review={replying} isOpen={showReplyModal} onClose={(refresh) => closeReplyModal(refresh)} />
      )}

      {showDeleteModal && deleteId && (
        <ConfirmBox
          isOpen={showDeleteModal}
          onClose={() => closeDeleteModal(false)}
          onSubmit={() => handleDelete(+deleteId)}
          heading="Trash Review"
          loading={deleteMutation.isPending}
          bodyText="The review is moved to Trash and hidden from the product page. It is kept for auditing rather than erased."
        />
      )}
    </>
  );
}
