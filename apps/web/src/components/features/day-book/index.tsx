'use client';
import ListPagination from '@/components/common/list-pagination';
import { CustomDataTable } from '@/components/Table/data-table';
import { Card } from '@/components/ui/card';
import config from '@/config';
import { useGetAllJournalEntries, useGetDayBookSummary } from '@/hooks/service-hooks/useJournalEntryService';
import { useCustomDataTable } from '@/hooks/use-custom-table';
import useModalShowHide from '@/hooks/use-modal-show-hide';
import { cn } from '@/lib/utils';
import { JournalEntryDto, JournalEntryFilterParams, VoucherType } from '@pms/types';
import { NotebookPen } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useDayBookColumns } from './columns';
import DayBookFilter, { DayBookFilterValue, DEFAULT_DAY_BOOK_FILTER } from './filter';
import DayBookSummaryCards from './summary-cards';
import VoucherDialog from './voucher-dialog';

const FLUSH_CARD = 'p-0 md:p-0';

const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0).toISOString();
const endOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999).toISOString();

interface DayBookListProps {
  onCountChange?: (total: number) => void;
  onRowsChange?: (rows: JournalEntryDto[]) => void;
}

export default function DayBookList({ onCountChange, onRowsChange }: DayBookListProps) {
  const [filter, setFilter] = useState<DayBookFilterValue>(DEFAULT_DAY_BOOK_FILTER);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(config.recordPerPage);

  // The listing and the totals share these filters, so the figures always describe the rows
  // on screen. Paging is deliberately left out of the summary params - totals are for the
  // whole range, not the current page.
  const baseParams = useMemo(
    () => ({
      search: filter.search || undefined,
      voucherType: (filter.voucherType ?? undefined) as VoucherType | undefined,
      startDate: filter.dateRange?.from ? startOfDay(filter.dateRange.from) : undefined,
      endDate: filter.dateRange?.to ? endOfDay(filter.dateRange.to) : undefined,
    }),
    [filter.search, filter.voucherType, filter.dateRange]
  );

  const params = useMemo<JournalEntryFilterParams>(
    () => ({
      ...baseParams,
      sortBy: filter.sortBy,
      sortDirection: filter.sortDirection,
      page,
      recordPerPage: pageSize,
    }),
    [baseParams, filter.sortBy, filter.sortDirection, page, pageSize]
  );

  const listQuery = useGetAllJournalEntries(params);
  const summaryQuery = useGetDayBookSummary(baseParams);

  const result = listQuery.data?.data?.data;
  const entries: JournalEntryDto[] = useMemo(() => result?.data ?? [], [result]);
  const total = result?.totalRecord ?? 0;
  const summary = summaryQuery.data?.data?.data;

  useEffect(() => {
    onCountChange?.(total);
  }, [total, onCountChange]);

  useEffect(() => {
    onRowsChange?.(entries);
  }, [entries, onRowsChange]);

  const { showModal, openModal, closeModal, uniqueId } = useModalShowHide();
  const openView = useCallback((id: number) => openModal(id), [openModal]);

  const columns = useDayBookColumns(openView);
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

  const updateFilter = (patch: Partial<DayBookFilterValue>) => {
    setFilter((current) => ({ ...current, ...patch }));
    setPage(1);
  };

  const resetFilter = () => {
    setFilter(DEFAULT_DAY_BOOK_FILTER);
    setPage(1);
  };

  const changePageSize = (size: number) => {
    setPageSize(size);
    setPage(1);
  };

  const isFiltered = filter.search !== '' || filter.voucherType !== null || !!filter.dateRange;

  return (
    <div className="space-y-4">
      <DayBookSummaryCards summary={summary} loading={summaryQuery.isFetching} />

      <DayBookFilter
        value={filter}
        onChange={updateFilter}
        onReset={resetFilter}
        total={listQuery.isPending ? undefined : total}
        loading={listQuery.isFetching}
      />

      {listQuery.isError ? (
        <Card className="py-16 text-center">
          <p className="text-sm font-semibold text-destructive">Could not load the day book</p>
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
                <NotebookPen className="h-6 w-6 text-muted-foreground/40" />
                <span className="text-sm">
                  {isFiltered
                    ? 'No vouchers match these filters.'
                    : 'Nothing posted yet. Sales, purchases and receipts post here automatically; use Backfill to bring in earlier records.'}
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

      {showModal && uniqueId && <VoucherDialog id={+uniqueId} isOpen={showModal} onClose={() => closeModal(false)} />}
    </div>
  );
}
