'use client';
import { DateRangePicker } from '@/components/common/date-range-picker';
import { SelectSearch } from '@/components/common/select-search';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/components/ui/use-toast';
import { useGetAllLedgerAccounts, useGetLedgerStatement, useGetProfitLoss, useGetTrialBalance } from '@/hooks/service-hooks/useLedgerAccountService';
import { ACCOUNT_CATEGORY_LABELS, LedgerStatementFilterParams, VOUCHER_TYPE_LABELS } from '@pms/types';
import { format } from 'date-fns';
import { Download } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { DateRange } from 'react-day-picker';
import ProfitLossView from './profit-loss-view';
import StatementView from './statement-view';
import TrialBalanceView from './trial-balance-view';

const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0).toISOString();
const endOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999).toISOString();

const csvCell = (value: string | number) => {
  const text = String(value ?? '');
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};

export default function LedgerBook() {
  const [view, setView] = useState<'account' | 'trial' | 'pnl'>('account');
  const searchParams = useSearchParams();
  const viewParam = searchParams?.get('view');

  // The sidebar's Profit & Loss entry deep-links here as ?view=pnl, so the query wins over
  // the default tab - on first load and again if the link is clicked while already on the page.
  useEffect(() => {
    if (viewParam === 'account' || viewParam === 'trial' || viewParam === 'pnl') setView(viewParam);
  }, [viewParam]);
  const [accountId, setAccountId] = useState<number | undefined>();
  const [dateRange, setDateRange] = useState<DateRange | undefined>();

  const accountsQuery = useGetAllLedgerAccounts({ showAllRecords: true, postableOnly: true });
  const accounts = useMemo(() => accountsQuery.data?.data?.data?.data ?? [], [accountsQuery.data]);

  // Default to the first postable account so the page is never an empty prompt.
  useEffect(() => {
    if (accountId === undefined && accounts.length > 0) setAccountId(accounts[0]!.id);
  }, [accounts, accountId]);

  const params = useMemo<LedgerStatementFilterParams>(
    () => ({
      startDate: dateRange?.from ? startOfDay(dateRange.from) : undefined,
      endDate: dateRange?.to ? endOfDay(dateRange.to) : undefined,
    }),
    [dateRange]
  );

  const statementQuery = useGetLedgerStatement(accountId ?? 0, params, view === 'account' && !!accountId);
  const trialQuery = useGetTrialBalance(params, view === 'trial');
  const profitLossQuery = useGetProfitLoss(params, view === 'pnl');

  const statement = statementQuery.data?.data?.data;
  const trialBalance = trialQuery.data?.data?.data;
  const profitLoss = profitLossQuery.data?.data?.data;

  const accountOptions = accounts.map((account) => ({
    value: account.id,
    label: `${account.code} — ${account.name} (${ACCOUNT_CATEGORY_LABELS[account.category]})`,
  }));

  const exportCsv = () => {
    const rows: string[] = [];
    let fileName = 'ledger';

    if (view === 'account') {
      if (!statement) {
        toast({ variant: 'destructive', title: 'Nothing to export' });
        return;
      }
      fileName = `ledger-${statement.code}`;
      rows.push(['Date', 'Voucher', 'Type', 'Narration', 'Contra accounts', 'Debit', 'Credit', 'Balance'].join(','));
      rows.push(['', '', '', 'Opening balance', '', '', '', statement.openingBalance].map(csvCell).join(','));
      for (const row of statement.rows) {
        rows.push(
          [
            format(new Date(row.entryDate), 'yyyy-MM-dd'),
            row.voucherNumber,
            VOUCHER_TYPE_LABELS[row.voucherType],
            row.narration ?? '',
            row.contraAccounts.join('; '),
            row.debit || '',
            row.credit || '',
            row.balance,
          ]
            .map(csvCell)
            .join(',')
        );
      }
      rows.push(['', '', '', 'Closing balance', '', statement.totalDebit, statement.totalCredit, statement.closingBalance].map(csvCell).join(','));
    } else if (view === 'pnl') {
      if (!profitLoss) {
        toast({ variant: 'destructive', title: 'Nothing to export' });
        return;
      }
      fileName = 'profit-loss';
      rows.push(['Section', 'Code', 'Account', 'Amount'].join(','));
      for (const line of profitLoss.income) rows.push(['Income', line.code, line.name, line.amount].map(csvCell).join(','));
      rows.push(['Income', '', 'Total income', profitLoss.incomeTotal].map(csvCell).join(','));
      for (const line of profitLoss.directCosts) rows.push(['Direct costs', line.code, line.name, line.amount].map(csvCell).join(','));
      rows.push(['', '', 'Gross profit', profitLoss.grossProfit].map(csvCell).join(','));
      for (const line of profitLoss.expenses) rows.push(['Expenses', line.code, line.name, line.amount].map(csvCell).join(','));
      rows.push(['Expenses', '', 'Total expenses', profitLoss.expenseTotal].map(csvCell).join(','));
      rows.push(['', '', profitLoss.netProfit >= 0 ? 'Net profit' : 'Net loss', profitLoss.netProfit].map(csvCell).join(','));
    } else {
      if (!trialBalance) {
        toast({ variant: 'destructive', title: 'Nothing to export' });
        return;
      }
      fileName = 'trial-balance';
      rows.push(['Code', 'Account', 'Category', 'Debit', 'Credit'].join(','));
      for (const row of trialBalance.rows) {
        rows.push([row.code, row.name, ACCOUNT_CATEGORY_LABELS[row.category], row.debit || '', row.credit || ''].map(csvCell).join(','));
      }
      rows.push(['', 'Total', '', trialBalance.totalDebit, trialBalance.totalCredit].map(csvCell).join(','));
    }

    // A BOM so Excel reads the rupee amounts and names as UTF-8.
    const blob = new Blob(['﻿' + rows.join('\r\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `${fileName}-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      <Card size="sm" className="flex flex-wrap items-center gap-3 p-4">
        <Tabs value={view} onValueChange={(next) => setView(next as 'account' | 'trial' | 'pnl')}>
          <TabsList>
            <TabsTrigger value="account">Account ledger</TabsTrigger>
            <TabsTrigger value="trial">Trial balance</TabsTrigger>
            <TabsTrigger value="pnl">Profit &amp; Loss</TabsTrigger>
          </TabsList>
        </Tabs>

        {view === 'account' && (
          <SelectSearch
            buttonClass="w-full sm:w-[380px]"
            placeholder="Pick an account"
            items={accountOptions}
            value={accountId ?? ''}
            containerName="ledger-book-account"
            onChange={(value) => setAccountId(value ? Number(value) : undefined)}
          />
        )}

        <DateRangePicker
          key={dateRange ? 'range' : 'empty'}
          mode="range"
          value={dateRange}
          selected={dateRange}
          onSelect={setDateRange}
          numberOfMonthsToShow={2}
          placeholder="All dates"
        />

        <Button variant="outline" className="ml-auto" onClick={exportCsv}>
          <Download className="mr-2 h-4 w-4" />
          Export CSV
        </Button>
      </Card>

      {view === 'account' && <StatementView statement={statement} loading={statementQuery.isFetching} error={statementQuery.isError} />}
      {view === 'trial' && <TrialBalanceView trialBalance={trialBalance} loading={trialQuery.isFetching} error={trialQuery.isError} />}
      {view === 'pnl' && <ProfitLossView report={profitLoss} loading={profitLossQuery.isFetching} error={profitLossQuery.isError} />}
    </div>
  );
}
