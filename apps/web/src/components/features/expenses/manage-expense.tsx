'use client';
import ConfirmBox from '@/components/common/confirm-box';
import { SelectSearch } from '@/components/common/select-search';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/components/ui/use-toast';
import { container } from '@/config/ioc';
import { TYPES } from '@/config/types';
import { useCreateExpense, useGetExpenseById, useUpdateExpense } from '@/hooks/service-hooks/useExpenseService';
import { useGetAllLedgerAccounts } from '@/hooks/service-hooks/useLedgerAccountService';
import { useGetAllSuppliers } from '@/hooks/service-hooks/useSupplierService';
import { useTaxOptions } from '@/hooks/use-tax-options';
import { submitOnCtrlEnter } from '@/lib/form-shortcuts';
import { formatPrice } from '@/lib/format-price';
import { zodResolver } from '@/lib/zod-resolver';
import IUnitOfService from '@/services/interfaces/IUnitOfService';
import {
  AccountCategoryEnum,
  AccountSubTypeEnum,
  computeExpenseTotals,
  ExpenseModel,
  ExpenseStatusEnum,
  expenseFields,
  RecurrenceIntervalEnum,
  TaxType,
  TaxTypeEnum,
} from '@pms/types';
import { Receipt } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';

interface ManageExpenseProps {
  id?: number;
  isOpen: boolean;
  onClose: (refresh: boolean) => void;
}

const TAX_TYPE_OPTIONS = [
  { value: TaxTypeEnum.WithTax, label: 'GST is inside this amount' },
  { value: TaxTypeEnum.WithoutTax, label: 'Add GST on top' },
];

const RECURRENCE_OPTIONS = [
  { value: RecurrenceIntervalEnum.Weekly, label: 'Every week' },
  { value: RecurrenceIntervalEnum.Monthly, label: 'Every month' },
  { value: RecurrenceIntervalEnum.Quarterly, label: 'Every quarter' },
  { value: RecurrenceIntervalEnum.Yearly, label: 'Every year' },
];

const toDateInput = (value: Date | string | null | undefined) => (value ? new Date(value).toISOString().slice(0, 10) : '');

