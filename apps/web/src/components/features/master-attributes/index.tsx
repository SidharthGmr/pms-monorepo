'use client';
import { MouseEvent, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ListChecks, Plus, Ruler } from 'lucide-react';
import { Status, MasterAttributeDto, MasterAttributeFilterParams, StatusValues } from '@pms/types';
import { useDeleteMasterAttribute, useGetAllMasterAttributes } from '@/hooks/service-hooks/useMasterEntryService';
import { useCustomDataTable } from '@/hooks/use-custom-table';
import useModalShowHide from '@/hooks/use-modal-show-hide';
import { container } from '@/config/ioc';
import { TYPES } from '@/config/types';
import IUnitOfService from '@/services/interfaces/IUnitOfService';
import config from '@/config';

import { cn } from '@/lib/utils';
import { CustomDataTable } from '@/components/Table/data-table';
import ConfirmBox from '@/components/common/confirm-box';
import ListPagination from '@/components/common/list-pagination';
import ListPageHeader from '@/components/common/list-page-header';
import { CustomeCard } from '@/components/common/custome-card/card';
import { readStoredView, storeView } from '@/components/common/view-switch';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/components/ui/use-toast';
import ManageMasterEntry from '../master-entries/add-edit';
import ManageMasterAttribute from './add-edit';
import { useMasterAttributeColumns } from './columns';
import MasterAttributeFilter, { DEFAULT_MASTER_ATTRIBUTE_FILTER, ListView, MasterAttributeFilterValue, SortDirection } from './filter';

const STATUS_BADGE: Record<string, 'green' | 'orange' | 'destructive'> = {
  [StatusValues.Published]: 'green',
  [StatusValues.Draft]: 'orange',
  [StatusValues.Trash]: 'destructive',
};

const GRID = 'grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3';

const VIEW_STORAGE_KEY = 'master-attributes.view';

// The card itself opens the editor, so the values link has to keep its click to itself.
const stopPropagation = (e: MouseEvent) => e.stopPropagation();

const scopeOf = (attribute: MasterAttributeDto) => {
  const scope = [attribute.category?.name, attribute.brandName?.name].filter(Boolean).join(' · ');
  return scope ? `Scoped to ${scope}` : undefined;
};

