'use client';
import { KeyboardEvent, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { ImageOff, Pencil, Plus, Tag, Trash2, X } from 'lucide-react';
import { BrandNameDto, BrandNameFilterParams, Status } from '@pms/types';
import { useDeleteBrandName, useGetAllBrandNames } from '@/hooks/service-hooks/useBrandNameService';
import useModalShowHide from '@/hooks/use-modal-show-hide';
import { container } from '@/config/ioc';
import { TYPES } from '@/config/types';
import IUnitOfService from '@/services/interfaces/IUnitOfService';
import config from '@/config';
import { StatusValues } from '@/enums/status-values.enum';
import { cn } from '@/lib/utils';
import ConfirmBox from '@/components/common/confirm-box';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/components/ui/use-toast';
import ManageBrandName from './add-edit';
import AddBrandNamePanel from './add-edit/inline-panel';
import { BrandNameFormHandle } from './add-edit/form';
import { useBrandNameColumns } from './columns';
import { useCustomDataTable } from '@/hooks/use-custom-table';
import { CustomDataTable } from '@/components/Table/data-table';
import { ListView, readStoredView, storeView } from '@/components/common/view-switch';
import BrandNameFilter, { BrandNameFilterValue, DEFAULT_BRAND_NAME_FILTER, SortDirection } from './filter';
import ListPagination from '@/components/common/list-pagination';
import CardAction from '@/components/common/card-action';
import { Button } from '@/components/ui/button';
import ListPageHeader from '@/components/common/list-page-header';

const GRID = 'grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4';

// `p-0` alone loses to the Card's own `md:p-5` in tailwind-merge (different variant), which puts a 20px inset around the image at desktop widths.
const FLUSH_CARD = 'p-0 md:p-0';

const VIEW_STORAGE_KEY = 'brand-names.view';

export default function BrandName() {
  const unitOfService = container.get<IUnitOfService>(TYPES.IUnitOfService);
  const searchParams = useSearchParams();
  // Add opens an inline panel above the search bar; Edit still uses the dialog. Cards are the
  // default view; the stored preference is applied after mount so server and first client render agree.
  const [showAddPanel, setShowAddPanel] = useState(false);
  const addPanelRef = useRef<BrandNameFormHandle>(null);
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
  const [filter, setFilter] = useState<BrandNameFilterValue>(() => ({
    search: searchParams.get('search') ?? DEFAULT_BRAND_NAME_FILTER.search,
    status: (searchParams.get('status') as Status | null) ?? DEFAULT_BRAND_NAME_FILTER.status,
    sortBy: searchParams.get('sortBy') ?? DEFAULT_BRAND_NAME_FILTER.sortBy,
    sortDirection: (searchParams.get('sortDirection')?.toUpperCase() as SortDirection) === 'ASC' ? 'ASC' : 'DESC',
    page: +(searchParams.get('page') || 1),
  }));
  const [page, setPage] = useState(() => Math.max(1, Number(searchParams.get('page')) || 1));
  const [pageSize, setPageSize] = useState(() => Number(searchParams.get('recordPerPage')) || 8 || config.recordPerPage);

  const params = useMemo<BrandNameFilterParams>(
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

  const listQuery = useGetAllBrandNames(params);
  const deleteMutation = useDeleteBrandName();

  const result = listQuery.data?.data?.data;
  const brands: BrandNameDto[] = result?.data ?? [];
  const total = result?.totalRecord ?? 0;

  const { showModal: showEditModal, openModal: openEditModal, closeModal: closeEditModal, uniqueId: editId } = useModalShowHide();
  const { showModal: showDeleteModal, openModal: openDeleteModal, closeModal: closeDeleteModal, uniqueId: deleteId } = useModalShowHide();

  // The table view reuses the column layout. Paging and sorting are already applied by the API,
  // so the table is told it is manual and simply renders the page it is given.
  const columns = useBrandNameColumns(
    (id) => openEditModal(id),
    (id) => openDeleteModal(id)
  );
  const table = useCustomDataTable({
    columns,
    data: brands,
    manualFiltering: true,
    manualPagination: true,
    manualSorting: true,
    pageCount: Math.max(1, Math.ceil(total / Math.max(pageSize, 1))),
    pagination: { pageIndex: page - 1, pageSize },
    sorting: [{ id: filter.sortBy, desc: filter.sortDirection === 'DESC' }],
  });

  // Any change to what is being listed sends the user back to page 1, otherwise a narrower result set can leave them on an empty page.
  const updateFilter = (patch: Partial<BrandNameFilterValue>) => {
    setFilter((current) => ({ ...current, ...patch }));
    setPage(1);
  };

  const resetFilter = () => {
    setFilter(DEFAULT_BRAND_NAME_FILTER);
    setPage(1);
  };

  const changePageSize = (size: number) => {
    setPageSize(size);
    setPage(1);
  };

  const handleDelete = async (id: number) => {
    const response = await deleteMutation.mutateAsync(id);
    if (response && response.status === 200) {
      toast({ variant: 'success', title: 'Brand moved to Trash' });
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
        icon={Tag}
        title="Brand Names"
        description={listQuery.isPending ? 'Manage product brands' : `${total} ${total === 1 ? 'brand' : 'brands'} in your store`}
        actions={
          <Button
            type="button"
            variant={showAddPanel ? 'outline' : 'default'}
            className="h-9 gap-1.5"
            onClick={() => (showAddPanel ? addPanelRef.current?.requestClose() : setShowAddPanel(true))}
          >
            {showAddPanel ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
            {showAddPanel ? 'Close' : 'Add brand'}
          </Button>
        }
      />

      <AddBrandNamePanel ref={addPanelRef} isOpen={showAddPanel} onClose={() => setShowAddPanel(false)} />

      <BrandNameFilter
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
          <p className="text-sm font-semibold text-destructive">Could not load brands</p>
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
                <Tag className="h-6 w-6 text-muted-foreground/40" />
                <span className="text-sm">{isFiltered ? 'No brands match these filters.' : 'No brands yet.'}</span>
              </div>
            }
          />
        </Card>
      ) : showSkeleton ? (
        <div className={GRID} aria-busy="true" aria-label="Loading brands">
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
      ) : brands.length === 0 ? (
        <Card className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
          <div className="rounded-full bg-muted p-4 text-muted-foreground">
            <Tag className="h-7 w-7" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-semibold">{isFiltered ? 'No brands match these filters' : 'No brands yet'}</p>
            <p className="text-xs text-muted-foreground">
              {isFiltered ? 'Try a different search or status.' : 'Use "Add brand" above to create the first one.'}
            </p>
          </div>
        </Card>
      ) : (
        <div className={cn(GRID, listQuery.isFetching && 'opacity-60 transition-opacity')} aria-busy={listQuery.isFetching}>
          {brands.map((brand) => (
            <BrandCard
              key={brand.id}
              brand={brand}
              onEdit={() => openEditModal(brand.id)}
              onDelete={() => openDeleteModal(brand.id)}
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

      {showEditModal && editId && <ManageBrandName id={+editId} isOpen={showEditModal} onClose={(refresh) => closeEditModal(refresh)} />}
      {showDeleteModal && deleteId && (
        <ConfirmBox
          isOpen={showDeleteModal}
          onClose={() => closeDeleteModal(false)}
          onSubmit={() => handleDelete(+deleteId)}
          heading="Delete brand"
          loading={deleteMutation.isPending}
          bodyText="Move this brand to Trash? You can find it again under the Trash filter."
        />
      )}
    </div>
  );
}

interface BrandCardProps {
  brand: BrandNameDto;
  onEdit: () => void;
  onDelete: () => void;
}

function BrandCard({ brand, onEdit, onDelete }: BrandCardProps) {
  const logo = brand.images?.[0];
  const isTrashed = brand.status === StatusValues.Trash;

  // The whole card opens the editor; the overlay buttons stop propagation so delete never falls through to edit.
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
      aria-label={`Edit ${brand.name}`}
      className={cn(
        FLUSH_CARD,
        'group relative flex cursor-pointer flex-col overflow-hidden border transition-all duration-200',
        'hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        isTrashed && 'opacity-70 grayscale hover:grayscale-0'
      )}
    >
      <div className="relative flex h-28 items-center justify-center bg-gradient-to-b from-muted/60 to-muted/20 p-4">
        {logo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={logo}
            alt=""
            loading="lazy"
            className="max-h-full max-w-[80%] object-contain drop-shadow-sm transition-transform duration-200 group-hover:scale-105"
          />
        ) : (
          <div className="flex flex-col items-center gap-1 text-muted-foreground/50">
            <ImageOff className="h-6 w-6" />
            <span className="text-[10px]">No logo</span>
          </div>
        )}
        <div className="absolute left-2 top-2 px-1.5 py-0 text-[10px] shadow-sm">
          <span className="rounded bg-muted px-1.5 py-0.5 font-medium tabular-nums" title="Display order">
            Order {brand.displayOrder ?? '—'}
          </span>
        </div>

        {/* <Badge variant={STATUS_BADGE[brand.status] ?? 'default'} className="absolute left-2 top-2 px-1.5 py-0 text-[10px] shadow-sm">
          {brand.status}
        </Badge> */}

        <div className="absolute right-2 top-2 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100 [@media(hover:none)]:opacity-100">
          <CardAction label="Edit brand" icon={Pencil} onClick={onEdit} className="hover:bg-primary hover:text-primary-foreground" />
          <CardAction label="Delete brand" icon={Trash2} onClick={onDelete} className="hover:bg-destructive hover:text-destructive-foreground" />
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-1.5 border-t px-3 py-2.5">
        <p className="truncate text-sm font-semibold leading-tight text-center" title={brand.name}>
          {brand.name}
        </p>
        {/* <div className="flex items-center justify-between gap-2 text-[11px] text-muted-foreground">
          <span className="rounded bg-muted px-1.5 py-0.5 font-medium tabular-nums" title="Display order">
            Order {brand.displayOrder ?? '—'}
          </span>
          <span className="truncate" title="Date added">
            {formatDate(brand.createdAt)}
          </span>
        </div> */}
      </div>
    </Card>
  );
}
