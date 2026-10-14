'use client';
import ConfirmBox from '@/components/common/confirm-box';
import ListPageHeader from '@/components/common/list-page-header';
import ListPagination from '@/components/common/list-pagination';
import { CustomDataTable } from '@/components/Table/data-table';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { toast } from '@/components/ui/use-toast';
import config from '@/config';
import { container } from '@/config/ioc';
import { TYPES } from '@/config/types';
import { useDeleteCmsPage, useGetAllCmsPages } from '@/hooks/service-hooks/useCmsPageService';
import useModalShowHide from '@/hooks/use-modal-show-hide';
import { useCustomDataTable } from '@/hooks/use-custom-table';
import IUnitOfService from '@/services/interfaces/IUnitOfService';
import { cn } from '@/lib/utils';
import { CmsPageFilterParams, CmsPageListItemDto, PageStatus } from '@pms/types';
import { FileText, Plus } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useMemo, useState } from 'react';
import { useCmsPageColumns } from './columns';
import CmsPageFilter, { CmsPageFilterValue, DEFAULT_CMS_PAGE_FILTER, SortDirection } from './filter';

export default function CmsPages() {
  const unitOfService = container.get<IUnitOfService>(TYPES.IUnitOfService);
  const router = useRouter();
  const searchParams = useSearchParams();

  const [filter, setFilter] = useState<CmsPageFilterValue>(() => ({
    search: searchParams.get('search') ?? DEFAULT_CMS_PAGE_FILTER.search,
    status: (searchParams.get('status') as PageStatus | null) ?? DEFAULT_CMS_PAGE_FILTER.status,
    sortBy: searchParams.get('sortBy') ?? DEFAULT_CMS_PAGE_FILTER.sortBy,
    sortDirection: (searchParams.get('sortDirection')?.toUpperCase() as SortDirection) === 'ASC' ? 'ASC' : 'DESC',
  }));

  const [page, setPage] = useState(() => Math.max(1, Number(searchParams.get('page')) || 1));
  const [pageSize, setPageSize] = useState(() => Number(searchParams.get('recordPerPage')) || config.recordPerPage);

  const params = useMemo<CmsPageFilterParams>(
    () => ({
      search: filter.search,
      status: filter.status,
      sortBy: filter.sortBy,
      sortDirection: filter.sortDirection,
      page,
      recordPerPage: pageSize,
    }),
    [filter, page, pageSize]
  );

  const listQuery = useGetAllCmsPages(params);
  const deleteMutation = useDeleteCmsPage();

  const result = listQuery.data?.data?.data;
  const pages: CmsPageListItemDto[] = result?.data ?? [];
  const total = result?.totalRecord ?? 0;

  const { showModal: showDeleteModal, openModal: openDeleteModal, closeModal: closeDeleteModal, uniqueId: deleteId } = useModalShowHide();

  const columns = useCmsPageColumns(
    (id) => router.push(`/admin/pages/${id}?edit=1`),
    (id) => openDeleteModal(id)
  );
  const table = useCustomDataTable({
    columns,
    data: pages,
    manualFiltering: true,
    manualPagination: true,
    manualSorting: true,
    pageCount: Math.max(1, Math.ceil(total / Math.max(pageSize, 1))),
    pagination: { pageIndex: page - 1, pageSize },
    sorting: [{ id: filter.sortBy, desc: filter.sortDirection === 'DESC' }],
  });

  const updateFilter = (patch: Partial<CmsPageFilterValue>) => {
    setFilter((current) => ({ ...current, ...patch }));
    setPage(1);
  };

  const resetFilter = () => {
    setFilter(DEFAULT_CMS_PAGE_FILTER);
    setPage(1);
  };

  const changePageSize = (size: number) => {
    setPageSize(size);
    setPage(1);
  };

  const handleDelete = async (id: number) => {
    const response = await deleteMutation.mutateAsync(id);
    if (response && response.status === 200) {
      toast({ variant: 'success', title: 'Page deleted' });
    } else {
      const error = unitOfService.ErrorHandlerService.getErrorMessage(response);
      toast({ variant: 'destructive', title: 'Error', description: <span>{error}</span> });
    }
    closeDeleteModal(true);
  };

  const isFiltered = filter.search !== '' || filter.status !== null;
  const showSkeleton = listQuery.isPending;

  return (
    <div className="space-y-4">
      <ListPageHeader
        icon={FileText}
        title="Pages"
        description={listQuery.isPending ? 'Create and manage website pages' : `${total} ${total === 1 ? 'page' : 'pages'} on your site`}
        actions={
          <Button type="button" className="h-9 gap-1.5" onClick={() => router.push('/admin/pages/0')}>
            <Plus className="h-4 w-4" />
            Add page
          </Button>
        }
      />

      <CmsPageFilter
        value={filter}
        onChange={updateFilter}
        onReset={resetFilter}
        total={listQuery.isPending ? undefined : total}
        loading={listQuery.isFetching}
      />

      {listQuery.isError ? (
        <Card className="py-16 text-center">
          <p className="text-sm font-semibold text-destructive">Could not load pages</p>
          <p className="mt-1 text-xs text-muted-foreground">Check your connection and try again.</p>
        </Card>
      ) : (
        <Card className={cn('overflow-hidden p-0 md:p-0', listQuery.isFetching && !showSkeleton && 'opacity-60 transition-opacity')}>
          <CustomDataTable
            columns={columns}
            table={table}
            isLoading={showSkeleton}
            flush
            emptyMessage={
              <div className="flex flex-col items-center gap-2 py-6 text-muted-foreground">
                <FileText className="h-6 w-6 text-muted-foreground/40" />
                <span className="text-sm">{isFiltered ? 'No pages match these filters.' : 'No pages yet - use "Add page" to create the first one.'}</span>
              </div>
            }
          />
        </Card>
      )}

      {total > pageSize && (
        <Card size="sm">
          <ListPagination
            page={page}
            pageSize={pageSize}
            total={total}
            loading={listQuery.isFetching}
            onPageChange={setPage}
            onPageSizeChange={changePageSize}
          />
        </Card>
      )}

      {showDeleteModal && deleteId && (
        <ConfirmBox
          isOpen={showDeleteModal}
          onClose={() => closeDeleteModal(false)}
          onSubmit={() => handleDelete(+deleteId)}
          heading="Delete page"
          loading={deleteMutation.isPending}
          bodyText="Delete this page permanently? Its URL will stop working for visitors right away."
        />
      )}
    </div>
  );
}
