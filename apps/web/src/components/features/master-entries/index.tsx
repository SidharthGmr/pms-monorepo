'use client';
import { KeyboardEvent, MouseEvent, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ListChecks, Pencil, Plus, Trash2, X } from 'lucide-react';
import { MasterEntryDto } from '@/dtos/master-entry.dto';
import { MasterEntryFilterParams } from '@/params/master-entry.params';
import { useDeleteMasterEntry, useGetAllMasterEntries } from '@/hooks/service-hooks/useMasterEntryService';
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
import ListPageHeader from '@/components/common/list-page-header';
import { ListView, readStoredView, storeView } from '@/components/common/view-switch';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/components/ui/use-toast';
import ManageMasterEntry from './add-edit';
import { HEX_COLOR, MasterEntryFormHandle } from './add-edit/form';
import AddMasterEntryPanel from './add-edit/inline-panel';
import { useMasterEntryColumns } from './columns';
import MasterEntryFilter, { DEFAULT_MASTER_ENTRY_FILTER, MasterEntryFilterValue, SortDirection } from './filter';

const STATUS_BADGE: Record<string, 'green' | 'orange' | 'destructive'> = {
  [StatusValues.Published]: 'green',
  [StatusValues.Draft]: 'orange',
  [StatusValues.Trash]: 'destructive',
};

const GRID = 'grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4';

// `p-0` alone loses to the Card's own `md:p-5` in tailwind-merge (different variant), which puts a 20px inset at desktop widths.
const FLUSH_CARD = 'p-0 md:p-0';

const VIEW_STORAGE_KEY = 'master-entries.view';

