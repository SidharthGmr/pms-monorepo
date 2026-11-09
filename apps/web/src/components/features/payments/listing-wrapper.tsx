'use client';
import ListPageHeader from '@/components/common/list-page-header';
import { Button } from '@/components/ui/button';
import { PaymentDirection, PaymentDirectionEnum } from '@pms/types';
import { ArrowDownLeft, ArrowLeftRight, ArrowUpRight, Wallet } from 'lucide-react';
import { useState } from 'react';
import PaymentList from './index';
import RecordPayment from './record-payment';
import TransferDialog from './transfer-dialog';

export default function PaymentListingWrapper() {
  const [total, setTotal] = useState<number>();
  const [recordDirection, setRecordDirection] = useState<PaymentDirection>();
  const [showTransfer, setShowTransfer] = useState(false);

  return (
    <div className="mx-auto w-full max-w-7xl space-y-4">
      <ListPageHeader
        icon={Wallet}
        title="Payments"
        description={
          total === undefined
            ? 'Money in and out, and what is still owed either way.'
            : `${total} payment${total === 1 ? '' : 's'} recorded.`
        }
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" onClick={() => setShowTransfer(true)}>
              <ArrowLeftRight className="mr-2 h-4 w-4" />
              Transfer
            </Button>
            <Button variant="outline" onClick={() => setRecordDirection(PaymentDirectionEnum.Out)}>
              <ArrowUpRight className="mr-2 h-4 w-4" />
              Money out
            </Button>
            <Button onClick={() => setRecordDirection(PaymentDirectionEnum.In)}>
              <ArrowDownLeft className="mr-2 h-4 w-4" />
              Money in
            </Button>
          </div>
        }
      />

      <PaymentList onCountChange={setTotal} />

      {recordDirection && <RecordPayment direction={recordDirection} isOpen onClose={() => setRecordDirection(undefined)} />}
      {showTransfer && <TransferDialog isOpen onClose={() => setShowTransfer(false)} />}
    </div>
  );
}
