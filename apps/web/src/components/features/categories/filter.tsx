'use client';
import { DateRange } from 'react-day-picker';
import { Status } from '@pms/types';
import ListToolbar, { SortDirection, SortOption, StatusOption } from '@/components/common/list-toolbar';
import { DateRangePicker } from '@/components/common/date-range-picker';
import { ListView } from '@/components/common/view-switch';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

export type { SortDirection };

export interface CategoryFilterValue {
  search: string;
  /** `null` means every live status. Categories are soft-deleted, so there is no Trash bucket here. */
  status: Status | null;
  /** Filters on `createdAt`. */
  dateRange: DateRange | undefined;
  /** Also list soft-deleted rows. */
  includeDeleted: boolean;
  sortBy: string;
  sortDirection: SortDirection;
}

export const DEFAULT_CATEGORY_FILTER: CategoryFilterValue = {
  search: '',
  status: null,
  dateRange: undefined,
  includeDeleted: false,
  sortBy: 'createdAt',
  sortDirection: 'DESC',
};

const STATUS_OPTIONS: StatusOption<Status | null>[] = [
  { label: 'All', value: null },
  { label: 'Published', value: 'Published', dot: 'bg-emerald-500' },
  { label: 'Draft', value: 'Draft', dot: 'bg-amber-500' },
];

// Mirrors SORTABLE_COLUMNS in category.repository.ts - anything else falls back to createdAt server-side.
const SORT_OPTIONS: SortOption[] = [
  { value: 'createdAt', label: 'Date added' },
  { value: 'updatedAt', label: 'Last updated' },
  { value: 'name', label: 'Name' },
  { value: 'displayOrder', label: 'Display order' },
  { value: 'status', label: 'Status' },
];

interface CategoryFilterProps {
  value: CategoryFilterValue;
  onChange: (patch: Partial<CategoryFilterValue>) => void;
  onReset: () => void;
  view: ListView;
  onViewChange: (view: ListView) => void;
  /** Total matching records, shown beside the status select. */
  total?: number;
  loading?: boolean;
}

// Category-specific wiring of the shared ListToolbar: date range and "show deleted" ride in its slots.
export default function CategoryFilter({ value, onChange, onReset, view, onViewChange, total, loading }: CategoryFilterProps) {
  const isFiltered =
    value.search !== DEFAULT_CATEGORY_FILTER.search ||
    value.status !== DEFAULT_CATEGORY_FILTER.status ||
    !!(value.dateRange?.from || value.dateRange?.to) ||
    value.includeDeleted !== DEFAULT_CATEGORY_FILTER.includeDeleted ||
    value.sortBy !== DEFAULT_CATEGORY_FILTER.sortBy ||
    value.sortDirection !== DEFAULT_CATEGORY_FILTER.sortDirection;

  return (
    <ListToolbar<Status | null>
      search={{ value: value.search, onChange: (search) => onChange({ search }), placeholder: 'Search categories…' }}
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
      trailing={
        <div className="flex h-9 items-center gap-2 rounded-md border bg-background px-3">
          <Switch id="category-include-deleted" checked={value.includeDeleted} onCheckedChange={(includeDeleted) => onChange({ includeDeleted })} />
          <Label htmlFor="category-include-deleted" className="cursor-pointer whitespace-nowrap text-xs font-normal text-muted-foreground">
            Show deleted
          </Label>
        </div>
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
