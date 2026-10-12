'use client';
import ConfirmBox from '@/components/common/confirm-box';
import ListPageHeader from '@/components/common/list-page-header';
import ListPagination from '@/components/common/list-pagination';
import ListToolbar, { SortDirection, SortOption, StatusOption } from '@/components/common/list-toolbar';
import { CustomDataTable } from '@/components/Table/data-table';
import { Card } from '@/components/ui/card';
import { toast } from '@/components/ui/use-toast';
import config from '@/config';
import { container } from '@/config/ioc';
import { TYPES } from '@/config/types';
import { useDeleteSubscriber, useGetAllSubscribers } from '@/hooks/service-hooks/useSubscriberService';
import { useCustomDataTable } from '@/hooks/use-custom-table';
import useModalShowHide from '@/hooks/use-modal-show-hide';
import { cn } from '@/lib/utils';
import IUnitOfService from '@/services/interfaces/IUnitOfService';
import { SubscriberDto, SubscriberFilterParams } from '@pms/types';
import { MailPlus } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useSubscriberColumns } from './columns';

const FLUSH_CARD = 'p-0 md:p-0';

type ActiveFilter = 'active' | 'inactive' | null;

const STATUS_OPTIONS: StatusOption<ActiveFilter>[] = [
  { label: 'All', value: null },
  { label: 'Subscribed', value: 'active', dot: 'bg-emerald-500' },
  { label: 'Unsubscribed', value: 'inactive', dot: 'bg-zinc-400' },
];

// Mirrors SORTABLE_COLUMNS in subscriber.repository.ts.
const SORT_OPTIONS: SortOption[] = [
  { value: 'createdAt', label: 'Signup date' },
  { value: 'email', label: 'Email' },
];

export default function SubscriberList() {
  const unitOfService = container.get<IUnitOfService>(TYPES.IUnitOfService);

  const [search, setSearch] = useState('');
  const [active, setActive] = useState<ActiveFilter>(null);
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortDirection, setSortDirection] = useState<SortDirection>('DESC');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(config.recordPerPage);

  const params = useMemo<SubscriberFilterParams>(
    () => ({
      search: search || undefined,
      active: active === null ? undefined : active === 'active',
      sortBy,
      sortDirection,
      page,
      recordPerPage: pageSize,
    }),
    [search, active, sortBy, sortDirection, page, pageSize]
  );

  const listQuery = useGetAllSubscribers(params);
  const deleteMutation = useDeleteSubscriber();

  const result = listQuery.data?.data?.data;
  const subscribers: SubscriberDto[] = useMemo(() => result?.data ?? [], [result]);
  const total = result?.totalRecord ?? 0;

  const { showModal: showDeleteModal, openModal: openDeleteModal, closeModal: closeDeleteModal, uniqueId: deleteId } = useModalShowHide();

  const columns = useSubscriberColumns((id) => openDeleteModal(id));
  const table = useCustomDataTable({
    columns,
    data: subscribers,
    manualFiltering: true,
    manualPagination: true,
    manualSorting: true,
    pageCount: Math.max(1, Math.ceil(total / Math.max(pageSize, 1))),
    pagination: { pageIndex: page - 1, pageSize },
    sorting: [{ id: sortBy, desc: sortDirection === 'DESC' }],
  });

  const handleDelete = async (id: number) => {
    const response = await deleteMutation.mutateAsync(id);
    if (response && response.status === 200) {
      toast({ variant: 'success', title: 'Subscriber deleted' });
    } else {
      const error = unitOfService.ErrorHandlerService.getErrorMessage(response);
      toast({ variant: 'destructive', title: 'Error', description: <span>{error}</span> });
    }
    closeDeleteModal(true);
  };

  const isFiltered = search !== '' || active !== null;

  return (
    <div className="space-y-4">
      <ListPageHeader
        icon={MailPlus}
        title="Subscribers"
        description={listQuery.isPending ? 'Newsletter signups from the storefront' : `${total} ${total === 1 ? 'subscriber' : 'subscribers'}`}
      />

      <ListToolbar<ActiveFilter>
        search={{ value: search, onChange: (value) => { setSearch(value); setPage(1); }, placeholder: 'Search email' }}
        status={{ value: active, onChange: (value) => { setActive(value); setPage(1); }, options: STATUS_OPTIONS, total: listQuery.isPending ? undefined : total, loading: listQuery.isFetching }}
        sort={{ value: sortBy, onChange: setSortBy, options: SORT_OPTIONS, direction: sortDirection, onDirectionChange: setSortDirection }}
        isFiltered={isFiltered}
        onReset={() => { setSearch(''); setActive(null); setSortBy('createdAt'); setSortDirection('DESC'); setPage(1); }}
      />

      <Card size="sm">
        <ListPagination page={page} pageSize={pageSize} total={total} loading={listQuery.isFetching} onPageChange={setPage} onPageSizeChange={(size) => { setPageSize(size); setPage(1); }} />
      </Card>

      {listQuery.isError ? (
        <Card className="py-16 text-center">
          <p className="text-sm font-semibold text-destructive">Could not load subscribers</p>
          <p className="mt-1 text-xs text-muted-foreground">Check your connection and try again.</p>
        </Card>
      ) : (
        <Card className={cn(FLUSH_CARD, 'overflow-hidden', listQuery.isFetching && !listQuery.isPending && 'opacity-60 transition-opacity')}>
          <CustomDataTable
            columns={columns}
            table={table}
            isLoading={listQuery.isPending}
            flush
            emptyMessage={
              <div className="flex flex-col items-center gap-2 py-6 text-muted-foreground">
                <MailPlus className="h-6 w-6 text-muted-foreground/40" />
                <span className="text-sm">{isFiltered ? 'No subscribers match these filters.' : 'No subscribers yet. The storefront newsletter form delivers here.'}</span>
              </div>
            }
          />
        </Card>
      )}

      {total > pageSize && (
        <Card size="sm">
          <ListPagination page={page} pageSize={pageSize} total={total} loading={listQuery.isFetching} onPageChange={setPage} onPageSizeChange={(size) => { setPageSize(size); setPage(1); }} />
        </Card>
      )}

      {showDeleteModal && deleteId && (
        <ConfirmBox
          isOpen={showDeleteModal}
          onClose={() => closeDeleteModal(false)}
          onSubmit={() => handleDelete(+deleteId)}
          heading="Delete subscriber"
          loading={deleteMutation.isPending}
          bodyText="Remove this address from the list? This cannot be undone."
        />
      )}
    </div>
  );
}
