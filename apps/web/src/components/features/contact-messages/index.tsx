'use client';
import ConfirmBox from '@/components/common/confirm-box';
import ListPageHeader from '@/components/common/list-page-header';
import ListPagination from '@/components/common/list-pagination';
import { CustomDataTable } from '@/components/Table/data-table';
import { Card } from '@/components/ui/card';
import { toast } from '@/components/ui/use-toast';
import config from '@/config';
import { container } from '@/config/ioc';
import { TYPES } from '@/config/types';
import { useDeleteContactMessage, useGetAllContactMessages } from '@/hooks/service-hooks/useContactMessageService';
import { useCustomDataTable } from '@/hooks/use-custom-table';
import useModalShowHide from '@/hooks/use-modal-show-hide';
import { cn } from '@/lib/utils';
import IUnitOfService from '@/services/interfaces/IUnitOfService';
import { ContactMessageDto, ContactMessageFilterParams } from '@pms/types';
import { Inbox } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useContactMessageColumns } from './columns';
import ContactMessageFilter, { ContactMessageFilterValue, DEFAULT_CONTACT_MESSAGE_FILTER } from './filter';
import ViewContactMessage from './view';

// `p-0` alone loses to the Card's own `md:p-5` in tailwind-merge (different variant).
const FLUSH_CARD = 'p-0 md:p-0';

export default function ContactMessageList() {
  const unitOfService = container.get<IUnitOfService>(TYPES.IUnitOfService);

  const [filter, setFilter] = useState<ContactMessageFilterValue>(DEFAULT_CONTACT_MESSAGE_FILTER);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(config.recordPerPage);

  const params = useMemo<ContactMessageFilterParams>(
    () => ({
      search: filter.search || undefined,
      status: filter.status ?? undefined,
      sortBy: filter.sortBy,
      sortDirection: filter.sortDirection,
      page,
      recordPerPage: pageSize,
    }),
    [filter, page, pageSize]
  );

  const listQuery = useGetAllContactMessages(params);
  const deleteMutation = useDeleteContactMessage();

  const result = listQuery.data?.data?.data;
  const messages: ContactMessageDto[] = useMemo(() => result?.data ?? [], [result]);
  const total = result?.totalRecord ?? 0;

  const { showModal: showViewModal, openModal: openViewModal, closeModal: closeViewModal, uniqueId: viewId } = useModalShowHide();
  const { showModal: showDeleteModal, openModal: openDeleteModal, closeModal: closeDeleteModal, uniqueId: deleteId } = useModalShowHide();

  const columns = useContactMessageColumns((id) => openViewModal(id), (id) => openDeleteModal(id));
  const table = useCustomDataTable({
    columns,
    data: messages,
    manualFiltering: true,
    manualPagination: true,
    manualSorting: true,
    pageCount: Math.max(1, Math.ceil(total / Math.max(pageSize, 1))),
    pagination: { pageIndex: page - 1, pageSize },
    sorting: [{ id: filter.sortBy, desc: filter.sortDirection === 'DESC' }],
  });

  const updateFilter = (patch: Partial<ContactMessageFilterValue>) => {
    setFilter((current) => ({ ...current, ...patch }));
    setPage(1);
  };

  const resetFilter = () => {
    setFilter(DEFAULT_CONTACT_MESSAGE_FILTER);
    setPage(1);
  };

  const changePageSize = (size: number) => {
    setPageSize(size);
    setPage(1);
  };

  const handleDelete = async (id: number) => {
    const response = await deleteMutation.mutateAsync(id);
    if (response && response.status === 200) {
      toast({ variant: 'success', title: 'Message deleted' });
    } else {
      const error = unitOfService.ErrorHandlerService.getErrorMessage(response);
      toast({ variant: 'destructive', title: 'Error', description: <span>{error}</span> });
    }
    closeDeleteModal(true);
  };

  const isFiltered = filter.search !== '' || filter.status !== null;

  return (
    <div className="space-y-4">
      <ListPageHeader
        icon={Inbox}
        title="Contact Messages"
        description={listQuery.isPending ? 'Messages from the storefront contact form' : `${total} ${total === 1 ? 'message' : 'messages'}`}
      />

      <ContactMessageFilter value={filter} onChange={updateFilter} onReset={resetFilter} total={listQuery.isPending ? undefined : total} loading={listQuery.isFetching} />

      <Card size="sm">
        <ListPagination page={page} pageSize={pageSize} total={total} loading={listQuery.isFetching} onPageChange={setPage} onPageSizeChange={changePageSize} />
      </Card>

      {listQuery.isError ? (
        <Card className="py-16 text-center">
          <p className="text-sm font-semibold text-destructive">Could not load messages</p>
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
                <Inbox className="h-6 w-6 text-muted-foreground/40" />
                <span className="text-sm">{isFiltered ? 'No messages match these filters.' : 'No messages yet. The storefront contact form delivers here.'}</span>
              </div>
            }
          />
        </Card>
      )}

      {total > pageSize && (
        <Card size="sm">
          <ListPagination page={page} pageSize={pageSize} total={total} loading={listQuery.isFetching} onPageChange={setPage} onPageSizeChange={changePageSize} />
        </Card>
      )}

      {showViewModal && viewId && <ViewContactMessage id={+viewId} isOpen={showViewModal} onClose={() => closeViewModal(true)} />}
      {showDeleteModal && deleteId && (
        <ConfirmBox
          isOpen={showDeleteModal}
          onClose={() => closeDeleteModal(false)}
          onSubmit={() => handleDelete(+deleteId)}
          heading="Delete message"
          loading={deleteMutation.isPending}
          bodyText="Delete this message? This cannot be undone."
        />
      )}
    </div>
  );
}
