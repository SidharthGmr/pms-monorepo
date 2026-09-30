'use client';
import { KeyboardEvent, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { ImageOff, Pencil, Tag, Trash2 } from 'lucide-react';
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
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/components/ui/use-toast';
import ManageBrandName from './add-edit';
import BrandNameFilter, { BrandNameFilterValue, DEFAULT_BRAND_NAME_FILTER, SortDirection } from './filter';
import ListPagination from '@/components/common/list-pagination';
import CardAction from '@/components/common/card-action';
import { PageHeader } from '@/components/common/page-header';

const STATUS_BADGE: Record<Status, 'green' | 'orange' | 'destructive'> = {
  [StatusValues.Published]: 'green',
  [StatusValues.Draft]: 'orange',
  [StatusValues.Trash]: 'destructive',
};

const GRID = 'grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4';

// `p-0` alone loses to the Card's own `md:p-5` in tailwind-merge (different variant), which puts a 20px inset around the image at desktop widths.
const FLUSH_CARD = 'p-0 md:p-0';

export default function BrandName() {
  const unitOfService = container.get<IUnitOfService>(TYPES.IUnitOfService);
  const searchParams = useSearchParams();
  const [showAddModal, setShowAddModal] = useState(false);
  // The URL seeds the first render so a shared link opens on the same view; after that the page owns the state.
  const [filter, setFilter] = useState<BrandNameFilterValue>(() => ({
    search: searchParams.get('search') ?? DEFAULT_BRAND_NAME_FILTER.search,
    status: (searchParams.get('status') as Status | null) ?? DEFAULT_BRAND_NAME_FILTER.status,
    sortBy: searchParams.get('sortBy') ?? DEFAULT_BRAND_NAME_FILTER.sortBy,
    sortDirection: (searchParams.get('sortDirection')?.toUpperCase() as SortDirection) === 'ASC' ? 'ASC' : 'DESC',
  }));
  const [page, setPage] = useState(() => Math.max(1, Number(searchParams.get('page')) || 1));
  const [pageSize, setPageSize] = useState(() => Number(searchParams.get('recordPerPage')) || config.recordPerPage);

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

  const formatDate = (value: BrandNameDto['createdAt']) => (value ? unitOfService.DateTimeService.convertToLocalDate(new Date(value), false) : '—');

  const isFiltered = filter.search !== '' || filter.status !== null;
  const showSkeleton = listQuery.isPending;

  return (
    <div className="space-y-4">
      <Card className="space-y-4">
        <PageHeader
          title="Brand Names"
          description={listQuery.isPending ? 'Manage product brands' : `${total} ${total === 1 ? 'brand' : 'brands'} in your store`}
          variant="add"
          actionText="Add New Brand"
          onClick={() => setShowAddModal(true)}
        />
        <Separator />
        <BrandNameFilter
          value={filter}
          onChange={updateFilter}
          onReset={resetFilter}
          total={listQuery.isPending ? undefined : total}
          loading={listQuery.isFetching}
        />
      </Card>

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
              {isFiltered ? 'Try a different search or status.' : 'Use "Add New Brand" above to create the first one.'}
            </p>
          </div>
        </Card>
      ) : (
        <div className={cn(GRID, listQuery.isFetching && 'opacity-60 transition-opacity')} aria-busy={listQuery.isFetching}>
          {brands.map((brand) => (
            <BrandCard
              key={brand.id}
              brand={brand}
              formatDate={formatDate}
              onEdit={() => openEditModal(brand.id)}
              onDelete={() => openDeleteModal(brand.id)}
            />
          ))}
        </div>
      )}

      {total > pageSize && (
        <Card size="sm">
          <ListPagination page={page} pageSize={pageSize} total={total} loading={listQuery.isFetching} onPageChange={setPage} onPageSizeChange={changePageSize} />
        </Card>
      )}

      {showEditModal && editId && <ManageBrandName id={+editId} isOpen={showEditModal} onClose={(refresh) => closeEditModal(refresh)} />}
      {showAddModal && <ManageBrandName isOpen={showAddModal} onClose={() => setShowAddModal(false)} />}
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
  formatDate: (value: BrandNameDto['createdAt']) => string;
  onEdit: () => void;
  onDelete: () => void;
}

function BrandCard({ brand, formatDate, onEdit, onDelete }: BrandCardProps) {
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
          <img src={logo} alt="" loading="lazy" className="max-h-full max-w-[80%] object-contain drop-shadow-sm transition-transform duration-200 group-hover:scale-105" />
        ) : (
          <div className="flex flex-col items-center gap-1 text-muted-foreground/50">
            <ImageOff className="h-6 w-6" />
            <span className="text-[10px]">No logo</span>
          </div>
        )}

        <Badge variant={STATUS_BADGE[brand.status] ?? 'default'} className="absolute left-2 top-2 px-1.5 py-0 text-[10px] shadow-sm">
          {brand.status}
        </Badge>

        {/* Hidden until the card is hovered or focused; always visible where there is no pointer to hover with. */}
        <div className="absolute right-2 top-2 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100 [@media(hover:none)]:opacity-100">
          <CardAction label="Edit brand" icon={Pencil} onClick={onEdit} className="hover:bg-primary hover:text-primary-foreground" />
          <CardAction label="Delete brand" icon={Trash2} onClick={onDelete} className="hover:bg-destructive hover:text-destructive-foreground" />
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-1.5 border-t px-3 py-2.5">
        <p className="truncate text-sm font-semibold leading-tight" title={brand.name}>
          {brand.name}
        </p>
        <div className="flex items-center justify-between gap-2 text-[11px] text-muted-foreground">
          <span className="rounded bg-muted px-1.5 py-0.5 font-medium tabular-nums" title="Display order">
            Order {brand.displayOrder ?? '—'}
          </span>
          <span className="truncate" title="Date added">
            {formatDate(brand.createdAt)}
          </span>
        </div>
      </div>
    </Card>
  );
}
