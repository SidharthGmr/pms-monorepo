'use client';
import ListToolbar, { SortDirection, SortOption, StatusOption } from '@/components/common/list-toolbar';
import { AccountCategory, AccountCategoryEnum } from '@pms/types';

export type { SortDirection };

export interface LedgerAccountFilterValue {
  search: string;
  category: AccountCategory | null;
  sortBy: string;
  sortDirection: SortDirection;
}

export const DEFAULT_LEDGER_ACCOUNT_FILTER: LedgerAccountFilterValue = {
  search: '',
  category: null,
  sortBy: 'code',
  sortDirection: 'ASC',
};

const CATEGORY_OPTIONS: StatusOption<AccountCategory | null>[] = [
  { label: 'All', value: null },
  { label: 'Assets', value: AccountCategoryEnum.Asset, dot: 'bg-sky-500' },
  { label: 'Liabilities', value: AccountCategoryEnum.Liability, dot: 'bg-rose-500' },
  { label: 'Equity', value: AccountCategoryEnum.Equity, dot: 'bg-violet-500' },
  { label: 'Income', value: AccountCategoryEnum.Income, dot: 'bg-emerald-500' },
  { label: 'Expenses', value: AccountCategoryEnum.Expense, dot: 'bg-amber-500' },
];

// Mirrors SORTABLE_COLUMNS in ledger-account.repository.ts - anything else falls back to code.
const SORT_OPTIONS: SortOption[] = [
  { value: 'code', label: 'Code' },
  { value: 'name', label: 'Name' },
  { value: 'category', label: 'Category' },
  { value: 'subType', label: 'Type' },
  { value: 'displayOrder', label: 'Display order' },
  { value: 'createdAt', label: 'Created' },
  { value: 'updatedAt', label: 'Last updated' },
];

interface LedgerAccountListFilterProps {
  value: LedgerAccountFilterValue;
  onChange: (patch: Partial<LedgerAccountFilterValue>) => void;
  onReset: () => void;
  total?: number;
  loading?: boolean;
}

export default function LedgerAccountListFilter({ value, onChange, onReset, total, loading }: LedgerAccountListFilterProps) {
  const isFiltered = value.search !== '' || value.category !== null;

  return (
    <ListToolbar<AccountCategory | null>
      search={{ value: value.search, onChange: (search) => onChange({ search }), placeholder: 'Search code or name…' }}
      status={{ value: value.category, onChange: (category) => onChange({ category }), options: CATEGORY_OPTIONS, total, loading }}
      sort={{
        value: value.sortBy,
        onChange: (sortBy) => onChange({ sortBy }),
        options: SORT_OPTIONS,
        direction: value.sortDirection,
        onDirectionChange: (sortDirection) => onChange({ sortDirection }),
      }}
      isFiltered={isFiltered}
      onReset={onReset}
    />
  );
}
