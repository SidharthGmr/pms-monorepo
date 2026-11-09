'use client';
import { DateRangePicker } from '@/components/common/date-range-picker';
import ListToolbar, { SortDirection, SortOption, StatusOption } from '@/components/common/list-toolbar';
import { VoucherType, VoucherTypeEnum } from '@pms/types';
import { DateRange } from 'react-day-picker';

export type { SortDirection };

export interface DayBookFilterValue {
  search: string;
  voucherType: VoucherType | null;
  dateRange: DateRange | undefined;
  sortBy: string;
  sortDirection: SortDirection;
}

export const DEFAULT_DAY_BOOK_FILTER: DayBookFilterValue = {
  search: '',
  voucherType: null,
  dateRange: undefined,
  sortBy: 'entryDate',
  sortDirection: 'DESC',
};

const VOUCHER_TYPE_OPTIONS: StatusOption<VoucherType | null>[] = [
  { label: 'All', value: null },
  { label: 'Sales', value: VoucherTypeEnum.Sales, dot: 'bg-emerald-500' },
  { label: 'Receipts', value: VoucherTypeEnum.Receipt, dot: 'bg-sky-500' },
  { label: 'Purchases', value: VoucherTypeEnum.Purchase, dot: 'bg-amber-500' },
  { label: 'Payments', value: VoucherTypeEnum.Payment, dot: 'bg-orange-500' },
  { label: 'Sales Returns', value: VoucherTypeEnum.SalesReturn, dot: 'bg-rose-500' },
  { label: 'Journal', value: VoucherTypeEnum.Journal, dot: 'bg-slate-500' },
  { label: 'Opening', value: VoucherTypeEnum.Opening, dot: 'bg-violet-500' },
];

// Mirrors SORTABLE_COLUMNS in journal-entry.repository.ts - anything else falls back to entryDate.
const SORT_OPTIONS: SortOption[] = [
  { value: 'entryDate', label: 'Entry date' },
  { value: 'voucherNumber', label: 'Voucher number' },
  { value: 'voucherType', label: 'Voucher type' },
  { value: 'totalDebit', label: 'Amount' },
  { value: 'createdAt', label: 'Recorded' },
];

interface DayBookFilterProps {
  value: DayBookFilterValue;
  onChange: (patch: Partial<DayBookFilterValue>) => void;
  onReset: () => void;
  total?: number;
  loading?: boolean;
}

export default function DayBookFilter({ value, onChange, onReset, total, loading }: DayBookFilterProps) {
  const isFiltered = value.search !== '' || value.voucherType !== null || !!(value.dateRange?.from || value.dateRange?.to);

  return (
    <ListToolbar<VoucherType | null>
      search={{ value: value.search, onChange: (search) => onChange({ search }), placeholder: 'Search voucher no., narration, reference…' }}
      status={{ value: value.voucherType, onChange: (voucherType) => onChange({ voucherType }), options: VOUCHER_TYPE_OPTIONS, total, loading }}
      sort={{
        value: value.sortBy,
        onChange: (sortBy) => onChange({ sortBy }),
        options: SORT_OPTIONS,
        direction: value.sortDirection,
        onDirectionChange: (sortDirection) => onChange({ sortDirection }),
      }}
      isFiltered={isFiltered}
      onReset={onReset}
      leading={
        <DateRangePicker
          key={value.dateRange ? 'range' : 'empty'}
          mode="range"
          value={value.dateRange}
          selected={value.dateRange}
          onSelect={(dateRange) => onChange({ dateRange })}
          numberOfMonthsToShow={2}
          placeholder="Entry date"
        />
      }
    />
  );
}
