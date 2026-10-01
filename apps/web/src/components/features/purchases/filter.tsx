'use client';
import { useEffect, useState } from 'react';
import { useDebounce } from 'use-debounce';
import { DateRange } from 'react-day-picker';
import { ArrowDownWideNarrow, ArrowUpNarrowWide, RotateCcw, Search } from 'lucide-react';
import { DateRangePicker } from '@/components/common/date-range-picker';
import ViewSwitch, { ListView } from '@/components/common/view-switch';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export type SortDirection = 'ASC' | 'DESC';

export interface PurchaseFilterValue {
  search: string;
  /** Filters on `purchaseDate`. */
  dateRange: DateRange | undefined;
  sortBy: string;
  sortDirection: SortDirection;
}

export const DEFAULT_PURCHASE_FILTER: PurchaseFilterValue = {
  search: '',
  dateRange: undefined,
  sortBy: 'purchaseDate',
  sortDirection: 'DESC',
};

// Mirrors SORTABLE_COLUMNS in purchase.repository.ts - anything else falls back to purchaseDate server-side.
const SORT_OPTIONS = [
  { value: 'purchaseDate', label: 'Purchase date' },
  { value: 'createdAt', label: 'Date recorded' },
  { value: 'totalAmount', label: 'Total cost' },
  { value: 'invoiceNumber', label: 'Invoice number' },
  { value: 'supplierName', label: 'Supplier' },
  { value: 'status', label: 'Status' },
];

interface PurchaseFilterProps {
  value: PurchaseFilterValue;
  onChange: (patch: Partial<PurchaseFilterValue>) => void;
  onReset: () => void;
  view: ListView;
  onViewChange: (view: ListView) => void;
  total?: number;
  loading?: boolean;
}

export default function PurchaseFilter({ value, onChange, onReset, view, onViewChange, total, loading }: PurchaseFilterProps) {
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
    value.search !== DEFAULT_PURCHASE_FILTER.search ||
    !!(value.dateRange?.from || value.dateRange?.to) ||
    value.sortBy !== DEFAULT_PURCHASE_FILTER.sortBy ||
    value.sortDirection !== DEFAULT_PURCHASE_FILTER.sortDirection;

  const isDesc = value.sortDirection === 'DESC';

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="flex-1">
          <Input icon={Search} placeholder="Search by invoice number or supplier…" value={searchText} onChange={(e) => setSearchText(e.target.value)} aria-label="Search purchases" />
        </div>

        <div className="w-full lg:w-auto">
          <DateRangePicker
            key={value.dateRange ? 'range' : 'empty'}
            mode="range"
            value={value.dateRange}
            selected={value.dateRange}
            onSelect={(dateRange) => onChange({ dateRange })}
            numberOfMonthsToShow={2}
            placeholder="Purchase date"
          />
        </div>

        <div className="flex items-center gap-2">
          <Select value={value.sortBy} onValueChange={(sortBy) => onChange({ sortBy })}>
            <SelectTrigger className="h-10 w-full lg:w-48" aria-label="Sort by">
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
        <p className="text-sm text-muted-foreground">
          {total === undefined ? 'Loading…' : `${total} ${total === 1 ? 'purchase' : 'purchases'}`}
          {loading && total !== undefined && <span className="ml-1 text-xs">(updating…)</span>}
        </p>
        <ViewSwitch value={view} onChange={onViewChange} />
      </div>
    </div>
  );
}
