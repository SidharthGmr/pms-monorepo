'use client';
import ConfirmBox from '@/components/common/confirm-box';
import { DirtyNote } from '@/components/common/field';
import { SelectSearch } from '@/components/common/select-search';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/components/ui/use-toast';
import { container } from '@/config/ioc';
import { TYPES } from '@/config/types';
import { useGetAllLedgerAccounts } from '@/hooks/service-hooks/useLedgerAccountService';
import { useCreatePaymentVoucher } from '@/hooks/service-hooks/usePaymentService';
import { useGetAllUserList } from '@/hooks/service-hooks/useUserList.service.hook';
import { submitOnCtrlEnter } from '@/lib/form-shortcuts';
import { zodResolver } from '@/lib/zod-resolver';
import IUnitOfService from '@/services/interfaces/IUnitOfService';
import {
  ACCOUNT_CATEGORY_LABELS,
  AccountSubTypeEnum,
  PartyType,
  PartyTypeEnum,
  PaymentDirection,
  PaymentDirectionEnum,
  PaymentMethodEnum,
  PaymentVoucherModel,
  paymentVoucherFields,
} from '@pms/types';
import { ArrowDownLeft, ArrowUpRight } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';

interface RecordPaymentProps {
  direction: PaymentDirection;
  isOpen: boolean;
  onClose: (refresh: boolean) => void;
}

const METHOD_OPTIONS = [
  { value: PaymentMethodEnum.Cash, label: 'Cash' },
  { value: PaymentMethodEnum.Upi, label: 'UPI' },
  { value: PaymentMethodEnum.Card, label: 'Card' },
  { value: PaymentMethodEnum.BankTransfer, label: 'Bank transfer' },
  { value: PaymentMethodEnum.Online, label: 'Online' },
];

const PARTY_OPTIONS = [
  { value: '', label: 'No party — pick an account instead' },
  { value: PartyTypeEnum.Customer, label: 'Customer' },
  { value: PartyTypeEnum.Supplier, label: 'Supplier' },
];

