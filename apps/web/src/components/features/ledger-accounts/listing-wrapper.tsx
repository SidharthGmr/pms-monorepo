'use client';
import ListPageHeader from '@/components/common/list-page-header';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import { container } from '@/config/ioc';
import { TYPES } from '@/config/types';
import { useSeedLedgerAccounts } from '@/hooks/service-hooks/useLedgerAccountService';
import IUnitOfService from '@/services/interfaces/IUnitOfService';
import { BookOpen, Plus, Sparkles } from 'lucide-react';
import { useState } from 'react';
import LedgerAccountList from './index';

export default function LedgerAccountListingWrapper() {
  const unitOfService = container.get<IUnitOfService>(TYPES.IUnitOfService);
  const [total, setTotal] = useState<number>();
  const [addToken, setAddToken] = useState(0);
  const seedAccounts = useSeedLedgerAccounts();

  const runSeed = async () => {
    let response;
    try {
      response = await seedAccounts.mutateAsync();
    } catch (error) {
      // A rejected request is usually the API refusing, not an unreachable server, so show
      // what it said rather than a guess about the network.
      const message = unitOfService.ErrorHandlerService.getErrorMessage(error as never) || 'Could not reach the server. Please try again.';
      toast({ variant: 'destructive', title: 'Could not set up accounts', description: <span>{message}</span> });
      return;
    }

    if (response && response.status === 201) {
      toast({ variant: 'success', title: response.data.message });
    } else {
      const error = unitOfService.ErrorHandlerService.getErrorMessage(response);
      toast({ variant: 'destructive', title: 'Could not set up accounts', description: <span>{error}</span> });
    }
  };

  return (
    <div className="mx-auto w-full max-w-7xl space-y-4">
      <ListPageHeader
        icon={BookOpen}
        title="Chart of Accounts"
        description={total === undefined ? 'Every ledger account a journal line can post against.' : `${total} accounts in this store.`}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" onClick={runSeed} loading={seedAccounts.isPending}>
              <Sparkles className="mr-2 h-4 w-4" />
              Set up chart of accounts
            </Button>
            <Button onClick={() => setAddToken((token) => token + 1)}>
              <Plus className="mr-2 h-4 w-4" />
              New account
            </Button>
          </div>
        }
      />
      <LedgerAccountList onCountChange={setTotal} addToken={addToken} />
    </div>
  );
}
