'use client';
import ConfirmBox from '@/components/common/confirm-box';
import ListPagination from '@/components/common/list-pagination';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from '@/components/ui/use-toast';
import config from '@/config';
import { container } from '@/config/ioc';
import { TYPES } from '@/config/types';
import { useGetAllPaymentVouchers, useGetOutstanding, useReversePayment } from '@/hooks/service-hooks/usePaymentService';
import useModalShowHide from '@/hooks/use-modal-show-hide';
import { formatPrice } from '@/lib/format-price';
import { cn } from '@/lib/utils';
import IUnitOfService from '@/services/interfaces/IUnitOfService';
import { PartyType, PartyTypeEnum, PaymentDirectionEnum, PaymentFilterParams, PaymentStatusEnum, PaymentVoucherDto } from '@pms/types';
import { format } from 'date-fns';
import { ArrowDownLeft, ArrowUpRight, Undo2, Wallet } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import PartyStatementDialog from './party-statement-dialog';

interface PaymentListProps {
  onCountChange?: (total: number) => void;
}

export default function PaymentList({ onCountChange }: PaymentListProps) {
  const unitOfService = container.get<IUnitOfService>(TYPES.IUnitOfService);
  const [page, setPage] = useState(1);
  const [statementParty, setStatementParty] = useState<{ partyType: PartyType; partyId: string; partyName?: string | null }>();
  const [pageSize, setPageSize] = useState(config.recordPerPage);

  const params = useMemo<PaymentFilterParams>(() => ({ page, recordPerPage: pageSize, sortBy: 'paymentDate', sortDirection: 'DESC' }), [page, pageSize]);

  const listQuery = useGetAllPaymentVouchers(params);
  const outstandingQuery = useGetOutstanding();
  const reverseMutation = useReversePayment();

  const result = listQuery.data?.data?.data;
  const vouchers: PaymentVoucherDto[] = useMemo(() => result?.data ?? [], [result]);
  const total = result?.totalRecord ?? 0;
  const outstanding = outstandingQuery.data?.data?.data;

  useEffect(() => {
    onCountChange?.(total);
  }, [total, onCountChange]);

  const { showModal, openModal, closeModal, uniqueId } = useModalShowHide();

  const handleReverse = async (id: number) => {
    let response;
    try {
      response = await reverseMutation.mutateAsync({ id, model: { reason: 'Reversed from the payments screen' } });
    } catch (error) {
      toast({ variant: 'destructive', title: 'Could not reverse', description: <span>{unitOfService.ErrorHandlerService.getErrorMessage(error as never)}</span> });
      closeModal(false);
      return;
    }

    if (response && response.status === 201) {
      toast({ variant: 'success', title: 'Payment reversed' });
    } else {
      toast({ variant: 'destructive', title: 'Could not reverse', description: <span>{unitOfService.ErrorHandlerService.getErrorMessage(response)}</span> });
    }
    closeModal(true);
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        {outstandingQuery.isPending ? (
          <>
            <Card size="sm" className="p-4">
              <Skeleton className="h-3 w-28" />
              <Skeleton className="mt-3 h-6 w-32" />
            </Card>
            <Card size="sm" className="p-4">
              <Skeleton className="h-3 w-28" />
              <Skeleton className="mt-3 h-6 w-32" />
            </Card>
          </>
        ) : (
          <>
            <Card size="sm" className="p-4">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Customers owe us</span>
              <p className="mt-2 text-xl font-bold tabular-nums text-emerald-600 dark:text-emerald-400">{formatPrice(outstanding?.receivableTotal ?? 0)}</p>
              <p className="mt-1 text-[11px] text-muted-foreground">{outstanding?.customers.length ?? 0} with a balance</p>
            </Card>
            <Card size="sm" className="p-4">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">We owe suppliers</span>
              <p className="mt-2 text-xl font-bold tabular-nums text-rose-600 dark:text-rose-400">{formatPrice(outstanding?.payableTotal ?? 0)}</p>
              <p className="mt-1 text-[11px] text-muted-foreground">{outstanding?.suppliers.length ?? 0} with a balance</p>
            </Card>
          </>
        )}
      </div>

      {outstanding && outstanding.customers.length > 0 && (
        <Card className="overflow-hidden p-0 md:p-0">
          <div className="border-b bg-muted/30 px-5 py-3">
            <h2 className="text-sm font-bold">Outstanding by customer</h2>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-5 text-[11px] uppercase tracking-wider">Customer</TableHead>
                <TableHead className="pr-5 text-right text-[11px] uppercase tracking-wider">Owes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {outstanding.customers.map((row) => (
                <TableRow
                  key={row.partyId}
                  className="cursor-pointer"
                  title="Open this customer's full statement"
                  onClick={() => setStatementParty({ partyType: PartyTypeEnum.Customer, partyId: row.partyId, partyName: row.partyName })}
                >
                  <TableCell className="pl-5 text-sm">{row.partyName ?? row.partyId}</TableCell>
                  <TableCell className="pr-5 text-right text-sm tabular-nums">{formatPrice(row.balance)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      <Card className={cn('overflow-hidden p-0 md:p-0', listQuery.isFetching && !listQuery.isPending && 'opacity-60 transition-opacity')}>
        <div className="border-b bg-muted/30 px-5 py-3">
          <h2 className="text-sm font-bold">Money in and out</h2>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="pl-5 text-[11px] uppercase tracking-wider">Date</TableHead>
              <TableHead className="text-[11px] uppercase tracking-wider">Details</TableHead>
              <TableHead className="text-[11px] uppercase tracking-wider">Account</TableHead>
              <TableHead className="text-right text-[11px] uppercase tracking-wider">Amount</TableHead>
              <TableHead className="pr-5 text-right text-[11px] uppercase tracking-wider">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {listQuery.isPending && (
              <TableRow>
                <TableCell colSpan={5} className="py-10 text-center text-sm text-muted-foreground">
                  Loading…
                </TableCell>
              </TableRow>
            )}

            {!listQuery.isPending && vouchers.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="py-10 text-center text-sm text-muted-foreground">
                  <Wallet className="mx-auto h-6 w-6 text-muted-foreground/40" />
                  <span className="mt-2 block">No payments recorded yet.</span>
                </TableCell>
              </TableRow>
            )}

            {vouchers.map((voucher) => {
              const isIn = voucher.direction === PaymentDirectionEnum.In;
              const isCancelled = voucher.status === PaymentStatusEnum.Cancelled;
              return (
                <TableRow key={voucher.id} className={cn(isCancelled && 'opacity-60')}>
                  <TableCell className="pl-5 align-top text-xs tabular-nums">{format(new Date(voucher.paymentDate), 'd MMM yyyy')}</TableCell>
                  <TableCell className="align-top">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <Badge
                        variant="outline"
                        className={cn(
                          'gap-1 text-[10px]',
                          isIn
                            ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300'
                            : 'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900 dark:bg-rose-950 dark:text-rose-300'
                        )}
                      >
                        {isIn ? <ArrowDownLeft className="h-3 w-3" /> : <ArrowUpRight className="h-3 w-3" />}
                        {isIn ? 'In' : 'Out'}
                      </Badge>
                      {voucher.journalVoucherNumber && <span className="text-sm font-medium">{voucher.journalVoucherNumber}</span>}
                      {isCancelled && <Badge variant="outline" className="text-[10px]">Reversed</Badge>}
                    </div>
                    <p className="mt-0.5 max-w-[360px] truncate text-[11px] text-muted-foreground">
                      {[voucher.partyName, voucher.orderNumber, voucher.remarks].filter(Boolean).join(' · ') || '—'}
                    </p>
                    {voucher.unallocatedAmount > 0 && voucher.allocations.length > 0 && (
                      <p className="text-[11px] text-amber-600 dark:text-amber-400">{formatPrice(voucher.unallocatedAmount)} unapplied</p>
                    )}
                  </TableCell>
                  <TableCell className="align-top text-xs text-muted-foreground">{voucher.ledgerAccountName ?? '—'}</TableCell>
                  <TableCell className="align-top text-right text-sm tabular-nums">{formatPrice(voucher.amount)}</TableCell>
                  <TableCell className="pr-5 align-top text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label="Reverse this payment"
                      disabled={isCancelled}
                      title={isCancelled ? 'Already reversed' : 'Reverse this payment'}
                      onClick={() => openModal(voucher.id)}
                    >
                      <Undo2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Card>

      {total > pageSize && (
        <Card size="sm">
          <ListPagination
            page={page}
            pageSize={pageSize}
            total={total}
            loading={listQuery.isFetching}
            onPageChange={setPage}
            onPageSizeChange={(size) => {
              setPageSize(size);
              setPage(1);
            }}
          />
        </Card>
      )}

      {statementParty && (
        <PartyStatementDialog
          partyType={statementParty.partyType}
          partyId={statementParty.partyId}
          partyName={statementParty.partyName}
          isOpen
          onClose={() => setStatementParty(undefined)}
        />
      )}

      {showModal && uniqueId && (
        <ConfirmBox
          isOpen={showModal}
          onClose={() => closeModal(false)}
          onSubmit={() => handleReverse(+uniqueId)}
          heading="Reverse this payment"
          loading={reverseMutation.isPending}
          bodyText="A reversing entry is posted and the payment is marked cancelled. The original stays in the books, because accounting records are never deleted."
        />
      )}
    </div>
  );
}