export default function RecordPayment({ direction, isOpen, onClose }: RecordPaymentProps) {
  const unitOfService = container.get<IUnitOfService>(TYPES.IUnitOfService);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);

  const accountsQuery = useGetAllLedgerAccounts({ showAllRecords: true, postableOnly: true });
  const customersQuery = useGetAllUserList({ showAllRecords: true });
  const createVoucher = useCreatePaymentVoucher();

  const accounts = accountsQuery.data?.data?.data?.data ?? [];
  const moneyAccounts = accounts.filter(
    (account) => account.subType === AccountSubTypeEnum.Cash || account.subType === AccountSubTypeEnum.Bank
  );

  const form = useForm<PaymentVoucherModel>({
    resolver: zodResolver(paymentVoucherFields),
    defaultValues: {
      direction,
      moneyAccountId: undefined,
      counterAccountId: null,
      partyType: null,
      partyId: '',
      amount: undefined,
      method: PaymentMethodEnum.Cash,
      paymentDate: null,
      referenceNumber: '',
      remarks: '',
    },
  });

  const {
    watch,
    formState: { isDirty },
  } = form;
  const partyType = watch('partyType');

  const isIn = direction === PaymentDirectionEnum.In;
  const isSaving = createVoucher.isPending;

  // A party settles its own control account, so the counter-account picker only appears when
  // no party is chosen - showing both would invite a contradiction the API would reject.
  const customers = (customersQuery.data?.data?.data?.data ?? []) as { userId: string; name: string; email?: string }[];
  const partyOptions = customers.map((customer) => ({ value: customer.userId, label: `${customer.name}${customer.email ? ` (${customer.email})` : ''}` }));
  const counterOptions = accounts
    .filter((account) => account.subType !== AccountSubTypeEnum.Cash && account.subType !== AccountSubTypeEnum.Bank)
    .map((account) => ({ value: account.id, label: `${account.code} — ${account.name} (${ACCOUNT_CATEGORY_LABELS[account.category]})` }));

  const save = async (model: PaymentVoucherModel) => {
    let response;
    try {
      response = await createVoucher.mutateAsync({ ...model, direction });
    } catch (error) {
      const message = unitOfService.ErrorHandlerService.getErrorMessage(error as never);
      toast({ variant: 'destructive', title: 'Could not record this payment', description: <span>{message}</span> });
      return;
    }

    if (response && response.status === 201 && response.data.data) {
      toast({ variant: 'success', title: `${isIn ? 'Receipt' : 'Payment'} recorded`, description: <span>{response.data.data.journalVoucherNumber ?? ''}</span> });
      onClose(true);
    } else {
      const message = unitOfService.ErrorHandlerService.getErrorMessage(response);
      toast({ variant: 'destructive', title: 'Could not record this payment', description: <span>{message}</span> });
    }
  };

  const submit = form.handleSubmit((model) => save(model));

  const handleCancel = () => {
    if (isDirty && !isSaving) {
      setShowLeaveConfirm(true);
      return;
    }
    onClose(false);
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => !open && handleCancel()}>
        <DialogContent className="flex max-h-[90vh] flex-col gap-0 p-0 sm:max-w-lg" onInteractOutside={(e) => e.preventDefault()}>
          <DialogHeader className="space-y-0 border-b bg-muted/30 px-6 py-4 text-left">
            <div className="flex items-center gap-3 pr-8">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                {isIn ? <ArrowDownLeft className="h-4 w-4" /> : <ArrowUpRight className="h-4 w-4" />}
              </span>
              <div className="min-w-0 flex-1">
                <DialogTitle className="truncate text-base">{isIn ? 'Record money in' : 'Record money out'}</DialogTitle>
                <DialogDescription className="mt-1 text-xs">
                  {isIn ? 'A customer receipt, or money arriving for any other reason.' : 'A supplier payment, an expense paid in cash, or money drawn out.'}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <Form {...form}>
            <form autoComplete="off" onSubmit={submit} onKeyDown={submitOnCtrlEnter(submit)} className="flex min-h-0 flex-1 flex-col">
              <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-6 py-5">
                <FormField
                  control={form.control}
                  name="moneyAccountId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{isIn ? 'Money arrives in *' : 'Money leaves from *'}</FormLabel>
                      <FormControl>
                        <SelectSearch
                          buttonClass="w-full"
                          placeholder="Pick a cash or bank account"
                          items={moneyAccounts.map((account) => ({ value: account.id, label: `${account.code} — ${account.name}` }))}
                          value={field.value ?? ''}
                          containerName="payment-money-account"
                          onChange={(value) => field.onChange(value ? Number(value) : undefined)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

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
                  name="partyType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Who is this with?</FormLabel>
                      <FormControl>
                        <SelectSearch
                          buttonClass="w-full"
                          placeholder="No party"
                          items={PARTY_OPTIONS}
                          value={field.value ?? ''}
                          containerName="payment-party-type"
                          onChange={(value) => {
                            field.onChange((value as PartyType) || null);
                            form.setValue('partyId', '', { shouldDirty: true });
                            form.setValue('counterAccountId', null, { shouldDirty: true });
                          }}
                        />
                      </FormControl>
                      <FormDescription>A customer or supplier settles their own balance automatically.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {partyType === PartyTypeEnum.Customer && (
                  <FormField
                    control={form.control}
                    name="partyId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Customer *</FormLabel>
                        <FormControl>
                          <SelectSearch
                            buttonClass="w-full"
                            placeholder="Search customer"
                            items={partyOptions}
                            value={field.value ?? ''}
                            containerName="payment-customer"
                            onChange={(value) => field.onChange(String(value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                {partyType === PartyTypeEnum.Supplier && (
                  <FormField
                    control={form.control}
                    name="partyId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Supplier id *</FormLabel>
                        <FormControl>
                          <Input placeholder="Supplier id" {...field} value={field.value ?? ''} />
                        </FormControl>
                        <FormDescription>Suppliers are not yet pickable here; enter the id from the supplier list.</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                {!partyType && (
                  <FormField
                    control={form.control}
                    name="counterAccountId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>What is it for? *</FormLabel>
                        <FormControl>
                          <SelectSearch
                            buttonClass="w-full"
                            placeholder="Pick the account this is for"
                            items={counterOptions}
                            value={field.value ?? ''}
                            containerName="payment-counter-account"
                            onChange={(value) => field.onChange(value ? Number(value) : null)}
                          />
                        </FormControl>
                        <FormDescription>{isIn ? 'Income, or capital you put in.' : 'An expense, or money drawn out.'}</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                <FormField
                  control={form.control}
                  name="method"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Method *</FormLabel>
                      <FormControl>
                        <SelectSearch
                          buttonClass="w-full"
                          placeholder="Cash"
                          items={METHOD_OPTIONS}
                          value={field.value ?? ''}
                          containerName="payment-method"
                          onChange={(value) => field.onChange(value)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="remarks"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Remarks</FormLabel>
                      <FormControl>
                        <Textarea rows={2} className="resize-none" placeholder="What this was for…" {...field} value={field.value ?? ''} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <DialogFooter className="gap-2 border-t bg-muted/30 px-6 py-3 sm:justify-between">
                <DirtyNote dirty={isDirty} />
                <div className="flex flex-col-reverse gap-2 sm:flex-row">
                  <Button type="button" variant="outline" onClick={handleCancel} disabled={isSaving}>
                    Cancel
                  </Button>
                  <Button type="submit" loading={isSaving}>
                    {isIn ? 'Record receipt' : 'Record payment'}
                  </Button>
                </div>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <ConfirmBox
        isOpen={showLeaveConfirm}
        onClose={() => setShowLeaveConfirm(false)}
        onSubmit={() => {
          setShowLeaveConfirm(false);
          onClose(false);
        }}
        heading="Discard this payment?"
        bodyText="Nothing has been recorded yet. Closing now will lose what you typed."
        noButtonText="Keep editing"
        yesButtonText="Discard"
      />
    </>
  );
}
