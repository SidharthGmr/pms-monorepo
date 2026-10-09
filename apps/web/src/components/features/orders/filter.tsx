'use client';
import { DateRangePicker } from '@/components/common/date-range-picker';
import ListToolbar, { SortDirection, SortOption, StatusOption } from '@/components/common/list-toolbar';
import { ListView } from '@/components/common/view-switch';
import { OrderStatus } from '@/enums/order-status.enum';
import { DateRange } from 'react-day-picker';

export type { SortDirection };

export interface OrderFilterValue {
  search: string;
  /** `null` means every status, which is what the API does when status is omitted. */
  status: OrderStatus | null;
  /** Filters on `createdAt`. */
  dateRange: DateRange | undefined;
  sortBy: string;
  sortDirection: SortDirection;
}

export const DEFAULT_ORDER_FILTER: OrderFilterValue = {
  search: '',
  status: null,
  dateRange: undefined,
  sortBy: 'createdAt',
  sortDirection: 'DESC',
};

// The same tones the detail page and the bill use, so one order reads alike everywhere.
const STATUS_OPTIONS: StatusOption<OrderStatus | null>[] = [
  { label: 'All', value: null },
  { label: 'Pending', value: OrderStatus.Pending, dot: 'bg-amber-500' },
  { label: 'Confirmed', value: OrderStatus.Confirmed, dot: 'bg-sky-500' },
  { label: 'Shipped', value: OrderStatus.Shipped, dot: 'bg-indigo-500' },
  { label: 'Delivered', value: OrderStatus.Delivered, dot: 'bg-emerald-500' },
  { label: 'Cancelled', value: OrderStatus.Cancelled, dot: 'bg-rose-500' },
  { label: 'Returned', value: OrderStatus.Returned, dot: 'bg-orange-500' },
];

// Mirrors SORTABLE_COLUMNS in order.repository.ts - anything else falls back to createdAt.
const SORT_OPTIONS: SortOption[] = [
  { value: 'createdAt', label: 'Date placed' },
  { value: 'orderNumber', label: 'Order number' },
  { value: 'grandTotal', label: 'Order total' },
  { value: 'status', label: 'Status' },
  { value: 'updatedAt', label: 'Last updated' },
];

interface OrderListFilterProps {
  value: OrderFilterValue;
  onChange: (patch: Partial<OrderFilterValue>) => void;
  onReset: () => void;
  view: ListView;
  onViewChange: (view: ListView) => void;
  total?: number;
  loading?: boolean;
}

// Order wiring of the shared ListToolbar: the date range rides in the leading slot.
export default function OrderListFilter({ value, onChange, onReset, view, onViewChange, total, loading }: OrderListFilterProps) {
  const isFiltered = value.search !== '' || value.status !== null || !!(value.dateRange?.from || value.dateRange?.to);

  return (
    <ListToolbar<OrderStatus | null>
      search={{ value: value.search, onChange: (search) => onChange({ search }), placeholder: 'Search order no., customer…' }}
      status={{ value: value.status, onChange: (status) => onChange({ status }), options: STATUS_OPTIONS, total, loading }}
      sort={{
        value: value.sortBy,
        onChange: (sortBy) => onChange({ sortBy }),
        options: SORT_OPTIONS,
        direction: value.sortDirection,
        onDirectionChange: (sortDirection) => onChange({ sortDirection }),
      }}
      view={{ value: view, onChange: onViewChange, iconOnly: true }}
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
          placeholder="Date placed"
        />
      }
    />
  );
}
