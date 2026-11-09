'use client';
import ListPageHeader from '@/components/common/list-page-header';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from '@/components/ui/use-toast';
import { container } from '@/config/ioc';
import { TYPES } from '@/config/types';
import { useBackfillJournal } from '@/hooks/service-hooks/useJournalEntryService';
import IUnitOfService from '@/services/interfaces/IUnitOfService';
import { JournalEntryDto, POSTING_SOURCE_LABELS, PostingSourceType, PostingSourceTypeEnum, VOUCHER_TYPE_LABELS } from '@pms/types';
import { format } from 'date-fns';
import { BookText, Download, History } from 'lucide-react';
import { useCallback, useState } from 'react';
import DayBookList from './index';

const BACKFILL_ORDER: PostingSourceType[] = [
  PostingSourceTypeEnum.Order,
  PostingSourceTypeEnum.Payment,
  PostingSourceTypeEnum.Purchase,
  PostingSourceTypeEnum.OrderReturn,
];

const csvCell = (value: string | number) => {
  const text = String(value ?? '');
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};

export default function DayBookListingWrapper() {
  const unitOfService = container.get<IUnitOfService>(TYPES.IUnitOfService);
  const [total, setTotal] = useState<number>();
  const [rows, setRows] = useState<JournalEntryDto[]>([]);
  const backfill = useBackfillJournal();

  const onRowsChange = useCallback((next: JournalEntryDto[]) => setRows(next), []);

  const exportCsv = () => {
    if (rows.length === 0) {
      toast({ variant: 'destructive', title: 'Nothing to export', description: <span>There are no vouchers on this page.</span> });
      return;
    }

    const header = ['Date', 'Voucher', 'Type', 'Reference', 'Narration', 'Account', 'Debit', 'Credit'];
    const lines = [header.join(',')];
    for (const entry of rows) {
      for (const entryLine of entry.lines) {
        lines.push(
          [
            format(new Date(entry.entryDate), 'yyyy-MM-dd'),
            entry.voucherNumber,
            VOUCHER_TYPE_LABELS[entry.voucherType],
            entry.referenceNumber ?? '',
            entry.narration ?? '',
            `${entryLine.accountCode} ${entryLine.accountName}`,
            entryLine.debit || '',
            entryLine.credit || '',
          ]
            .map(csvCell)
            .join(',')
        );
      }
    }

    // A BOM so Excel opens the rupee amounts and names as UTF-8 rather than mangling them.
    const blob = new Blob(['﻿' + lines.join('\r\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `day-book-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  /**
   * Walks each document type forward in batches until the API says there is no more. The
   * endpoint posts one document per transaction and skips anything already posted, so this is
   * safe to run more than once.
   */
  const runBackfill = async () => {
    let posted = 0;
    let failed = 0;

    for (const sourceType of BACKFILL_ORDER) {
      let afterId = 0;
      let hasMore = true;

      while (hasMore) {
        let response;
        try {
          response = await backfill.mutateAsync({ sourceType, afterId, limit: 100 });
        } catch (error) {
          const message = unitOfService.ErrorHandlerService.getErrorMessage(error as never);
          toast({ variant: 'destructive', title: `Backfill stopped on ${POSTING_SOURCE_LABELS[sourceType]}`, description: <span>{message}</span> });
          return;
        }

        const result = response?.data?.data;
        if (!result) break;

        posted += result.posted;
        failed += result.failed;
        hasMore = result.hasMore;
        afterId = result.lastId ?? afterId;
        if (result.lastId == null) break;
      }
    }

    toast({
      variant: failed > 0 ? 'destructive' : 'success',
      title: `Backfill finished: ${posted} posted`,
      description: failed > 0 ? <span>{failed} could not be posted; check the server log.</span> : undefined,
    });
  };

  return (
    <div className="mx-auto w-full max-w-7xl space-y-4">
      <ListPageHeader
        icon={BookText}
        title="Day Book"
        description={
          total === undefined
            ? 'Every posted voucher, newest first.'
            : `${total} voucher${total === 1 ? ' matches' : 's match'} the current filters.`
        }
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" onClick={exportCsv}>
              <Download className="mr-2 h-4 w-4" />
              Export CSV
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" loading={backfill.isPending}>
                  <History className="mr-2 h-4 w-4" />
                  Backfill
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-72">
                <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
                  Posts sales, receipts, purchases and returns that pre-date automatic posting. Already-posted documents are skipped, so this is safe
                  to run again.
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={() => void runBackfill()}>Post all earlier records</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        }
      />
      <DayBookList onCountChange={setTotal} onRowsChange={onRowsChange} />
    </div>
  );
}
