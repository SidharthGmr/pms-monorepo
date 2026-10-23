'use client';
import { DateRangePicker } from '@/components/common/date-range-picker';
import ListToolbar, { SortDirection, SortOption, StatusOption } from '@/components/common/list-toolbar';
import { DateRange } from 'react-day-picker';
import { ReturnStatus, ReturnStatusEnum } from '@pms/types';

export type { SortDirection };

export interface OrderReturnFilterValue {
  search: string;
  /** `null` means every status, which is what the API does when status is omitted. */
  status: ReturnStatus | null;
  /** Filters on `createdAt`. */
  dateRange: DateRange | undefined;
  sortBy: string;
  sortDirection: SortDirection;
}

export const DEFAULT_ORDER_RETURN_FILTER: OrderReturnFilterValue = {
  search: '',
  status: null,
  dateRange: undefined,
  sortBy: 'createdAt',
  sortDirection: 'DESC',
};

const STATUS_OPTIONS: StatusOption<ReturnStatus | null>[] = [
  { label: 'All', value: null },
  { label: 'Requested', value: ReturnStatusEnum.Requested, dot: 'bg-amber-500' },
  { label: 'Approved', value: ReturnStatusEnum.Approved, dot: 'bg-sky-500' },
  { label: 'Received', value: ReturnStatusEnum.Received, dot: 'bg-indigo-500' },
  { label: 'Completed', value: ReturnStatusEnum.Completed, dot: 'bg-emerald-500' },
  { label: 'Rejected', value: ReturnStatusEnum.Rejected, dot: 'bg-rose-500' },
  { label: 'Cancelled', value: ReturnStatusEnum.Cancelled, dot: 'bg-zinc-400' },
];

// Mirrors SORTABLE_COLUMNS in order-return.repository.ts - anything else falls back to createdAt.
const SORT_OPTIONS: SortOption[] = [
  { value: 'createdAt', label: 'Requested date' },
  { value: 'returnNumber', label: 'Return number' },
  { value: 'refundAmount', label: 'Refund amount' },
  { value: 'status', label: 'Status' },
  { value: 'resolvedAt', label: 'Resolved date' },
];

interface OrderReturnFilterProps {
  value: OrderReturnFilterValue;
  onChange: (patch: Partial<OrderReturnFilterValue>) => void;
  onReset: () => void;
  total?: number;
  loading?: boolean;
}

export default function OrderReturnFilter({ value, onChange, onReset, total, loading }: OrderReturnFilterProps) {
  const isFiltered = value.search !== '' || value.status !== null || !!(value.dateRange?.from || value.dateRange?.to);

  return (
    <ListToolbar<ReturnStatus | null>
      search={{ value: value.search, onChange: (search) => onChange({ search }), placeholder: 'Search return no., invoice, customer…' }}
      status={{ value: value.status, onChange: (status) => onChange({ status }), options: STATUS_OPTIONS, total, loading }}
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
          placeholder="Requested date"
        />
      }
    />
  );
}
