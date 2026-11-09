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
import { useDeleteExpense, useGetAllExpenses, useGetExpenseSummary, useUpdateExpenseStatus } from '@/hooks/service-hooks/useExpenseService';
import { useGetAllLedgerAccounts } from '@/hooks/service-hooks/useLedgerAccountService';
import useModalShowHide from '@/hooks/use-modal-show-hide';
import { formatPrice } from '@/lib/format-price';
import { cn } from '@/lib/utils';
import IUnitOfService from '@/services/interfaces/IUnitOfService';
import { AccountSubTypeEnum, ExpenseDto, ExpenseFilterParams, ExpenseStatusEnum } from '@pms/types';
import { format } from 'date-fns';
import { Check, Pencil, Receipt, Trash2, Wallet } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import ManageExpense from './manage-expense';
import PayExpenseDialog from './pay-expense-dialog';

interface ExpenseListProps {
  onCountChange?: (total: number) => void;
}

const STATUS_STYLES: Record<string, string> = {
  [ExpenseStatusEnum.Draft]: 'border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300',
  [ExpenseStatusEnum.Approved]: 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-300',
  [ExpenseStatusEnum.Paid]: 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300',
  [ExpenseStatusEnum.Cancelled]: 'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900 dark:bg-rose-950 dark:text-rose-300',
};

const STATUS_LABELS: Record<string, string> = {
  [ExpenseStatusEnum.Draft]: 'Draft',
  [ExpenseStatusEnum.Approved]: 'Owed',
  [ExpenseStatusEnum.Paid]: 'Paid',
  [ExpenseStatusEnum.Cancelled]: 'Cancelled',
};