export default function ManageExpense({ id, isOpen, onClose }: ManageExpenseProps) {
  const unitOfService = container.get<IUnitOfService>(TYPES.IUnitOfService);
  const isEdit = !!id && id > 0;
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);

  const accountsQuery = useGetAllLedgerAccounts({ showAllRecords: true, postableOnly: true });
  const suppliersQuery = useGetAllSuppliers({ showAllRecords: true });
  const { data: existingResponse, isLoading: isFetching } = useGetExpenseById(id ?? 0, isEdit);
  const existing = existingResponse?.data?.data;

  const createMutation = useCreateExpense();
  const updateMutation = useUpdateExpense();

  const accounts = useMemo(() => accountsQuery.data?.data?.data?.data ?? [], [accountsQuery.data]);

  // The chart of accounts is the category list - every account under Expenses is a category a
  // cost can be booked to, so adding one needs no code change here.
  const categoryOptions = useMemo(
    () =>
      accounts
        .filter((account) => account.category === AccountCategoryEnum.Expense)
        .map((account) => ({ value: account.id, label: `${account.code} — ${account.name}` })),
    [accounts]
  );

  const moneyOptions = useMemo(
    () =>
      accounts
        .filter((account) => account.subType === AccountSubTypeEnum.Cash || account.subType === AccountSubTypeEnum.Bank)
        .map((account) => ({ value: account.id, label: `${account.code} — ${account.name}` })),
    [accounts]
  );

  const supplierOptions = useMemo(
    () => [
      { value: '', label: 'No supplier' },
      ...(suppliersQuery.data?.data?.data?.data ?? []).map((supplier) => ({ value: String(supplier.id), label: supplier.name })),
    ],
    [suppliersQuery.data]
  );

  const { options: taxOptions, rateFor } = useTaxOptions({ emptyLabel: 'No GST' });

  const form = useForm<ExpenseModel>({
    resolver: zodResolver(expenseFields),
    defaultValues: {
      expenseDate: toDateInput(new Date()),
      expenseAccountId: undefined,
      paidFromAccountId: null,
      supplierId: null,
      referenceNumber: '',
      notes: '',
      amount: undefined,
      taxId: null,
      taxType: null,
      isInterState: false,
      attachments: [],
      status: ExpenseStatusEnum.Paid,
      isTemplate: false,
      recurrenceInterval: null,
      recurrenceNextDate: null,
      recurrenceEndDate: null,
    },
  });

  const { isDirty } = form.formState;
  const status = form.watch('status');
  const taxId = form.watch('taxId');
  const taxType = form.watch('taxType');
  const amount = form.watch('amount');
  const isInterState = form.watch('isInterState');
  const isTemplate = form.watch('isTemplate');

  // The same pipeline the API will recompute with, so the preview can never promise a total
  // the server then disagrees with.
  const preview = useMemo(
    () => computeExpenseTotals({ amount: Number(amount) || 0, taxRate: rateFor(taxId), taxType: taxType ?? null, isInterState: isInterState === true }),
    [amount, taxId, taxType, rateFor, isInterState]
  );

  useEffect(() => {
    if (!isEdit || !existing || form.formState.isDirty) return;
    form.reset({
      expenseDate: toDateInput(existing.expenseDate),
      expenseAccountId: existing.expenseAccountId,
      paidFromAccountId: existing.paidFromAccountId ?? null,
      supplierId: existing.supplierId ?? null,
      referenceNumber: existing.referenceNumber ?? '',
      notes: existing.notes ?? '',
      amount: existing.amount,
      taxId: existing.taxId ?? null,
      taxType: existing.taxType ?? null,
      isInterState: existing.isInterState,
      attachments: existing.attachments ?? [],
      status: existing.status === ExpenseStatusEnum.Cancelled ? ExpenseStatusEnum.Draft : existing.status,
      isTemplate: existing.isTemplate,
      recurrenceInterval: existing.recurrenceInterval ?? null,
      recurrenceNextDate: toDateInput(existing.recurrenceNextDate),
      recurrenceEndDate: toDateInput(existing.recurrenceEndDate),
    });
  }, [isEdit, existing, form]);

  const save = async (model: ExpenseModel) => {
    let response;
    try {
      response = isEdit ? await updateMutation.mutateAsync({ id: id!, model }) : await createMutation.mutateAsync(model);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: `Could not ${isEdit ? 'update' : 'record'} the expense`,
        description: <span>{unitOfService.ErrorHandlerService.getErrorMessage(error as never)}</span>,
      });
      return;
    }

    if (response && (response.status === 200 || response.status === 201)) {
      toast({ variant: 'success', title: `Expense ${isEdit ? 'updated' : 'recorded'}` });
      onClose(true);
    } else {
      toast({
        variant: 'destructive',
        title: `Could not ${isEdit ? 'update' : 'record'} the expense`,
        description: <span>{unitOfService.ErrorHandlerService.getErrorMessage(response)}</span>,
      });
    }
  };

  const submit = form.handleSubmit((model) => save(model));
  const isSaving = createMutation.isPending || updateMutation.isPending;

  const requestClose = () => {
    if (isDirty && !isSaving) {
      setShowLeaveConfirm(true);
      return;
    }
    onClose(false);
  };

  const isPosted = existing?.status === ExpenseStatusEnum.Approved || existing?.status === ExpenseStatusEnum.Paid;

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => !open && requestClose()}>
        <DialogContent className="flex max-h-[90vh] flex-col gap-0 p-0 sm:max-w-lg" onInteractOutside={(e) => e.preventDefault()}>
          <DialogHeader className="space-y-0 border-b bg-muted/30 px-6 py-4 text-left">
            <div className="flex items-center gap-3 pr-8">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Receipt className="h-4 w-4" />
              </span>
              <div className="min-w-0 flex-1">
                <DialogTitle className="truncate text-base">{isEdit ? 'Edit expense' : 'Record an expense'}</DialogTitle>
                <DialogDescription className="mt-1 text-xs">
                  {isPosted
                    ? 'This expense is already in the books, so only its details can change — not the amount or the account.'
                    : 'Rent, electricity, salaries — anything the business spends money on.'}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {isEdit && isFetching ? (
            <div className="px-6 py-16 text-center text-sm text-muted-foreground">Loading…</div>
          ) : (
            <Form {...form}>
              <form autoComplete="off" onSubmit={submit} onKeyDown={submitOnCtrlEnter(submit)} className="flex min-h-0 flex-1 flex-col">
                <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-6 py-5">
                  <FormField
                    control={form.control}
                    name="expenseAccountId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>What was it for? *</FormLabel>
                        <FormControl>
                          <SelectSearch
                            buttonClass="w-full"
                            placeholder="Pick an expense category"
                            items={categoryOptions}
                            value={field.value ?? ''}
                            containerName="expense-category"
                            onChange={(value) => field.onChange(value ? Number(value) : undefined)}
                          />
                        </FormControl>
                        <FormDescription className="text-[11px]">
                          These are the accounts under Expenses in your chart of accounts.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid gap-4 sm:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="amount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Amount *</FormLabel>
                          <FormControl>
                            <Input
                              inputMode="decimal"
                              placeholder="0.00"
                              name={field.name}
                              ref={field.ref}
                              disabled={isPosted}
                              onBlur={field.onBlur}
                              value={field.value ?? ''}
                              onChange={(e) => field.onChange(e.target.value === '' ? undefined : Number(e.target.value))}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="expenseDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Date</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} value={typeof field.value === 'string' ? field.value : toDateInput(field.value)} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="taxId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>GST</FormLabel>
                          <FormControl>
                            <SelectSearch
                              buttonClass="w-full"
                              placeholder="No GST"
                              items={taxOptions}
                              value={field.value ?? ''}
                              containerName="expense-tax"
                              onChange={(value) => {
                                field.onChange(value || null);
                                if (!value) form.setValue('taxType', null);
                                else if (!form.getValues('taxType')) form.setValue('taxType', TaxTypeEnum.WithTax);
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {!!taxId && (
                      <FormField
                        control={form.control}
                        name="taxType"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Is the GST inside the amount? *</FormLabel>
                            <FormControl>
                              <SelectSearch
                                buttonClass="w-full"
                                placeholder="Choose one"
                                items={TAX_TYPE_OPTIONS}
                                value={field.value ?? ''}
                                containerName="expense-tax-type"
                                onChange={(value) => field.onChange((value as TaxType) || null)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}
                  </div>

                  {!!taxId && (
                    <FormField
                      control={form.control}
                      name="isInterState"
                      render={({ field }) => (
                        <FormItem className="flex items-center justify-between rounded-lg border p-3">
                          <div className="space-y-0.5 pr-4">
                            <FormLabel className="text-sm">Inter-state purchase (IGST)</FormLabel>
                            <FormDescription className="text-[11px]">
                              Off means CGST + SGST, the usual case for a supplier in your own state.
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch checked={field.value === true} disabled={isPosted} onCheckedChange={field.onChange} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  )}

                  {(Number(amount) || 0) > 0 && (
                    <div className="rounded-lg border bg-muted/30 p-3 text-xs">
                      <div className="flex justify-between py-0.5">
                        <span className="text-muted-foreground">Taxable value</span>
                        <span className="tabular-nums">{formatPrice(preview.taxableAmount)}</span>
                      </div>
                      {preview.taxAmount > 0 && (
                        <div className="flex justify-between py-0.5">
                          <span className="text-muted-foreground">{isInterState ? 'IGST' : 'CGST + SGST'}</span>
                          <span className="tabular-nums">{formatPrice(preview.taxAmount)}</span>
                        </div>
                      )}
                      <div className="mt-1 flex justify-between border-t pt-1.5 font-semibold">
                        <span>Total</span>
                        <span className="tabular-nums">{formatPrice(preview.totalAmount)}</span>
                      </div>
                    </div>
                  )}

                  {!isEdit && !isTemplate && (
                    <FormField
                      control={form.control}
                      name="status"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Has it been paid?</FormLabel>
                          <FormControl>
                            <SelectSearch
                              buttonClass="w-full"
                              placeholder="Choose one"
                              items={[
                                { value: ExpenseStatusEnum.Paid, label: 'Paid now' },
                                { value: ExpenseStatusEnum.Approved, label: 'Approved but not paid yet' },
                                { value: ExpenseStatusEnum.Draft, label: 'Save as a draft' },
                              ]}
                              value={field.value ?? ''}
                              containerName="expense-status"
                              onChange={(value) => {
                                field.onChange(value || ExpenseStatusEnum.Draft);
                                if (value !== ExpenseStatusEnum.Paid) form.setValue('paidFromAccountId', null);
                              }}
                            />
                          </FormControl>
                          <FormDescription className="text-[11px]">
                            An approved but unpaid expense is recorded as money you owe, under Accounts Payable.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  {status === ExpenseStatusEnum.Paid && !isTemplate && (
                    <FormField
                      control={form.control}
                      name="paidFromAccountId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Paid from *</FormLabel>
                          <FormControl>
                            <SelectSearch
                              buttonClass="w-full"
                              placeholder="Cash or bank account"
                              items={moneyOptions}
                              value={field.value ?? ''}
                              containerName="expense-paid-from"
                              onChange={(value) => field.onChange(value ? Number(value) : null)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  <FormField
                    control={form.control}
                    name="supplierId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Supplier</FormLabel>
                        <FormControl>
                          <SelectSearch
                            buttonClass="w-full"
                            placeholder="No supplier"
                            items={supplierOptions}
                            value={field.value != null ? String(field.value) : ''}
                            containerName="expense-supplier"
                            onChange={(value) => field.onChange(value ? Number(value) : null)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="referenceNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Bill or reference number</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. INV-5521" {...field} value={field.value ?? ''} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Notes</FormLabel>
                        <FormControl>
                          <Textarea rows={2} className="resize-none" placeholder="Anything worth remembering…" {...field} value={field.value ?? ''} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {!isEdit && (
                    <FormField
                      control={form.control}
                      name="isTemplate"
                      render={({ field }) => (
                        <FormItem className="flex items-center justify-between rounded-lg border p-3">
                          <div className="space-y-0.5 pr-4">
                            <FormLabel className="text-sm">Repeat this expense</FormLabel>
                            <FormDescription className="text-[11px]">
                              Saves it as a recurring definition instead. Each due one is generated as a draft for you to confirm.
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value === true}
                              onCheckedChange={(checked) => {
                                field.onChange(checked);
                                if (checked) {
                                  form.setValue('status', ExpenseStatusEnum.Draft);
                                  form.setValue('paidFromAccountId', null);
                                  if (!form.getValues('recurrenceInterval')) form.setValue('recurrenceInterval', RecurrenceIntervalEnum.Monthly);
                                } else {
                                  form.setValue('recurrenceInterval', null);
                                }
                              }}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  )}

                  {isTemplate && (
                    <div className="grid gap-4 sm:grid-cols-2">
                      <FormField
                        control={form.control}
                        name="recurrenceInterval"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>How often *</FormLabel>
                            <FormControl>
                              <SelectSearch
                                buttonClass="w-full"
                                placeholder="Choose one"
                                items={RECURRENCE_OPTIONS}
                                value={field.value ?? ''}
                                containerName="expense-recurrence"
                                onChange={(value) => field.onChange(value || null)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="recurrenceNextDate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Next due on</FormLabel>
                            <FormControl>
                              <Input type="date" {...field} value={typeof field.value === 'string' ? field.value : toDateInput(field.value)} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  )}
                </div>

                <DialogFooter className="gap-2 border-t bg-muted/30 px-6 py-3">
                  <Button type="button" variant="outline" onClick={requestClose} disabled={isSaving}>
                    Cancel
                  </Button>
                  <Button type="submit" loading={isSaving}>
                    {isEdit ? 'Save changes' : 'Record expense'}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          )}
        </DialogContent>
      </Dialog>

      {showLeaveConfirm && (
        <ConfirmBox
          isOpen={showLeaveConfirm}
          onClose={() => setShowLeaveConfirm(false)}
          onSubmit={() => {
            setShowLeaveConfirm(false);
            onClose(false);
          }}
          heading="Discard this expense?"
          bodyText="What you have typed will be lost."
          yesButtonText="Discard"
        />
      )}
    </>
  );
}
