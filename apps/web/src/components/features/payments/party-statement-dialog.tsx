'use client';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useGetPartyStatement } from '@/hooks/service-hooks/usePaymentService';
import { formatPrice } from '@/lib/format-price';
import { cn } from '@/lib/utils';
import { PartyType, PartyTypeEnum, VOUCHER_TYPE_LABELS } from '@pms/types';
import { format } from 'date-fns';
import { BookUser } from 'lucide-react';
import { useMemo } from 'react';

interface PartyStatementDialogProps {
  partyType: PartyType;
  partyId: string;
  partyName?: string | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function PartyStatementDialog({ partyType, partyId, partyName, isOpen, onClose }: PartyStatementDialogProps) {
  const params = useMemo(() => ({ partyType, partyId }), [partyType, partyId]);
  const query = useGetPartyStatement(params, isOpen);
  const statement = query.data?.data?.data;

  const isCustomer = partyType === PartyTypeEnum.Customer;
  const owesUs = (statement?.closingBalance ?? 0) > 0;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="flex max-h-[90vh] flex-col gap-0 p-0 sm:max-w-3xl">
        <DialogHeader className="space-y-0 border-b bg-muted/30 px-6 py-4 text-left">
          <div className="flex items-center gap-3 pr-8">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <BookUser className="h-4 w-4" />
            </span>
            <div className="min-w-0 flex-1">
              <DialogTitle className="truncate text-base">{statement?.partyName ?? partyName ?? 'Party statement'}</DialogTitle>
              <DialogDescription className="mt-1 text-xs">
                {isCustomer ? 'Customer ledger' : 'Supplier ledger'} — every sale, bill, receipt and payment, with the running balance.
              </DialogDescription>
            </div>
            {statement && (
              <Badge
                variant="outline"
                className={cn(
                  'shrink-0 gap-1 text-xs',
                  statement.closingBalance === 0
                    ? 'text-muted-foreground'
                    : owesUs === isCustomer
                      ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300'
                      : 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-300'
                )}
              >
                {statement.closingBalance === 0
                  ? 'Settled'
                  : statement.closingBalance > 0
                    ? `${isCustomer ? 'Owes us' : 'We owe'} ${formatPrice(statement.closingBalance)}`
                    : `${isCustomer ? 'We owe them' : 'They owe us'} ${formatPrice(Math.abs(statement.closingBalance))}`}
              </Badge>
            )}
          </div>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-y-auto">
          {query.isPending && (
            <div className="space-y-3 p-6">
              <Skeleton className="h-5 w-48" />
              <Skeleton className="h-40 w-full" />
            </div>
          )}

          {query.isError && <p className="py-16 text-center text-sm font-semibold text-destructive">Could not load the statement</p>}

          {statement && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-6 text-[11px] uppercase tracking-wider">Date</TableHead>
                  <TableHead className="text-[11px] uppercase tracking-wider">Voucher</TableHead>
                  <TableHead className="text-right text-[11px] uppercase tracking-wider">Debit</TableHead>
                  <TableHead className="text-right text-[11px] uppercase tracking-wider">Credit</TableHead>
                  <TableHead className="pr-6 text-right text-[11px] uppercase tracking-wider">Balance</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow className="bg-muted/20 text-xs text-muted-foreground">
                  <TableCell colSpan={4} className="pl-6">
                    Opening balance
                  </TableCell>
                  <TableCell className="pr-6 text-right tabular-nums">{formatPrice(statement.openingBalance)}</TableCell>
                </TableRow>

                {statement.rows.map((row) => (
                  <TableRow key={row.lineId}>
                    <TableCell className="pl-6 align-top text-xs tabular-nums">{format(new Date(row.entryDate), 'd MMM yyyy')}</TableCell>
                    <TableCell className="align-top">
                      <p className="text-sm font-medium">{row.voucherNumber}</p>
                      <p className="max-w-[260px] truncate text-[11px] text-muted-foreground">
                        {[VOUCHER_TYPE_LABELS[row.voucherType], row.accountName, row.narration].filter(Boolean).join(' · ')}
                      </p>
                    </TableCell>
                    <TableCell className="align-top text-right text-sm tabular-nums">{row.debit > 0 ? formatPrice(row.debit) : '—'}</TableCell>
                    <TableCell className="align-top text-right text-sm tabular-nums">{row.credit > 0 ? formatPrice(row.credit) : '—'}</TableCell>
                    <TableCell className={cn('pr-6 align-top text-right text-sm tabular-nums', row.balance < 0 && 'text-amber-600 dark:text-amber-400')}>
                      {formatPrice(row.balance)}
                    </TableCell>
                  </TableRow>
                ))}

                {statement.rows.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="py-10 text-center text-sm text-muted-foreground">
                      Nothing posted for this {isCustomer ? 'customer' : 'supplier'} yet.
                    </TableCell>
                  </TableRow>
                )}

                <TableRow className="border-t-2 bg-muted/30 font-semibold">
                  <TableCell colSpan={2} className="pl-6 text-sm">
                    Closing balance
                  </TableCell>
                  <TableCell className="text-right text-sm tabular-nums">{formatPrice(statement.totalDebit)}</TableCell>
                  <TableCell className="text-right text-sm tabular-nums">{formatPrice(statement.totalCredit)}</TableCell>
                  <TableCell className="pr-6 text-right text-sm tabular-nums">{formatPrice(statement.closingBalance)}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
