'use client';
import { DateRange } from 'react-day-picker';
import ListToolbar, { SortDirection, SortOption, StatusOption } from '@/components/common/list-toolbar';
import { DateRangePicker } from '@/components/common/date-range-picker';
import { ListView } from '@/components/common/view-switch';
import { StatusValues } from '@/enums/status-values.enum';

export type { SortDirection };

export interface SupplierFilterValue {
  search: string;
  /** `''` means every live status, which is what the API does when status is omitted. */
  status: string;
  /** Filters on `createdAt`. */
  dateRange: DateRange | undefined;
  sortBy: string;
  sortDirection: SortDirection;
}

export const DEFAULT_SUPPLIER_FILTER: SupplierFilterValue = {
  search: '',
  status: '',
  dateRange: undefined,
  sortBy: 'displayOrder',
  sortDirection: 'ASC',
};

const STATUS_OPTIONS: StatusOption<string>[] = [
  { label: 'All', value: '' },
  { label: 'Published', value: StatusValues.Published, dot: 'bg-emerald-500' },
  { label: 'Draft', value: StatusValues.Draft, dot: 'bg-amber-500' },
];

// Mirrors SORTABLE_COLUMNS in supplier.repository.ts - anything else falls back to displayOrder server-side.
const SORT_OPTIONS: SortOption[] = [
  { value: 'displayOrder', label: 'Display order' },
  { value: 'name', label: 'Name' },
  { value: 'createdAt', label: 'Date added' },
  { value: 'updatedAt', label: 'Last updated' },
  { value: 'status', label: 'Status' },
];

interface SupplierFilterProps {
  value: SupplierFilterValue;
  onChange: (patch: Partial<SupplierFilterValue>) => void;
  onReset: () => void;
  view: ListView;
  onViewChange: (view: ListView) => void;
  /** Total matching records, shown beside the status select. */
  total?: number;
  loading?: boolean;
}

// Supplier-specific wiring of the shared ListToolbar: the date range rides in the leading slot.
export default function SupplierFilter({ value, onChange, onReset, view, onViewChange, total, loading }: SupplierFilterProps) {
  const isFiltered =
    value.search !== DEFAULT_SUPPLIER_FILTER.search ||
    value.status !== DEFAULT_SUPPLIER_FILTER.status ||
    !!(value.dateRange?.from || value.dateRange?.to) ||
    value.sortBy !== DEFAULT_SUPPLIER_FILTER.sortBy ||
    value.sortDirection !== DEFAULT_SUPPLIER_FILTER.sortDirection;

  return (
    <ListToolbar<string>
      search={{ value: value.search, onChange: (search) => onChange({ search }), placeholder: 'Search name, contact, email, phone…' }}
      status={{ value: value.status, onChange: (status) => onChange({ status }), options: STATUS_OPTIONS, total, loading }}
      leading={
        <DateRangePicker
          key={value.dateRange ? 'range' : 'empty'}
          mode="range"
          value={value.dateRange}
          selected={value.dateRange}
          onSelect={(dateRange) => onChange({ dateRange })}
          numberOfMonthsToShow={2}
          placeholder="Date added"
        />
      }
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
    />
  );
}
