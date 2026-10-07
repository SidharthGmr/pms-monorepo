'use client';
import { DateRange } from 'react-day-picker';
import ListToolbar, { SortDirection, SortOption, STATUS_FILTER_OPTIONS } from '@/components/common/list-toolbar';
import { DateRangePicker } from '@/components/common/date-range-picker';
import { ListView } from '@/components/common/view-switch';
import { Status } from '@pms/types';

export type { SortDirection };

export interface SupplierFilterValue {
  search: string;
  /** `null` means "everything except Trash", which is what the API does when status is omitted - same as brands and categories. */
  status: Status | null;
  /** Filters on `createdAt`. */
  dateRange: DateRange | undefined;
  sortBy: string;
  sortDirection: SortDirection;
}

export const DEFAULT_SUPPLIER_FILTER: SupplierFilterValue = {
  search: '',
  status: null,
  dateRange: undefined,
  sortBy: 'displayOrder',
  sortDirection: 'ASC',
};

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
    <ListToolbar<Status | null>
      search={{ value: value.search, onChange: (search) => onChange({ search }), placeholder: 'Search name, contact, email, phone…' }}
      status={{ value: value.status, onChange: (status) => onChange({ status }), options: STATUS_FILTER_OPTIONS, total, loading }}
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