export default function MasterEntryList() {
  const unitOfService = container.get<IUnitOfService>(TYPES.IUnitOfService);
  const searchParams = useSearchParams();

  // The attributes screen deep-links here with ?attributeId=..., which both filters the list and pre-selects the group when adding.
  const initialAttributeId = searchParams.get('attributeId') ? +searchParams.get('attributeId')! : undefined;

  // Add opens an inline panel above the search bar; Edit still uses the dialog. Cards are the
  // default view; the stored preference is applied after mount so server and first client render agree.
  const [showAddPanel, setShowAddPanel] = useState(false);
  const addPanelRef = useRef<MasterEntryFormHandle>(null);
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
  const [filter, setFilter] = useState<MasterEntryFilterValue>(() => ({
    search: searchParams.get('search') ?? DEFAULT_MASTER_ENTRY_FILTER.search,
    status: searchParams.get('status') ?? DEFAULT_MASTER_ENTRY_FILTER.status,
    attributeId: initialAttributeId,
    sortBy: searchParams.get('sortBy') ?? DEFAULT_MASTER_ENTRY_FILTER.sortBy,
    sortDirection: (searchParams.get('sortDirection')?.toUpperCase() as SortDirection) === 'ASC' ? 'ASC' : 'DESC',
  }));
  const [page, setPage] = useState(() => Math.max(1, Number(searchParams.get('page')) || 1));
  const [pageSize, setPageSize] = useState(() => Number(searchParams.get('recordPerPage')) || config.recordPerPage);

  const params = useMemo<MasterEntryFilterParams>(
    () => ({
      search: filter.search,
      status: filter.status,
      attributeId: filter.attributeId,
      sortBy: filter.sortBy,
      sortDirection: filter.sortDirection,
      page,
      recordPerPage: pageSize,
    }),
    [filter, page, pageSize]
  );

  const listQuery = useGetAllMasterEntries(params);
  const deleteMutation = useDeleteMasterEntry();

  const result = listQuery.data?.data?.data;
  const entries: MasterEntryDto[] = useMemo(() => result?.data ?? [], [result]);
  const total = result?.totalRecord ?? 0;

  const { showModal: showEditModal, openModal: openEditModal, closeModal: closeEditModal, uniqueId: editId } = useModalShowHide();
  const { showModal: showDeleteModal, openModal: openDeleteModal, closeModal: closeDeleteModal, uniqueId: deleteId } = useModalShowHide();

  // The table view reuses the original column set. Paging and sorting are already applied by
  // the API, so the table is told it is manual and simply renders the page it is given.
  const columns = useMasterEntryColumns(
    (id) => openEditModal(id),
    (id) => openDeleteModal(id)
  );
  const table = useCustomDataTable({
    columns,
    data: entries,
    manualFiltering: true,
    manualPagination: true,
    manualSorting: true,
    pageCount: Math.max(1, Math.ceil(total / Math.max(pageSize, 1))),
    pagination: { pageIndex: page - 1, pageSize },
    sorting: [{ id: filter.sortBy, desc: filter.sortDirection === 'DESC' }],
  });

  // Any change to what is being listed sends the user back to page 1, otherwise a narrower result set can leave them on an empty page.
  const updateFilter = (patch: Partial<MasterEntryFilterValue>) => {
    setFilter((current) => ({ ...current, ...patch }));
    setPage(1);
  };

  const resetFilter = () => {
    setFilter(DEFAULT_MASTER_ENTRY_FILTER);
    setPage(1);
  };

  const changePageSize = (size: number) => {
    setPageSize(size);
    setPage(1);
  };

  const handleDelete = async (id: number) => {
    const response = await deleteMutation.mutateAsync(id);
    if (response && (response.status === 204 || response.status === 200)) {
      toast({ variant: 'success', title: 'Value deleted' });
    } else {
      const error = unitOfService.ErrorHandlerService.getErrorMessage(response);
      toast({ variant: 'destructive', title: 'Error', description: <span>{error}</span> });
    }
    closeDeleteModal(true);
  };

  const formatDate = (value?: string | null) => (value ? unitOfService.DateTimeService.convertToLocalDate(new Date(value), false) : '—');

  const isFiltered = filter.search !== '' || filter.status !== '' || filter.attributeId !== undefined;
  const showSkeleton = listQuery.isPending;

  // When the list is narrowed to one attribute every row shares it, so the header can name it.
  const scopedAttribute = filter.attributeId !== undefined ? entries[0]?.attribute : undefined;
  const description = listQuery.isPending
    ? 'The options behind each attribute, such as sizes, colours and weights'
    : scopedAttribute
      ? `${total} ${total === 1 ? 'value' : 'values'} for ${scopedAttribute.name} (${scopedAttribute.code})`
      : `${total} ${total === 1 ? 'value' : 'values'} · the options behind each attribute`;

  return (
    <div className="space-y-4">
      <ListPageHeader
        icon={ListChecks}
        title="Option Values"
        description={description}
        actions={
          <>
            {scopedAttribute && (
              <Button asChild type="button" variant="outline" className="h-9 gap-1.5">
                <Link href="/admin/master-attributes">
                  <ListChecks className="h-4 w-4" />
                  All attributes
                </Link>
              </Button>
            )}
            <Button
              type="button"
              variant={showAddPanel ? 'outline' : 'default'}
              className="h-9 gap-1.5"
              onClick={() => (showAddPanel ? addPanelRef.current?.requestClose() : setShowAddPanel(true))}
            >
              {showAddPanel ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
              {showAddPanel ? 'Close' : 'Add value'}
            </Button>
          </>
        }
      />

      <AddMasterEntryPanel ref={addPanelRef} isOpen={showAddPanel} defaultAttributeId={filter.attributeId} onClose={() => setShowAddPanel(false)} />

      <MasterEntryFilter
        value={filter}
        onChange={updateFilter}
        onReset={resetFilter}
        view={view}
        onViewChange={changeView}
        total={listQuery.isPending ? undefined : total}
        loading={listQuery.isFetching}
      />

      <Card size="sm">
        <ListPagination page={page} pageSize={pageSize} total={total} loading={listQuery.isFetching} onPageChange={setPage} onPageSizeChange={changePageSize} />
      </Card>

      {listQuery.isError ? (
        <Card className="py-16 text-center">
          <p className="text-sm font-semibold text-destructive">Could not load values</p>
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
                <ListChecks className="h-6 w-6 text-muted-foreground/40" />
                <span className="text-sm">{isFiltered ? 'No values match these filters.' : 'No values yet.'}</span>
              </div>
            }
          />
        </Card>
      ) : showSkeleton ? (
        <div className={GRID} aria-busy="true" aria-label="Loading values">
          {Array.from({ length: Math.min(pageSize, 12) }).map((_, i) => (
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
      ) : entries.length === 0 ? (
        <Card className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
          <div className="rounded-full bg-muted p-4 text-muted-foreground">
            <ListChecks className="h-7 w-7" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-semibold">{isFiltered ? 'No values match these filters' : 'No values yet'}</p>
            <p className="text-xs text-muted-foreground">
              {isFiltered ? 'Try a different search, status or attribute.' : 'Use "Add value" above to create the first one, e.g. Small, Medium, Large.'}
            </p>
          </div>
        </Card>
      ) : (
        <div className={cn(GRID, listQuery.isFetching && 'opacity-60 transition-opacity')} aria-busy={listQuery.isFetching}>
          {entries.map((entry) => (
            <EntryCard key={entry.id} entry={entry} formatDate={formatDate} onEdit={() => openEditModal(entry.id)} onDelete={() => openDeleteModal(entry.id)} />
          ))}
        </div>
      )}

      {total > pageSize && (
        <Card size="sm">
          <ListPagination page={page} pageSize={pageSize} total={total} loading={listQuery.isFetching} onPageChange={setPage} onPageSizeChange={changePageSize} />
        </Card>
      )}

      {showEditModal && editId && <ManageMasterEntry id={+editId} isOpen={showEditModal} onClose={(refresh) => closeEditModal(refresh)} />}
      {showDeleteModal && deleteId && (
        <ConfirmBox
          isOpen={showDeleteModal}
          onClose={() => closeDeleteModal(false)}
          onSubmit={() => handleDelete(+deleteId)}
          heading="Delete value"
          loading={deleteMutation.isPending}
          bodyText="Delete this value? Records already storing it keep their value, but it will no longer appear in dropdowns."
        />
      )}
    </div>
  );
}

interface EntryCardProps {
  entry: MasterEntryDto;
  formatDate: (value?: string | null) => string;
  onEdit: () => void;
  onDelete: () => void;
}

function EntryCard({ entry, formatDate, onEdit, onDelete }: EntryCardProps) {
  const isTrashed = entry.status === StatusValues.Trash;
  const swatch = entry.colorHex && HEX_COLOR.test(entry.colorHex) ? entry.colorHex : null;

  // The whole card opens the editor; the overlay buttons and the attribute link stop propagation.
  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.target !== e.currentTarget) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onEdit();
    }
  };

  return (
    <Card
      role="button"
      tabIndex={0}
      onClick={onEdit}
      onKeyDown={onKeyDown}
      aria-label={`Edit ${entry.name}`}
      className={cn(
        FLUSH_CARD,
        'group relative flex cursor-pointer flex-col border transition-all duration-200',
        'hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        isTrashed && 'opacity-70 grayscale hover:grayscale-0'
      )}
    >
      <div className="flex items-start gap-3 p-4">
        {swatch ? (
          <span className="h-11 w-11 shrink-0 rounded-lg border shadow-inner" style={{ backgroundColor: swatch }} title={swatch} />
        ) : (
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary/10 font-mono text-xs font-bold uppercase text-primary" title={entry.value}>
            {entry.value.slice(0, 3)}
          </span>
        )}

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <p className="truncate text-sm font-semibold leading-tight" title={entry.name}>
              {entry.name}
            </p>
            <Badge variant={STATUS_BADGE[entry.status] ?? 'default'} className="shrink-0 px-1.5 py-0 text-[10px]">
              {entry.status}
            </Badge>
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-muted-foreground">
            <code className="rounded bg-muted/60 px-1.5 py-0.5 font-mono font-medium">{entry.value}</code>
            {entry.attribute?.unit && <span title="Unit">{entry.attribute.unit}</span>}
            {swatch && <span className="font-mono uppercase">{swatch}</span>}
          </div>
        </div>

        <div className="absolute right-3 top-3 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100 [@media(hover:none)]:opacity-100">
          <CardAction label="Edit value" icon={Pencil} onClick={onEdit} className="hover:bg-primary hover:text-primary-foreground" />
          <CardAction label="Delete value" icon={Trash2} onClick={onDelete} className="hover:bg-destructive hover:text-destructive-foreground" />
        </div>
      </div>

      <div className="mt-auto flex items-center justify-between gap-2 border-t px-4 py-2.5 text-[11px] text-muted-foreground">
        {entry.attribute ? (
          <Link
            href={`/admin/master-entries?attributeId=${entry.attributeId}`}
            onClick={(e: MouseEvent) => e.stopPropagation()}
            className="inline-flex min-w-0 items-center gap-1 font-medium text-primary underline-offset-4 hover:underline"
            title={`Show all ${entry.attribute.name} values`}
          >
            <ListChecks className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{entry.attribute.name}</span>
            <code className="shrink-0 rounded bg-muted/60 px-1 font-mono text-[10px] uppercase text-muted-foreground">{entry.attribute.code}</code>
          </Link>
        ) : (
          <span>Attribute #{entry.attributeId}</span>
        )}
        <span className="flex shrink-0 items-center gap-2">
          <span className="rounded bg-muted px-1.5 py-0.5 font-medium tabular-nums" title="Display order">
            Order {entry.displayOrder ?? '—'}
          </span>
          <span title="Date added">{formatDate(entry.createdAt)}</span>
        </span>
      </div>
    </Card>
  );
}
