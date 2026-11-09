'use client';
import { SelectSearch } from '@/components/common/select-search';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/components/ui/use-toast';
import { container } from '@/config/ioc';
import { TYPES } from '@/config/types';
import { useGetAllLedgerAccounts } from '@/hooks/service-hooks/useLedgerAccountService';
import { useCreateTransfer } from '@/hooks/service-hooks/usePaymentService';
import { submitOnCtrlEnter } from '@/lib/form-shortcuts';
import { zodResolver } from '@/lib/zod-resolver';
import IUnitOfService from '@/services/interfaces/IUnitOfService';
import { AccountSubTypeEnum, PaymentTransferModel, paymentTransferFields } from '@pms/types';
import { ArrowLeftRight } from 'lucide-react';
import { useForm } from 'react-hook-form';

interface TransferDialogProps {
  isOpen: boolean;
  onClose: (refresh: boolean) => void;
}

export default function TransferDialog({ isOpen, onClose }: TransferDialogProps) {
  const unitOfService = container.get<IUnitOfService>(TYPES.IUnitOfService);
  const accountsQuery = useGetAllLedgerAccounts({ showAllRecords: true, postableOnly: true });
  const createTransfer = useCreateTransfer();

  const moneyAccounts = (accountsQuery.data?.data?.data?.data ?? [])
    .filter((account) => account.subType === AccountSubTypeEnum.Cash || account.subType === AccountSubTypeEnum.Bank)
    .map((account) => ({ value: account.id, label: `${account.code} — ${account.name}` }));

  const form = useForm<PaymentTransferModel>({
    resolver: zodResolver(paymentTransferFields),
    defaultValues: { fromAccountId: undefined, toAccountId: undefined, amount: undefined, paymentDate: null, remarks: '' },
  });

  const save = async (model: PaymentTransferModel) => {
    let response;
    try {
      response = await createTransfer.mutateAsync(model);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Could not record the transfer',
        description: <span>{unitOfService.ErrorHandlerService.getErrorMessage(error as never)}</span>,
      });
      return;
    }

    if (response && response.status === 201) {
      toast({ variant: 'success', title: 'Transfer recorded' });
      onClose(true);
    } else {
      toast({
        variant: 'destructive',
        title: 'Could not record the transfer',
        description: <span>{unitOfService.ErrorHandlerService.getErrorMessage(response)}</span>,
      });
    }
  };

  const submit = form.handleSubmit((model) => save(model));

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose(false)}>
      <DialogContent className="flex max-h-[90vh] flex-col gap-0 p-0 sm:max-w-md" onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader className="space-y-0 border-b bg-muted/30 px-6 py-4 text-left">
          <div className="flex items-center gap-3 pr-8">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <ArrowLeftRight className="h-4 w-4" />
            </span>
            <div className="min-w-0 flex-1">
              <DialogTitle className="truncate text-base">Transfer money</DialogTitle>
              <DialogDescription className="mt-1 text-xs">Between your own cash and bank accounts — never income or expense.</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <Form {...form}>
          <form autoComplete="off" onSubmit={submit} onKeyDown={submitOnCtrlEnter(submit)} className="flex min-h-0 flex-1 flex-col">
            <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-6 py-5">
              <FormField
                control={form.control}
                name="fromAccountId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>From *</FormLabel>
                    <FormControl>
                      <SelectSearch
                        buttonClass="w-full"
                        placeholder="Money leaves"
                        items={moneyAccounts}
                        value={field.value ?? ''}
                        containerName="transfer-from"
                        onChange={(value) => field.onChange(value ? Number(value) : undefined)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="toAccountId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>To *</FormLabel>
                    <FormControl>
                      <SelectSearch
                        buttonClass="w-full"
                        placeholder="Money arrives"
                        items={moneyAccounts}
                        value={field.value ?? ''}
                        containerName="transfer-to"
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
                name="remarks"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Remarks</FormLabel>
                    <FormControl>
                      <Textarea rows={2} className="resize-none" placeholder="Why the money moved…" {...field} value={field.value ?? ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter className="gap-2 border-t bg-muted/30 px-6 py-3">
              <Button type="button" variant="outline" onClick={() => onClose(false)} disabled={createTransfer.isPending}>
                Cancel
              </Button>
              <Button type="submit" loading={createTransfer.isPending}>
                Record transfer
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
