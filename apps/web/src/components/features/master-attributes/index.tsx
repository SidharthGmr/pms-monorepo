'use client';
import { KeyboardEvent, MouseEvent, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ListChecks, Pencil, Ruler, Trash2 } from 'lucide-react';
import { MasterAttributeDto } from '@/dtos/master-entry.dto';
import { MasterAttributeFilterParams } from '@/params/master-entry.params';
import { useDeleteMasterAttribute, useGetAllMasterAttributes } from '@/hooks/service-hooks/useMasterEntryService';
import { useCustomDataTable } from '@/hooks/use-custom-table';
import useModalShowHide from '@/hooks/use-modal-show-hide';
import { container } from '@/config/ioc';
import { TYPES } from '@/config/types';
import IUnitOfService from '@/services/interfaces/IUnitOfService';
import config from '@/config';
import { StatusValues } from '@/enums/status-values.enum';
import { cn } from '@/lib/utils';
import { CustomDataTable } from '@/components/Table/data-table';
import ConfirmBox from '@/components/common/confirm-box';
import CardAction from '@/components/common/card-action';
import ListPagination from '@/components/common/list-pagination';
import { PageHeader } from '@/components/common/page-header';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/components/ui/use-toast';
import ManageMasterAttribute from './add-edit';
import AddMasterAttributePanel from './add-edit/inline-panel';
import { MasterAttributeFormHandle } from './add-edit/form';
import { useMasterAttributeColumns } from './columns';
import MasterAttributeFilter, { DEFAULT_MASTER_ATTRIBUTE_FILTER, ListView, MasterAttributeFilterValue, SortDirection } from './filter';

const STATUS_BADGE: Record<string, 'green' | 'orange' | 'destructive'> = {
  [StatusValues.Published]: 'green',
  [StatusValues.Draft]: 'orange',
  [StatusValues.Trash]: 'destructive',
};

const GRID = 'grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3';

// `p-0` alone loses to the Card's own `md:p-5` in tailwind-merge (different variant), which puts a 20px inset at desktop widths.
const FLUSH_CARD = 'p-0 md:p-0';

// Remembered per browser so the layout choice sticks between visits. Wrapped because storage can be blocked.
const VIEW_STORAGE_KEY = 'master-attributes.view';
const readStoredView = (): ListView | null => {
  try {
    const stored = window.localStorage.getItem(VIEW_STORAGE_KEY);
    return stored === 'table' || stored === 'grid' ? stored : null;
  } catch {
    return null;
  }
};
const storeView = (view: ListView) => {
  try {
    window.localStorage.setItem(VIEW_STORAGE_KEY, view);
  } catch {
    // Storage blocked: the choice just lasts for this page load.
  }
};

