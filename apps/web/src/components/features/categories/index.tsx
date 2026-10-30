'use client';
import { useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { CornerDownRight, FolderTree, Plus } from 'lucide-react';
import { CategoryFilterParams, CategoryResponseDto, Status, StatusValues } from '@pms/types';
import { useDeleteCategory, useGetAllCategories } from '@/hooks/service-hooks/useCategoryService';
import useModalShowHide from '@/hooks/use-modal-show-hide';
import { container } from '@/config/ioc';
import { TYPES } from '@/config/types';
import IUnitOfService from '@/services/interfaces/IUnitOfService';
import config from '@/config';
import { cn } from '@/lib/utils';
import ConfirmBox from '@/components/common/confirm-box';
import ListPagination from '@/components/common/list-pagination';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/components/ui/use-toast';
import ListPageHeader from '@/components/common/list-page-header';
import { CustomeCard } from '@/components/common/custome-card/card';
import { ListView } from '@/components/common/view-switch';
import { CustomDataTable } from '@/components/Table/data-table';
import { useCustomDataTable } from '@/hooks/use-custom-table';
import ManageCategory from './add-edit';
import { useCategoryColumns } from './columns';
import CategoryFilter, { CategoryFilterValue, DEFAULT_CATEGORY_FILTER, SortDirection } from './filter';

const STATUS_BADGE: Record<Status, 'green' | 'orange' | 'destructive'> = {
  [StatusValues.Published]: 'green',
  [StatusValues.Draft]: 'orange',
  [StatusValues.Trash]: 'destructive',
};

const GRID = 'grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4';
const FLUSH_CARD = 'p-0 md:p-0';

const ALL_CATEGORIES_PARAMS: CategoryFilterParams = { showAllRecords: true };

const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0).toISOString();
const endOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999).toISOString();