export default function ExpenseList({ onCountChange }: ExpenseListProps) {
  const unitOfService = container.get<IUnitOfService>(TYPES.IUnitOfService);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(config.recordPerPage);
  const [editId, setEditId] = useState<number>();
  const [payFor, setPayFor] = useState<ExpenseDto>();

  const params = useMemo<ExpenseFilterParams>(
    () => ({ page, recordPerPage: pageSize, sortBy: 'expenseDate', sortDirection: 'DESC' }),
    [page, pageSize]
  );

  const listQuery = useGetAllExpenses(params);
  const summaryQuery = useGetExpenseSummary();
  const accountsQuery = useGetAllLedgerAccounts({ showAllRecords: true, postableOnly: true });
  const statusMutation = useUpdateExpenseStatus();
  const deleteMutation = useDeleteExpense();

  const result = listQuery.data?.data?.data;
  const expenses: ExpenseDto[] = useMemo(() => result?.data ?? [], [result]);
  const total = result?.totalRecord ?? 0;
  const summary = summaryQuery.data?.data?.data;

  const moneyAccounts = useMemo(
    () =>
      (accountsQuery.data?.data?.data?.data ?? [])
        .filter((account) => account.subType === AccountSubTypeEnum.Cash || account.subType === AccountSubTypeEnum.Bank)
        .map((account) => ({ value: account.id, label: `${account.code} — ${account.name}` })),
    [accountsQuery.data]
  );

  useEffect(() => {
    onCountChange?.(total);
  }, [total, onCountChange]);

  const { showModal, openModal, closeModal, uniqueId } = useModalShowHide();

  const approve = async (id: number) => {
    let response;
    try {
      response = await statusMutation.mutateAsync({ id, model: { status: ExpenseStatusEnum.Approved } });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Could not approve',
        description: <span>{unitOfService.ErrorHandlerService.getErrorMessage(error as never)}</span>,
      });
      return;
    }
    if (response && response.status === 200) toast({ variant: 'success', title: 'Expense approved and recorded as owed' });
    else
      toast({
        variant: 'destructive',
        title: 'Could not approve',
        description: <span>{unitOfService.ErrorHandlerService.getErrorMessage(response)}</span>,
      });
  };

  const remove = async (id: number) => {
    let response;
    try {
      response = await deleteMutation.mutateAsync(id);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Could not delete',
        description: <span>{unitOfService.ErrorHandlerService.getErrorMessage(error as never)}</span>,
      });
      closeModal(false);
      return;
    }
    if (response && response.status === 200) toast({ variant: 'success', title: 'Expense deleted' });
    else
      toast({
        variant: 'destructive',
        title: 'Could not delete',
        description: <span>{unitOfService.ErrorHandlerService.getErrorMessage(response)}</span>,
      });
    closeModal(true);
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        {summaryQuery.isPending ? (
          <>
            {[0, 1, 2].map((key) => (
              <Card key={key} size="sm" className="p-4">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="mt-3 h-6 w-28" />
              </Card>
            ))}
          </>
        ) : (
          <>
            <Card size="sm" className="p-4">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Paid this month</span>
              <p className="mt-2 text-xl font-bold tabular-nums">{formatPrice(summary?.paidTotal ?? 0)}</p>
              <p className="mt-1 text-[11px] text-muted-foreground">Money that has actually gone out</p>
            </Card>
            <Card size="sm" className="p-4">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Still owed</span>
              <p className="mt-2 text-xl font-bold tabular-nums text-amber-600 dark:text-amber-400">{formatPrice(summary?.unpaidTotal ?? 0)}</p>
              <p className="mt-1 text-[11px] text-muted-foreground">Approved but not yet paid</p>
            </Card>
            <Card size="sm" className="p-4">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">GST on expenses</span>
              <p className="mt-2 text-xl font-bold tabular-nums">{formatPrice(summary?.taxTotal ?? 0)}</p>
              <p className="mt-1 text-[11px] text-muted-foreground">Input credit recorded this month</p>
            </Card>
          </>
        )}
      </div>

      {summary && summary.categories.length > 0 && (
        <Card className="overflow-hidden p-0 md:p-0">
          <div className="border-b bg-muted/30 px-5 py-3">
            <h2 className="text-sm font-bold">Where the money went this month</h2>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-5 text-[11px] uppercase tracking-wider">Category</TableHead>
                <TableHead className="text-right text-[11px] uppercase tracking-wider">Entries</TableHead>
                <TableHead className="pr-5 text-right text-[11px] uppercase tracking-wider">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {summary.categories.map((row) => (
                <TableRow key={row.expenseAccountId}>
                  <TableCell className="pl-5 text-sm">
                    <span className="text-muted-foreground">{row.code}</span> {row.name}
                  </TableCell>
                  <TableCell className="text-right text-sm tabular-nums text-muted-foreground">{row.count}</TableCell>
                  <TableCell className="pr-5 text-right text-sm font-medium tabular-nums">{formatPrice(row.total)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      <Card className={cn('overflow-hidden p-0 md:p-0', listQuery.isFetching && !listQuery.isPending && 'opacity-60 transition-opacity')}>
        <div className="border-b bg-muted/30 px-5 py-3">
          <h2 className="text-sm font-bold">All expenses</h2>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="pl-5 text-[11px] uppercase tracking-wider">Date</TableHead>
              <TableHead className="text-[11px] uppercase tracking-wider">Details</TableHead>
              <TableHead className="text-[11px] uppercase tracking-wider">Category</TableHead>
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

            {!listQuery.isPending && expenses.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="py-10 text-center text-sm text-muted-foreground">
                  <Receipt className="mx-auto h-6 w-6 text-muted-foreground/40" />
                  <span className="mt-2 block">No expenses recorded yet.</span>
                </TableCell>
              </TableRow>
            )}

            {expenses.map((expense) => {
              const isDraft = expense.status === ExpenseStatusEnum.Draft;
              const isApproved = expense.status === ExpenseStatusEnum.Approved;
              const isCancelled = expense.status === ExpenseStatusEnum.Cancelled;

              return (
                <TableRow key={expense.id} className={cn(isCancelled && 'opacity-60')}>
                  <TableCell className="pl-5 align-top text-xs tabular-nums">{format(new Date(expense.expenseDate), 'd MMM yyyy')}</TableCell>
                  <TableCell className="align-top">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-sm font-medium">{expense.expenseNumber}</span>
                      <Badge variant="outline" className={cn('text-[10px]', STATUS_STYLES[expense.status])}>
                        {STATUS_LABELS[expense.status]}
                      </Badge>
                      {expense.journalVoucherNumber && <span className="text-[11px] text-muted-foreground">{expense.journalVoucherNumber}</span>}
                    </div>
                    <p className="mt-0.5 max-w-[360px] truncate text-[11px] text-muted-foreground">
                      {[expense.supplierName, expense.referenceNumber, expense.paidFromAccountName, expense.notes].filter(Boolean).join(' · ') || '—'}
                    </p>
                  </TableCell>
                  <TableCell className="align-top text-xs text-muted-foreground">{expense.expenseAccountName ?? '—'}</TableCell>
                  <TableCell className="align-top text-right text-sm tabular-nums">
                    {formatPrice(expense.totalAmount)}
                    {expense.taxAmount > 0 && <span className="block text-[11px] text-muted-foreground">incl. {formatPrice(expense.taxAmount)} GST</span>}
                  </TableCell>
                  <TableCell className="pr-5 align-top text-right">
                    <div className="flex items-center justify-end gap-1">
                      {isDraft && (
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label="Approve this expense"
                          title="Approve — records it as money owed"
                          disabled={statusMutation.isPending}
                          onClick={() => approve(expense.id)}
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                      )}
                      {(isDraft || isApproved) && (
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label="Mark this expense paid"
                          title="Mark paid"
                          onClick={() => setPayFor(expense)}
                        >
                          <Wallet className="h-4 w-4" />
                        </Button>
                      )}
                      <Button variant="ghost" size="icon" aria-label="Edit this expense" title="Edit" onClick={() => setEditId(expense.id)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      {isDraft && (
                        <Button variant="ghost" size="icon" aria-label="Delete this expense" title="Delete" onClick={() => openModal(expense.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
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

      {editId && <ManageExpense id={editId} isOpen onClose={() => setEditId(undefined)} />}
      {payFor && <PayExpenseDialog expense={payFor} moneyAccounts={moneyAccounts} isOpen onClose={() => setPayFor(undefined)} />}

      {showModal && uniqueId && (
        <ConfirmBox
          isOpen={showModal}
          onClose={() => closeModal(false)}
          onSubmit={() => remove(+uniqueId)}
          heading="Delete this expense"
          loading={deleteMutation.isPending}
          bodyText="Only a draft can be deleted. Once an expense is in the books it is undone by reversing its voucher instead."
        />
      )}
    </div>
  );
}
