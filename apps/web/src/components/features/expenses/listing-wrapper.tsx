'use client';
import ListPageHeader from '@/components/common/list-page-header';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import { container } from '@/config/ioc';
import { TYPES } from '@/config/types';
import { useRunRecurringExpenses } from '@/hooks/service-hooks/useExpenseService';
import IUnitOfService from '@/services/interfaces/IUnitOfService';
import { Plus, Receipt, RefreshCw } from 'lucide-react';
import { useState } from 'react';
import ExpenseList from './index';
import ManageExpense from './manage-expense';

export default function ExpenseListingWrapper() {
  const unitOfService = container.get<IUnitOfService>(TYPES.IUnitOfService);
  const [total, setTotal] = useState<number>();
  const [showAdd, setShowAdd] = useState(false);
  const runRecurring = useRunRecurringExpenses();

  const generate = async () => {
    let response;
    try {
      response = await runRecurring.mutateAsync();
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Could not generate recurring expenses',
        description: <span>{unitOfService.ErrorHandlerService.getErrorMessage(error as never)}</span>,
      });
      return;
    }

    if (response && response.status === 201) {
      const count = response.data?.data?.length ?? 0;
      toast({
        variant: 'success',
        title: count > 0 ? `${count} recurring expense${count === 1 ? '' : 's'} created as drafts` : 'Nothing is due right now',
      });
    } else {
      toast({
        variant: 'destructive',
        title: 'Could not generate recurring expenses',
        description: <span>{unitOfService.ErrorHandlerService.getErrorMessage(response)}</span>,
      });
    }
  };

  return (
    <div className="mx-auto w-full max-w-7xl space-y-4">
      <ListPageHeader
        icon={Receipt}
        title="Expenses"
        description={
          total === undefined ? 'Rent, electricity, salaries and everything else the business spends on.' : `${total} expense${total === 1 ? '' : 's'} recorded.`
        }
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" onClick={generate} loading={runRecurring.isPending}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Run recurring
            </Button>
            <Button onClick={() => setShowAdd(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add expense
            </Button>
          </div>
        }
      />

      <ExpenseList onCountChange={setTotal} />

      {showAdd && <ManageExpense isOpen onClose={() => setShowAdd(false)} />}
    </div>
  );
}
