'use client';
import ConfirmBox from '@/components/common/confirm-box';
import ListPagination from '@/components/common/list-pagination';
import { CustomDataTable } from '@/components/Table/data-table';
import { Card } from '@/components/ui/card';
import { toast } from '@/components/ui/use-toast';
import config from '@/config';
import { container } from '@/config/ioc';
import { TYPES } from '@/config/types';
import { useDeleteLedgerAccount, useGetAllLedgerAccounts } from '@/hooks/service-hooks/useLedgerAccountService';
import { useCustomDataTable } from '@/hooks/use-custom-table';
import useModalShowHide from '@/hooks/use-modal-show-hide';
import { cn } from '@/lib/utils';
import IUnitOfService from '@/services/interfaces/IUnitOfService';
import { AccountCategory, LedgerAccountDto, LedgerAccountFilterParams } from '@pms/types';
import { BookOpen } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import ManageLedgerAccount from './add-edit';
import { useLedgerAccountColumns } from './columns';
import LedgerAccountListFilter, { DEFAULT_LEDGER_ACCOUNT_FILTER, LedgerAccountFilterValue } from './filter';

const FLUSH_CARD = 'p-0 md:p-0';

interface LedgerAccountListProps {
  onCountChange?: (total: number) => void;
  addToken?: number;
}

export default function LedgerAccountList({ onCountChange, addToken }: LedgerAccountListProps) {
  const unitOfService = container.get<IUnitOfService>(TYPES.IUnitOfService);

  const [filter, setFilter] = useState<LedgerAccountFilterValue>(DEFAULT_LEDGER_ACCOUNT_FILTER);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(config.recordPerPage);

  const params = useMemo<LedgerAccountFilterParams>(
    () => ({
      search: filter.search || undefined,
      category: filter.category ?? undefined,
      sortBy: filter.sortBy,
      sortDirection: filter.sortDirection,
      page,
      recordPerPage: pageSize,
    }),
    [filter, page, pageSize]
  );

  const listQuery = useGetAllLedgerAccounts(params);
  const deleteMutation = useDeleteLedgerAccount();

  const result = listQuery.data?.data?.data;
  const accounts: LedgerAccountDto[] = useMemo(() => result?.data ?? [], [result]);
  const total = result?.totalRecord ?? 0;

  useEffect(() => {
    onCountChange?.(total);
  }, [total, onCountChange]);

  const { showModal: showManageModal, openModal: openManageModal, closeModal: closeManageModal, uniqueId: manageId } = useModalShowHide();
  const { showModal: showDeleteModal, openModal: openDeleteModal, closeModal: closeDeleteModal, uniqueId: deleteId } = useModalShowHide();

  // The page header owns the "New account" button, so it bumps a token rather than reaching
  // into this component's modal state.
  useEffect(() => {
    if (addToken) openManageModal(0);
  }, [addToken, openManageModal]);

  const openEdit = useCallback((id: number) => openManageModal(id), [openManageModal]);
  const openDelete = useCallback((id: number) => openDeleteModal(id), [openDeleteModal]);

  const columns = useLedgerAccountColumns(openEdit, openDelete);
  const table = useCustomDataTable({
    columns,
    data: accounts,
    manualFiltering: true,
    manualPagination: true,
    manualSorting: true,
    pageCount: Math.max(1, Math.ceil(total / Math.max(pageSize, 1))),
    pagination: { pageIndex: page - 1, pageSize },
    sorting: [{ id: filter.sortBy, desc: filter.sortDirection === 'DESC' }],
  });

  const updateFilter = (patch: Partial<LedgerAccountFilterValue>) => {
    setFilter((current) => ({ ...current, ...patch }));
    setPage(1);
  };

  const resetFilter = () => {
    setFilter(DEFAULT_LEDGER_ACCOUNT_FILTER);
    setPage(1);
  };

  const changePageSize = (size: number) => {
    setPageSize(size);
    setPage(1);
  };

  const handleDelete = async (id: number) => {
    const response = await deleteMutation.mutateAsync(id);
    if (response && response.status === 200) {
      toast({ variant: 'success', title: 'Account deleted successfully' });
    } else {
      const error = unitOfService.ErrorHandlerService.getErrorMessage(response);
      toast({ variant: 'destructive', title: 'Could not delete', description: <span>{error}</span> });
    }
    closeDeleteModal(true);
  };

  const isFiltered = filter.search !== '' || filter.category !== null;
  const categoryLabel = (filter.category ?? '') as AccountCategory | '';

  return (
    <div className="space-y-4">
      <LedgerAccountListFilter
        value={filter}
        onChange={updateFilter}
        onReset={resetFilter}
        total={listQuery.isPending ? undefined : total}
        loading={listQuery.isFetching}
      />

      {listQuery.isError ? (
        <Card className="py-16 text-center">
          <p className="text-sm font-semibold text-destructive">Could not load the chart of accounts</p>
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
                <BookOpen className="h-6 w-6 text-muted-foreground/40" />
                <span className="text-sm">
                  {isFiltered
                    ? `No ${categoryLabel ? categoryLabel.toLowerCase() : ''} accounts match these filters.`
                    : 'No accounts yet. Use "Set up chart of accounts" above to create the standard set.'}
                </span>
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

      {showManageModal && (
        <ManageLedgerAccount
          id={manageId ? +manageId : undefined}
          isOpen={showManageModal}
          onClose={(refresh) => closeManageModal(refresh)}
        />
      )}

      {showDeleteModal && deleteId && (
        <ConfirmBox
          isOpen={showDeleteModal}
          onClose={() => closeDeleteModal(false)}
          onSubmit={() => handleDelete(+deleteId)}
          heading="Delete account"
          loading={deleteMutation.isPending}
          bodyText="Delete this account? An account that already has postings or children cannot be deleted."
        />
      )}
    </div>
  );
}
