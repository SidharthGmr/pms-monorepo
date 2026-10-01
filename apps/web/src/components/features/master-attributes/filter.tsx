'use client';
import { useEffect, useState } from 'react';
import { useDebounce } from 'use-debounce';
import { ArrowDownWideNarrow, ArrowUpNarrowWide, LayoutGrid, RotateCcw, Search, Table2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { StatusValues } from '@/enums/status-values.enum';
import { cn } from '@/lib/utils';

export type SortDirection = 'ASC' | 'DESC';
export type ListView = 'grid' | 'table';

export interface MasterAttributeFilterValue {
  search: string;
  /** `''` means every live status, which is what the API does when status is omitted. */
  status: string;
  sortBy: string;
  sortDirection: SortDirection;
}

export const DEFAULT_MASTER_ATTRIBUTE_FILTER: MasterAttributeFilterValue = {
  search: '',
  status: '',
  sortBy: 'createdAt',
  sortDirection: 'DESC',
};

// Trash is listed so a deleted attribute can be found and restored by editing its status.
const STATUS_TABS: { label: string; value: string }[] = [
  { label: 'All', value: '' },
  { label: 'Published', value: StatusValues.Published },
  { label: 'Draft', value: StatusValues.Draft },
  { label: 'Trash', value: StatusValues.Trash },
];

// Mirrors SORTABLE_COLUMNS in master-attribute.repository.ts - anything else falls back to createdAt server-side.
const SORT_OPTIONS = [
  { value: 'createdAt', label: 'Date added' },
  { value: 'updatedAt', label: 'Last updated' },
  { value: 'name', label: 'Name' },
  { value: 'code', label: 'Code' },
  { value: 'displayOrder', label: 'Display order' },
  { value: 'status', label: 'Status' },
];

const VIEWS: { value: ListView; label: string; icon: typeof LayoutGrid }[] = [
  { value: 'grid', label: 'Card view', icon: LayoutGrid },
  { value: 'table', label: 'Table view', icon: Table2 },
];

interface MasterAttributeFilterProps {
  value: MasterAttributeFilterValue;
  onChange: (patch: Partial<MasterAttributeFilterValue>) => void;
  onReset: () => void;
  view: ListView;
  onViewChange: (view: ListView) => void;
  /** Total matching records, shown next to the active status tab. */
  total?: number;
  loading?: boolean;
}

export default function MasterAttributeFilter({ value, onChange, onReset, view, onViewChange, total, loading }: MasterAttributeFilterProps) {
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
    value.search !== DEFAULT_MASTER_ATTRIBUTE_FILTER.search ||
    value.status !== DEFAULT_MASTER_ATTRIBUTE_FILTER.status ||
    value.sortBy !== DEFAULT_MASTER_ATTRIBUTE_FILTER.sortBy ||
    value.sortDirection !== DEFAULT_MASTER_ATTRIBUTE_FILTER.sortDirection;

  const isDesc = value.sortDirection === 'DESC';

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="flex-1">
          <Input
            icon={Search}
            placeholder="Search attributes by name or code…"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            aria-label="Search attributes"
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

        <div className="inline-flex rounded-md border bg-muted/40 p-0.5" role="radiogroup" aria-label="Layout">
          {VIEWS.map(({ value: v, label, icon: Icon }) => {
            const active = v === view;
            return (
              <button
                key={v}
                type="button"
                role="radio"
                aria-checked={active}
                aria-label={label}
                title={label}
                onClick={() => onViewChange(v)}
                className={cn(
                  'inline-flex h-7 items-center gap-1.5 rounded px-2.5 text-xs font-medium transition-colors',
                  active ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">{v === 'grid' ? 'Cards' : 'Table'}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
