'use client';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useGetJournalEntryById } from '@/hooks/service-hooks/useJournalEntryService';
import { formatPrice } from '@/lib/format-price';
import { JournalStatusEnum, PARTY_TYPE_LABELS, VOUCHER_TYPE_LABELS } from '@pms/types';
import { format } from 'date-fns';
import { NotebookPen } from 'lucide-react';
import { VOUCHER_TONE } from './columns';

interface VoucherDialogProps {
  id: number;
  isOpen: boolean;
  onClose: () => void;
}

export default function VoucherDialog({ id, isOpen, onClose }: VoucherDialogProps) {
  const query = useGetJournalEntryById(id, isOpen);
  const entry = query.data?.data?.data;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="flex max-h-[90vh] flex-col gap-0 p-0 sm:max-w-2xl">
        <DialogHeader className="space-y-0 border-b bg-muted/30 px-6 py-4 text-left">
          <div className="flex items-center gap-3 pr-8">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <NotebookPen className="h-4 w-4" />
            </span>
            <div className="min-w-0 flex-1">
              <DialogTitle className="truncate text-base">{entry ? entry.voucherNumber : 'Voucher'}</DialogTitle>
              <DialogDescription className="mt-1 text-xs">
                {entry ? `${VOUCHER_TYPE_LABELS[entry.voucherType]} · ${format(new Date(entry.entryDate), 'd MMM yyyy')}` : 'Loading…'}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
          {query.isLoading ? (
            <div className="space-y-3" aria-busy="true" aria-label="Loading voucher">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-24 w-full" />
            </div>
          ) : query.isError || !entry ? (
            <div className="py-10 text-center">
              <p className="text-sm font-semibold text-destructive">Could not load this voucher</p>
              <p className="mt-1 text-xs text-muted-foreground">Close and try again.</p>
            </div>
          ) : (
            <div className="space-y-5">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline" className={VOUCHER_TONE[entry.voucherType]}>
                  {VOUCHER_TYPE_LABELS[entry.voucherType]}
                </Badge>
                {entry.status === JournalStatusEnum.Reversed && <Badge variant="outline">Reversed</Badge>}
                {entry.reversesVoucherNumber && <Badge variant="outline">Reverses {entry.reversesVoucherNumber}</Badge>}
                {entry.reversedByVoucherNumber && <Badge variant="outline">Reversed by {entry.reversedByVoucherNumber}</Badge>}
                {entry.isOpening && <Badge variant="outline">Opening</Badge>}
              </div>

              {(entry.narration || entry.referenceNumber) && (
                <div className="rounded-lg border bg-muted/20 px-4 py-3">
                  {entry.narration && <p className="text-sm">{entry.narration}</p>}
                  {entry.referenceNumber && <p className="mt-1 text-xs text-muted-foreground">Reference: {entry.referenceNumber}</p>}
                </div>
              )}

              <div className="overflow-hidden rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-[11px] uppercase tracking-wider">Account</TableHead>
                      <TableHead className="text-right text-[11px] uppercase tracking-wider">Debit</TableHead>
                      <TableHead className="text-right text-[11px] uppercase tracking-wider">Credit</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {entry.lines.map((entryLine) => (
                      <TableRow key={entryLine.id}>
                        <TableCell>
                          <p className="text-sm font-medium">{entryLine.accountName}</p>
                          <p className="text-[11px] text-muted-foreground">
                            {entryLine.accountCode}
                            {entryLine.partyType ? ` · ${PARTY_TYPE_LABELS[entryLine.partyType]}` : ''}
                          </p>
                          {entryLine.narration && <p className="mt-0.5 text-[11px] text-muted-foreground">{entryLine.narration}</p>}
                        </TableCell>
                        <TableCell className="text-right text-sm tabular-nums">{entryLine.debit > 0 ? formatPrice(entryLine.debit) : '—'}</TableCell>
                        <TableCell className="text-right text-sm tabular-nums">{entryLine.credit > 0 ? formatPrice(entryLine.credit) : '—'}</TableCell>
                      </TableRow>
                    ))}
                    <TableRow className="border-t-2 bg-muted/30 font-semibold">
                      <TableCell className="text-sm">Total</TableCell>
                      <TableCell className="text-right text-sm tabular-nums">{formatPrice(entry.totalDebit)}</TableCell>
                      <TableCell className="text-right text-sm tabular-nums">{formatPrice(entry.totalCredit)}</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>

              <p className="text-[11px] text-muted-foreground">
                Posted by {entry.createdByName ?? entry.createdById} on {format(new Date(entry.createdAt), 'd MMM yyyy, h:mm a')}
                {entry.sourceType ? ` · from ${entry.sourceType} #${entry.sourceId}` : ''}
              </p>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 border-t bg-muted/30 px-6 py-3">
          <Button type="button" variant="outline" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
