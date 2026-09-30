'use client';
import { useEffect, useState } from 'react';
import { useDebounce } from 'use-debounce';
import { DateRange } from 'react-day-picker';
import { ArrowDownWideNarrow, ArrowUpNarrowWide, RotateCcw, Search } from 'lucide-react';
import { Status } from '@pms/types';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DateRangePicker } from '@/components/common/date-range-picker';
import { cn } from '@/lib/utils';

export type SortDirection = 'ASC' | 'DESC';

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

const STATUS_TABS: { label: string; value: Status | null }[] = [
  { label: 'All', value: null },
  { label: 'Published', value: 'Published' },
  { label: 'Draft', value: 'Draft' },
];

// Mirrors SORTABLE_COLUMNS in category.repository.ts - anything else falls back to createdAt server-side.
const SORT_OPTIONS = [
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
  /** Total matching records, shown next to the active status tab. */
  total?: number;
  loading?: boolean;
}

export default function CategoryFilter({ value, onChange, onReset, total, loading }: CategoryFilterProps) {
  // The box updates on every keystroke; the query only fires once typing pauses.
  const [searchText, setSearchText] = useState(value.search);
  const [debouncedSearch] = useDebounce(searchText.trim(), 500);

  useEffect(() => {
    if (debouncedSearch !== value.search) onChange({ search: debouncedSearch });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch]);

  // Keep the box in step when the parent resets the filters.
  useEffect(() => {
    if (value.search === '' && searchText !== '') setSearchText('');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value.search]);

  const isFiltered =
    value.search !== DEFAULT_CATEGORY_FILTER.search ||
    value.status !== DEFAULT_CATEGORY_FILTER.status ||
    !!(value.dateRange?.from || value.dateRange?.to) ||
    value.includeDeleted !== DEFAULT_CATEGORY_FILTER.includeDeleted ||
    value.sortBy !== DEFAULT_CATEGORY_FILTER.sortBy ||
    value.sortDirection !== DEFAULT_CATEGORY_FILTER.sortDirection;

  const isDesc = value.sortDirection === 'DESC';

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="flex-1">
          <Input
            icon={Search}
            placeholder="Search categories by name…"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            aria-label="Search categories"
          />
        </div>

        <div className="w-full lg:w-auto">
          {/* `key` remounts the picker on reset because it keeps its own copy of the range. */}
          <DateRangePicker
            key={value.dateRange ? 'range' : 'empty'}
            mode="range"
            value={value.dateRange}
            selected={value.dateRange}
            onSelect={(dateRange) => onChange({ dateRange })}
            numberOfMonthsToShow={2}
            placeholder="Date added"
          />
        </div>

        <div className="flex items-center gap-2">
          <Select value={value.sortBy} onValueChange={(sortBy) => onChange({ sortBy })}>
            <SelectTrigger className="h-10 w-full lg:w-44" aria-label="Sort by">
              <span className="text-muted-foreground">Sort:&nbsp;</span>
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              {SORT_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            type="button"
            variant="outline"
            size="icon"
            className="shrink-0"
            onClick={() => onChange({ sortDirection: isDesc ? 'ASC' : 'DESC' })}
            aria-label={isDesc ? 'Sorted descending, switch to ascending' : 'Sorted ascending, switch to descending'}
            title={isDesc ? 'Descending' : 'Ascending'}
          >
            {isDesc ? <ArrowDownWideNarrow /> : <ArrowUpNarrowWide />}
          </Button>

          {isFiltered && (
            <Button type="button" variant="ghost" className="shrink-0 text-muted-foreground" onClick={onReset}>
              <RotateCcw />
              Reset
            </Button>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2" role="tablist" aria-label="Filter by status">
          {STATUS_TABS.map((tab) => {
            const active = tab.value === value.status;
            return (
              <button
                key={tab.label}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => onChange({ status: tab.value })}
                className={cn(
                  'inline-flex h-8 items-center gap-2 rounded-full border px-3 text-sm font-medium transition-colors',
                  active ? 'border-primary bg-primary text-primary-foreground' : 'border-input bg-background text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                )}
              >
                {tab.label}
                {active && total !== undefined && (
                  <span className={cn('rounded-full bg-primary-foreground/20 px-1.5 text-xs tabular-nums', loading && 'opacity-60')}>{total}</span>
                )}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2">
          <Switch id="category-include-deleted" checked={value.includeDeleted} onCheckedChange={(includeDeleted) => onChange({ includeDeleted })} />
          <Label htmlFor="category-include-deleted" className="cursor-pointer text-sm font-normal text-muted-foreground">
            Show deleted
          </Label>
        </div>
      </div>
    </div>
  );
}