export default function CategoryList() {
  const unitOfService = container.get<IUnitOfService>(TYPES.IUnitOfService);
  const searchParams = useSearchParams();
  const [showAddModal, setShowAddModal] = useState(false);
  const [view, setView] = useState<ListView>('grid');
  const changeView = (next: ListView) => {
    setView(next);
  };

  const [filter, setFilter] = useState<CategoryFilterValue>(() => {
    const from = searchParams.get('startDate');
    const to = searchParams.get('endDate');
    return {
      search: searchParams.get('search') ?? DEFAULT_CATEGORY_FILTER.search,
      status: (searchParams.get('status') as Status | null) ?? DEFAULT_CATEGORY_FILTER.status,
      dateRange: from || to ? { from: from ? new Date(from) : undefined, to: to ? new Date(to) : undefined } : undefined,
      includeDeleted: searchParams.get('includeDeleted') === 'true',
      sortBy: searchParams.get('sortBy') ?? DEFAULT_CATEGORY_FILTER.sortBy,
      sortDirection: (searchParams.get('sortDirection')?.toUpperCase() as SortDirection) === 'ASC' ? 'ASC' : 'DESC',
    };
  });
  const [page, setPage] = useState(() => Math.max(1, Number(searchParams.get('page')) || 1));
  const [pageSize, setPageSize] = useState(() => Number(searchParams.get('recordPerPage')) || config.recordPerPage);

  const params = useMemo<CategoryFilterParams>(
    () => ({
      search: filter.search || undefined,
      status: filter.status ?? undefined,
      startDate: filter.dateRange?.from ? startOfDay(filter.dateRange.from) : undefined,
      endDate: filter.dateRange?.to ? endOfDay(filter.dateRange.to) : undefined,
      includeDeleted: filter.includeDeleted || undefined,
      sortBy: filter.sortBy,
      sortDirection: filter.sortDirection,
      page,
      recordPerPage: pageSize,
    }),
    [filter, page, pageSize]
  );

  const listQuery = useGetAllCategories(params);
  const allCategoriesQuery = useGetAllCategories(ALL_CATEGORIES_PARAMS);
  const deleteMutation = useDeleteCategory();

  const result = listQuery.data?.data?.data;
  const categories: CategoryResponseDto[] = result?.data ?? [];
  const total = result?.totalRecord ?? 0;

  // id -> name, so a card can say which category it sits under without another request per card.
  const parentNames = useMemo(() => {
    const map = new Map<number, string>();
    allCategoriesQuery.data?.data?.data?.data?.forEach((c) => map.set(c.id, c.name));
    return map;
  }, [allCategoriesQuery.data]);

  const { showModal: showEditModal, openModal: openEditModal, closeModal: closeEditModal, uniqueId: editId } = useModalShowHide();
  const { showModal: showViewModal, openModal: openViewModal, closeModal: closeViewModal, uniqueId: viewId } = useModalShowHide();
  const { showModal: showDeleteModal, openModal: openDeleteModal, closeModal: closeDeleteModal, uniqueId: deleteId } = useModalShowHide();

  // The table view reuses the column layout. Paging and sorting are already applied by the API,
  // so the table is told it is manual and simply renders the page it is given.
  const columns = useCategoryColumns(
    parentNames,
    (id) => openEditModal(id),
    (id) => openDeleteModal(id),
    (id) => openViewModal(id)
  );
  const table = useCustomDataTable({
    columns,
    data: categories,
    manualFiltering: true,
    manualPagination: true,
    manualSorting: true,
    pageCount: Math.max(1, Math.ceil(total / Math.max(pageSize, 1))),
    pagination: { pageIndex: page - 1, pageSize },
    sorting: [{ id: filter.sortBy, desc: filter.sortDirection === 'DESC' }],
  });

  // Any change to what is being listed sends the user back to page 1, otherwise a narrower result set can leave them on an empty page.
  const updateFilter = (patch: Partial<CategoryFilterValue>) => {
    setFilter((current) => ({ ...current, ...patch }));
    setPage(1);
  };

  const resetFilter = () => {
    setFilter(DEFAULT_CATEGORY_FILTER);
    setPage(1);
  };

  const changePageSize = (size: number) => {
    setPageSize(size);
    setPage(1);
  };

  const handleDelete = async (id: number) => {
    const response = await deleteMutation.mutateAsync(id);
    if (response && response.status === 200) {
      toast({ variant: 'success', title: 'Category deleted' });
    } else {
      const error = unitOfService.ErrorHandlerService.getErrorMessage(response);
      toast({ variant: 'destructive', title: 'Error', description: <span>{error}</span> });
    }
    closeDeleteModal(true);
  };

  const isFiltered = filter.search !== '' || filter.status !== null || !!filter.dateRange || filter.includeDeleted;
  const showSkeleton = listQuery.isPending;

  if (listQuery.isPending && view !== 'table') {
    return (
      <div className={GRID} aria-busy="true" aria-label="Loading categories">
        {Array.from({ length: Math.min(pageSize, 12) }).map((_, i) => (
          <Card key={i} className={cn(FLUSH_CARD, 'overflow-hidden border')}>
            <Skeleton className="h-28 w-full rounded-none" />
            <div className="space-y-1.5 p-3">
              <Skeleton className="h-3.5 w-3/4" />
              <Skeleton className="h-2.5 w-1/3" />
            </div>
          </Card>
        ))}
      </div>
    );
  }

  if (listQuery.isError) {
    return (
      <Card className="py-16 text-center">
        <p className="text-sm font-semibold text-destructive">Could not load categories</p>
        <p className="mt-1 text-xs text-muted-foreground">Check your connection and try again.</p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <ListPageHeader
        icon={FolderTree}
        title="Categories"
        description={listQuery.isPending ? 'Manage product categories' : `${total} ${total === 1 ? 'category' : 'categories'} in your store`}
        actions={
          <Button type="button" className="h-9 gap-1.5" onClick={() => setShowAddModal(true)}>
            <Plus className="h-4 w-4" />
            Add category
          </Button>
        }
      />

      <CategoryFilter
        value={filter}
        onChange={updateFilter}
        onReset={resetFilter}
        view={view}
        onViewChange={changeView}
        total={listQuery.isPending ? undefined : total}
        loading={listQuery.isFetching}
      />

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

      {listQuery.isError ? (
        <Card className="py-16 text-center">
          <p className="text-sm font-semibold text-destructive">Could not load categories</p>
          <p className="mt-1 text-xs text-muted-foreground">Check your connection and try again.</p>
        </Card>
      ) : view === 'table' ? (
        <Card className={cn(FLUSH_CARD, 'overflow-hidden', listQuery.isFetching && !showSkeleton && 'opacity-60 transition-opacity')}>
          <CustomDataTable
            columns={columns}
            table={table}
            isLoading={showSkeleton}
            flush
            emptyMessage={
              <div className="flex flex-col items-center gap-2 py-6 text-muted-foreground">
                <FolderTree className="h-6 w-6 text-muted-foreground/40" />
                <span className="text-sm">{isFiltered ? 'No categories match these filters.' : 'No categories yet.'}</span>
              </div>
            }
          />
        </Card>
      ) : categories.length === 0 ? (
        <Card className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
          <div className="rounded-full bg-muted p-4 text-muted-foreground">
            <FolderTree className="h-7 w-7" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-semibold">{isFiltered ? 'No categories match these filters' : 'No categories yet'}</p>
            <p className="text-xs text-muted-foreground">
              {isFiltered ? 'Try a different search, status or date range.' : 'Use "Add category" above to create the first one.'}
            </p>
          </div>
        </Card>
      ) : (
        <div className={cn(GRID, listQuery.isFetching && 'opacity-60 transition-opacity')} aria-busy={listQuery.isFetching}>
          {categories.map((category) => (
            <CustomeCard
              key={category.id}
              image={category.images?.[0]}
              title={category.name}
              status={category.status}
              statusVariant={STATUS_BADGE[category.status] ?? 'default'}
              displayOrder={category.displayOrder}
              date={category.createdAt}
              subtitle={category.parentId != null ? (parentNames.get(category.parentId) ?? 'Sub-category') : undefined}
              subtitleIcon={CornerDownRight}
              entityLabel="category"
              isDeleted={category.deletedAt != null}
              onView={() => openViewModal(category.id)}
              onEdit={() => openEditModal(category.id)}
              onDelete={() => openDeleteModal(category.id)}
            />
          ))}
        </div>
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

      {showViewModal && viewId && (
        <ManageCategory
          id={+viewId}
          isOpen={showViewModal}
          mode="view"
          parentName={(() => {
            const category = categories.find((item) => item.id === +viewId!);
            return category?.parentId != null ? parentNames.get(category.parentId) : undefined;
          })()}
          onClose={(refresh) => closeViewModal(refresh)}
        />
      )}
      {showEditModal && editId && <ManageCategory id={+editId} isOpen={showEditModal} onClose={(refresh) => closeEditModal(refresh)} />}
      {showAddModal && <ManageCategory isOpen={showAddModal} onClose={() => setShowAddModal(false)} />}

      {showDeleteModal && deleteId && (
        <ConfirmBox
          isOpen={showDeleteModal}
          onClose={() => closeDeleteModal(false)}
          onSubmit={() => handleDelete(+deleteId)}
          heading="Delete category"
          bodyText="Delete this category? It will be hidden from the list; turn on “Show deleted” to find it again."
          noButtonText="Cancel"
          yesButtonText="Delete"
          loading={deleteMutation.isPending}
        />
      )}
    </div>
  );
}