export default function MasterAttributeList() {
  const unitOfService = container.get<IUnitOfService>(TYPES.IUnitOfService);
  const searchParams = useSearchParams();
  // Add opens an inline panel above the search bar; Edit still uses the dialog.
  const [showAddModal, setShowAddModal] = useState(false);

  // Cards by default. The stored preference is applied after mount so server and first client render agree.
  const [view, setView] = useState<ListView>('grid');
  useEffect(() => {
    const stored = readStoredView(VIEW_STORAGE_KEY);
    if (stored) setView(stored);
  }, []);
  const changeView = (next: ListView) => {
    setView(next);
    storeView(VIEW_STORAGE_KEY, next);
  };

  // The URL seeds the first render so a shared link opens on the same view; after that the page owns the state.
  const [filter, setFilter] = useState<MasterAttributeFilterValue>(() => ({
    search: searchParams.get('search') ?? DEFAULT_MASTER_ATTRIBUTE_FILTER.search,
    status: (searchParams.get('status') as Status) || DEFAULT_MASTER_ATTRIBUTE_FILTER.status,
    sortBy: searchParams.get('sortBy') ?? DEFAULT_MASTER_ATTRIBUTE_FILTER.sortBy,
    sortDirection: (searchParams.get('sortDirection')?.toUpperCase() as SortDirection) === 'ASC' ? 'ASC' : 'DESC',
  }));
  const [page, setPage] = useState(() => Math.max(1, Number(searchParams.get('page')) || 1));
  const [pageSize, setPageSize] = useState(() => Number(searchParams.get('recordPerPage')) || config.recordPerPage);

  const params = useMemo<MasterAttributeFilterParams>(
    () => ({
      search: filter.search,
      status: filter.status ?? undefined,
      sortBy: filter.sortBy,
      sortDirection: filter.sortDirection,
      page,
      recordPerPage: pageSize,
    }),
    [filter, page, pageSize]
  );

  const listQuery = useGetAllMasterAttributes(params);
  const deleteMutation = useDeleteMasterAttribute();

  const result = listQuery.data?.data?.data;
  console.log('result', result);
  const attributes: MasterAttributeDto[] = useMemo(() => result?.data ?? [], [result]);
  const total = result?.totalRecord ?? 0;

  const { showModal: showEditModal, openModal: openEditModal, closeModal: closeEditModal, uniqueId: editId } = useModalShowHide();
  // The "+" action on a row opens the entry dialog with that attribute already picked.
  const { showModal: showValuesModal, openModal: openValuesModal, closeModal: closeValuesModal, uniqueId: valuesId } = useModalShowHide();
  const { showModal: showDeleteModal, openModal: openDeleteModal, closeModal: closeDeleteModal, uniqueId: deleteId } = useModalShowHide();

  // The table view reuses the original column set. Paging and sorting are already applied by
  // the API, so the table is told it is manual and simply renders the page it is given.
  const columns = useMasterAttributeColumns(
    (id) => openValuesModal(id),
    (id) => openEditModal(id),
    (id) => openDeleteModal(id)
  );
  const table = useCustomDataTable({
    columns,
    data: attributes,
    manualFiltering: true,
    manualPagination: true,
    manualSorting: true,
    pageCount: Math.max(1, Math.ceil(total / Math.max(pageSize, 1))),
    pagination: { pageIndex: page - 1, pageSize },
    sorting: [{ id: filter.sortBy, desc: filter.sortDirection === 'DESC' }],
  });

  // Any change to what is being listed sends the user back to page 1, otherwise a narrower result set can leave them on an empty page.
  const updateFilter = (patch: Partial<MasterAttributeFilterValue>) => {
    setFilter((current) => ({ ...current, ...patch }));
    setPage(1);
  };

  const resetFilter = () => {
    setFilter(DEFAULT_MASTER_ATTRIBUTE_FILTER);
    setPage(1);
  };

  const changePageSize = (size: number) => {
    setPageSize(size);
    setPage(1);
  };

  const handleDelete = async (id: number) => {
    const response = await deleteMutation.mutateAsync(id);
    if (response && (response.status === 204 || response.status === 200)) {
      toast({ variant: 'success', title: 'Attribute moved to Trash' });
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
        icon={Ruler}
        title="Master Attributes"
        description={
          listQuery.isPending
            ? 'Groups of reusable values such as Size, Color and Weight'
            : `${total} ${total === 1 ? 'option group' : 'option groups'} · reusable values such as Size, Color and Weight`
        }
        actions={
          <Button type="button" className="h-9 gap-1.5" onClick={() => setShowAddModal(true)}>
            <Plus className="h-4 w-4" />
            Add attribute
          </Button>
        }
      />

      <MasterAttributeFilter
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
          <p className="text-sm font-semibold text-destructive">Could not load attributes</p>
          <p className="mt-1 text-xs text-muted-foreground">Check your connection and try again.</p>
        </Card>
      ) : view === 'table' ? (
        <Card className={cn('p-0 md:p-0 overflow-hidden', listQuery.isFetching && !showSkeleton && 'opacity-60 transition-opacity')}>
          <CustomDataTable
            columns={columns}
            table={table}
            isLoading={showSkeleton}
            flush
            emptyMessage={
              <div className="flex flex-col items-center gap-2 py-6 text-muted-foreground">
                <Ruler className="h-6 w-6 text-muted-foreground/40" />
                <span className="text-sm">{isFiltered ? 'No attributes match these filters.' : 'No attributes yet.'}</span>
              </div>
            }
          />
        </Card>
      ) : showSkeleton ? (
        <div className={GRID} aria-busy="true" aria-label="Loading attributes">
          {Array.from({ length: Math.min(pageSize, 9) }).map((_, i) => (
            <Card key={i} className={cn('p-0 md:p-0 border')}>
              <div className="flex items-start gap-3 p-4">
                <Skeleton className="h-11 w-11 shrink-0 rounded-lg" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-2/3" />
                  <Skeleton className="h-3 w-1/3" />
                </div>
              </div>
              <div className="flex items-center justify-between border-t px-4 py-2.5">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-3 w-20" />
              </div>
            </Card>
          ))}
        </div>
      ) : attributes.length === 0 ? (
        <Card className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
          <div className="rounded-full bg-muted p-4 text-muted-foreground">
            <Ruler className="h-7 w-7" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-semibold">{isFiltered ? 'No attributes match these filters' : 'No attributes yet'}</p>
            <p className="text-xs text-muted-foreground">
              {isFiltered ? 'Try a different search or status.' : 'Use "Add attribute" above to create the first one, e.g. Size or Color.'}
            </p>
          </div>
        </Card>
      ) : (
        <div className={cn(GRID, listQuery.isFetching && 'opacity-60 transition-opacity')} aria-busy={listQuery.isFetching}>
          {attributes.map((attribute) => (
            <CustomeCard
              key={attribute.id}
              monogram={attribute.code.slice(0, 3)}
              title={attribute.name}
              type={attribute.code}
              status={attribute.status}
              statusVariant={STATUS_BADGE[attribute.status] ?? 'default'}
              subtitle={scopeOf(attribute)}
              displayOrder={attribute.displayOrder}
              date={attribute.createdAt}
              entityLabel="attribute"
              dimmed={attribute.status === StatusValues.Trash}
              footer={
                <Link
                  href={`/admin/master-entries?attributeId=${attribute.id}`}
                  onClick={stopPropagation}
                  className="inline-flex items-center gap-1 font-medium text-primary underline-offset-4 hover:underline"
                >
                  <ListChecks className="h-3.5 w-3.5" />
                  {attribute.entryCount ?? 0} {(attribute.entryCount ?? 0) === 1 ? 'value' : 'values'}
                </Link>
              }
              onEdit={() => openEditModal(attribute.id)}
              onDelete={() => openDeleteModal(attribute.id)}
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

      {showAddModal && <ManageMasterAttribute isOpen={showAddModal} onClose={() => setShowAddModal(false)} />}
      {showEditModal && editId && <ManageMasterAttribute id={+editId} isOpen={showEditModal} onClose={(refresh) => closeEditModal(refresh)} />}
      {showValuesModal && valuesId && (
        <ManageMasterEntry defaultAttributeId={+valuesId} isOpen={showValuesModal} onClose={(refresh) => closeValuesModal(refresh)} />
      )}
      {showDeleteModal && deleteId && (
        <ConfirmBox
          isOpen={showDeleteModal}
          onClose={() => closeDeleteModal(false)}
          onSubmit={() => handleDelete(+deleteId)}
          heading="Delete attribute"
          loading={deleteMutation.isPending}
          bodyText="This moves the attribute and all of its values to Trash. Anything selecting this attribute's code will stop finding values."
        />
      )}
    </div>
  );
}
