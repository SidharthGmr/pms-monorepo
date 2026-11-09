'use client';
import { SelectSearch } from '@/components/common/select-search';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { toast } from '@/components/ui/use-toast';
import { container } from '@/config/ioc';
import { TYPES } from '@/config/types';
import { useUpdateExpenseStatus } from '@/hooks/service-hooks/useExpenseService';
import { submitOnCtrlEnter } from '@/lib/form-shortcuts';
import { formatPrice } from '@/lib/format-price';
import { zodResolver } from '@/lib/zod-resolver';
import IUnitOfService from '@/services/interfaces/IUnitOfService';
import DropdownBasicDto from '@/types/dropdown-basic.dto';
import { ExpenseDto, ExpenseStatusEnum, ExpenseStatusModel, expenseStatusFields } from '@pms/types';
import { Wallet } from 'lucide-react';
import { useForm } from 'react-hook-form';

interface PayExpenseDialogProps {
  expense: ExpenseDto;
  moneyAccounts: DropdownBasicDto[];
  isOpen: boolean;
  onClose: (refresh: boolean) => void;
}

export default function PayExpenseDialog({ expense, moneyAccounts, isOpen, onClose }: PayExpenseDialogProps) {
  const unitOfService = container.get<IUnitOfService>(TYPES.IUnitOfService);
  const statusMutation = useUpdateExpenseStatus();

  const form = useForm<ExpenseStatusModel>({
    resolver: zodResolver(expenseStatusFields),
    defaultValues: {
      status: ExpenseStatusEnum.Paid,
      paidFromAccountId: expense.paidFromAccountId ?? undefined,
      paymentDate: new Date().toISOString().slice(0, 10),
      note: '',
    },
  });

  const save = async (model: ExpenseStatusModel) => {
    let response;
    try {
      response = await statusMutation.mutateAsync({ id: expense.id, model });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Could not record the payment',
        description: <span>{unitOfService.ErrorHandlerService.getErrorMessage(error as never)}</span>,
      });
      return;
    }

    if (response && response.status === 200) {
      toast({ variant: 'success', title: `${expense.expenseNumber} marked paid` });
      onClose(true);
    } else {
      toast({
        variant: 'destructive',
        title: 'Could not record the payment',
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
              <Wallet className="h-4 w-4" />
            </span>
            <div className="min-w-0 flex-1">
              <DialogTitle className="truncate text-base">Pay {expense.expenseNumber}</DialogTitle>
              <DialogDescription className="mt-1 text-xs">
                {formatPrice(expense.totalAmount)} to {expense.expenseAccountName ?? 'this expense'}
                {expense.supplierName ? ` · ${expense.supplierName}` : ''}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <Form {...form}>
          <form autoComplete="off" onSubmit={submit} onKeyDown={submitOnCtrlEnter(submit)} className="flex min-h-0 flex-1 flex-col">
            <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-6 py-5">
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
                        items={moneyAccounts}
                        value={field.value ?? ''}
                        containerName="pay-expense-account"
                        onChange={(value) => field.onChange(value ? Number(value) : null)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="paymentDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Paid on</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} value={typeof field.value === 'string' ? field.value : ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter className="gap-2 border-t bg-muted/30 px-6 py-3">
              <Button type="button" variant="outline" onClick={() => onClose(false)} disabled={statusMutation.isPending}>
                Cancel
              </Button>
              <Button type="submit" loading={statusMutation.isPending}>
                Mark paid
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