export default function MasterAttributeList() {
  const unitOfService = container.get<IUnitOfService>(TYPES.IUnitOfService);
  const searchParams = useSearchParams();
  // Add opens an inline panel above the search bar; Edit still uses the dialog.
  const [showAddPanel, setShowAddPanel] = useState(false);
  const addPanelRef = useRef<MasterAttributeFormHandle>(null);

  // Cards by default. The stored preference is applied after mount so server and first client render agree.
  const [view, setView] = useState<ListView>('grid');
  useEffect(() => {
    const stored = readStoredView();
    if (stored) setView(stored);
  }, []);
  const changeView = (next: ListView) => {
    setView(next);
    storeView(next);
  };

  // The URL seeds the first render so a shared link opens on the same view; after that the page owns the state.
  const [filter, setFilter] = useState<MasterAttributeFilterValue>(() => ({
    search: searchParams.get('search') ?? DEFAULT_MASTER_ATTRIBUTE_FILTER.search,
    status: searchParams.get('status') ?? DEFAULT_MASTER_ATTRIBUTE_FILTER.status,
    sortBy: searchParams.get('sortBy') ?? DEFAULT_MASTER_ATTRIBUTE_FILTER.sortBy,
    sortDirection: (searchParams.get('sortDirection')?.toUpperCase() as SortDirection) === 'ASC' ? 'ASC' : 'DESC',
  }));
  const [page, setPage] = useState(() => Math.max(1, Number(searchParams.get('page')) || 1));
  const [pageSize, setPageSize] = useState(() => Number(searchParams.get('recordPerPage')) || config.recordPerPage);

  const params = useMemo<MasterAttributeFilterParams>(
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

  const listQuery = useGetAllMasterAttributes(params);
  const deleteMutation = useDeleteMasterAttribute();

  const result = listQuery.data?.data?.data;
  const attributes: MasterAttributeDto[] = useMemo(() => result?.data ?? [], [result]);
  const total = result?.totalRecord ?? 0;

  const { showModal: showEditModal, openModal: openEditModal, closeModal: closeEditModal, uniqueId: editId } = useModalShowHide();
  const { showModal: showDeleteModal, openModal: openDeleteModal, closeModal: closeDeleteModal, uniqueId: deleteId } = useModalShowHide();

  // The table view reuses the original column set. Paging and sorting are already applied by
  // the API, so the table is told it is manual and simply renders the page it is given.
  const columns = useMasterAttributeColumns(
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

  const formatDate = (value?: string | null) => (value ? unitOfService.DateTimeService.convertToLocalDate(new Date(value), false) : '—');

  const isFiltered = filter.search !== '' || filter.status !== '';
  const showSkeleton = listQuery.isPending;

  return (
    <div className="space-y-4">
      <Card className="space-y-4">
        <PageHeader
          title="Master Attributes"
          description={
            listQuery.isPending
              ? 'Groups of reusable values — Size, Color, Weight — used across the app'
              : `${total} ${total === 1 ? 'attribute' : 'attributes'} · groups of reusable values used across the app`
          }
          variant="add"
          actionText={showAddPanel ? 'Close' : 'Add Attribute'}
          buttonVariant={showAddPanel ? 'outline' : 'default'}
          onClick={() => (showAddPanel ? addPanelRef.current?.requestClose() : setShowAddPanel(true))}
        />
        <AddMasterAttributePanel ref={addPanelRef} isOpen={showAddPanel} onClose={() => setShowAddPanel(false)} />
        <Separator />
        <MasterAttributeFilter
          value={filter}
          onChange={updateFilter}
          onReset={resetFilter}
          view={view}
          onViewChange={changeView}
          total={listQuery.isPending ? undefined : total}
          loading={listQuery.isFetching}
        />
      </Card>

      <Card size="sm">
        <ListPagination page={page} pageSize={pageSize} total={total} loading={listQuery.isFetching} onPageChange={setPage} onPageSizeChange={changePageSize} />
      </Card>

      {listQuery.isError ? (
        <Card className="py-16 text-center">
          <p className="text-sm font-semibold text-destructive">Could not load attributes</p>
          <p className="mt-1 text-xs text-muted-foreground">Check your connection and try again.</p>
        </Card>
      ) : view === 'table' ? (
        <Card className={cn(FLUSH_CARD, 'overflow-hidden', listQuery.isFetching && !showSkeleton && 'opacity-60 transition-opacity')}>
          <CustomDataTable columns={columns} table={table} isLoading={showSkeleton} />
        </Card>
      ) : showSkeleton ? (
        <div className={GRID} aria-busy="true" aria-label="Loading attributes">
          {Array.from({ length: Math.min(pageSize, 9) }).map((_, i) => (
            <Card key={i} className={cn(FLUSH_CARD, 'border')}>
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
              {isFiltered ? 'Try a different search or status.' : 'Use "Add Attribute" above to create the first one, e.g. Size or Color.'}
            </p>
          </div>
        </Card>
      ) : (
        <div className={cn(GRID, listQuery.isFetching && 'opacity-60 transition-opacity')} aria-busy={listQuery.isFetching}>
          {attributes.map((attribute) => (
            <AttributeCard
              key={attribute.id}
              attribute={attribute}
              formatDate={formatDate}
              onEdit={() => openEditModal(attribute.id)}
              onDelete={() => openDeleteModal(attribute.id)}
            />
          ))}
        </div>
      )}

      {total > pageSize && (
        <Card size="sm">
          <ListPagination page={page} pageSize={pageSize} total={total} loading={listQuery.isFetching} onPageChange={setPage} onPageSizeChange={changePageSize} />
        </Card>
      )}

      {showEditModal && editId && <ManageMasterAttribute id={+editId} isOpen={showEditModal} onClose={(refresh) => closeEditModal(refresh)} />}
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

interface AttributeCardProps {
  attribute: MasterAttributeDto;
  formatDate: (value?: string | null) => string;
  onEdit: () => void;
  onDelete: () => void;
}

function AttributeCard({ attribute, formatDate, onEdit, onDelete }: AttributeCardProps) {
  const isTrashed = attribute.status === StatusValues.Trash;
  const entryCount = attribute.entryCount ?? 0;
  const scope = [attribute.category?.name, attribute.brandName?.name].filter(Boolean).join(' · ');

  // The whole card opens the editor; the overlay buttons and the values link stop propagation.
  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.target !== e.currentTarget) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onEdit();
    }
  };
  const stop = (e: MouseEvent) => e.stopPropagation();

  return (
    <Card
      role="button"
      tabIndex={0}
      onClick={onEdit}
      onKeyDown={onKeyDown}
      aria-label={`Edit ${attribute.name}`}
      className={cn(
        FLUSH_CARD,
        'group relative flex cursor-pointer flex-col border transition-all duration-200',
        'hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        isTrashed && 'opacity-70 grayscale hover:grayscale-0'
      )}
    >
      <div className="flex items-start gap-3 p-4">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary/10 font-mono text-xs font-bold uppercase tracking-wide text-primary">
          {attribute.code.slice(0, 3)}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <p className="truncate text-sm font-semibold leading-tight" title={attribute.name}>
              {attribute.name}
            </p>
            <Badge variant={STATUS_BADGE[attribute.status] ?? 'default'} className="shrink-0 px-1.5 py-0 text-[10px]">
              {attribute.status}
            </Badge>
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-muted-foreground">
            <code className="rounded bg-muted/60 px-1.5 py-0.5 font-mono font-medium uppercase">{attribute.code}</code>
            {attribute.unit && <span title="Unit">Unit: {attribute.unit}</span>}
          </div>
          {(attribute.description || scope) && (
            <p className="mt-1 line-clamp-1 text-[11px] text-muted-foreground" title={attribute.description ?? scope}>
              {attribute.description || `Scoped to ${scope}`}
            </p>
          )}
        </div>

        <div className="absolute right-3 top-3 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100 [@media(hover:none)]:opacity-100">
          <CardAction label="Edit attribute" icon={Pencil} onClick={onEdit} className="hover:bg-primary hover:text-primary-foreground" />
          <CardAction label="Delete attribute" icon={Trash2} onClick={onDelete} className="hover:bg-destructive hover:text-destructive-foreground" />
        </div>
      </div>

      <div className="mt-auto flex items-center justify-between gap-2 border-t px-4 py-2.5 text-[11px] text-muted-foreground">
        <Link
          href={`/admin/master-entries?attributeId=${attribute.id}`}
          onClick={stop}
          className="inline-flex items-center gap-1 font-medium text-primary underline-offset-4 hover:underline"
        >
          <ListChecks className="h-3.5 w-3.5" />
          {entryCount} {entryCount === 1 ? 'value' : 'values'}
        </Link>
        <span className="flex items-center gap-2">
          <span className="rounded bg-muted px-1.5 py-0.5 font-medium tabular-nums" title="Display order">
            Order {attribute.displayOrder ?? '—'}
          </span>
          <span title="Date added">{formatDate(attribute.createdAt)}</span>
        </span>
      </div>
    </Card>
  );
}
