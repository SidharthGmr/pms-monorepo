'use client';
import { DateRangePicker } from '@/components/common/date-range-picker';
import ListToolbar, { SortDirection, SortOption, STATUS_FILTER_OPTIONS } from '@/components/common/list-toolbar';
import { ListView } from '@/components/common/view-switch';
import { Status } from '@pms/types';
import { DateRange } from 'react-day-picker';

export type { SortDirection };

export interface AttributeFilterValue {
  search: string;
  /** `null` means every live status. */
  status: Status | null;
  /** Filters on `createdAt`. */
  dateRange: DateRange | undefined;
  sortBy: string;
  sortDirection: SortDirection;
}

export const DEFAULT_ATTRIBUTE_FILTER: AttributeFilterValue = {
  search: '',
  status: null,
  dateRange: undefined,
  sortBy: 'createdAt',
  sortDirection: 'DESC',
};

// Mirrors SORTABLE_COLUMNS in attribute.repository.ts - anything else falls back to createdAt.
const SORT_OPTIONS: SortOption[] = [
  { value: 'createdAt', label: 'Date added' },
  { value: 'name', label: 'Name' },
  { value: 'unit', label: 'Unit' },
  { value: 'displayOrder', label: 'Display order' },
  { value: 'status', label: 'Status' },
  { value: 'updatedAt', label: 'Last updated' },
];

interface AttributeFilterProps {
  value: AttributeFilterValue;
  onChange: (patch: Partial<AttributeFilterValue>) => void;
  onReset: () => void;
  view: ListView;
  onViewChange: (view: ListView) => void;
  total?: number;
  loading?: boolean;
}

// Attribute wiring of the shared ListToolbar: the date range rides in the leading slot.
export default function AttributeFilter({ value, onChange, onReset, view, onViewChange, total, loading }: AttributeFilterProps) {
  const isFiltered = value.search !== '' || value.status !== null || !!(value.dateRange?.from || value.dateRange?.to);

  return (
    <ListToolbar<Status | null>
      search={{ value: value.search, onChange: (search) => onChange({ search }), placeholder: 'Search attributes…' }}
      status={{ value: value.status, onChange: (status) => onChange({ status }), options: STATUS_FILTER_OPTIONS, total, loading }}
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
          placeholder="Date added"
        />
      }
    />
  );
}
