'use client';
import { ReactNode, useEffect, useState } from 'react';
import { useDebounce } from 'use-debounce';
import { ArrowDownWideNarrow, ArrowUpNarrowWide, RotateCcw, Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import ViewSwitch, { ListView } from '@/components/common/view-switch';
import { cn } from '@/lib/utils';
import StatusSelect, { StatusOption } from './status-select';

export type SortDirection = 'ASC' | 'DESC';

export interface SortOption {
  value: string;
  label: string;
}

interface ListToolbarProps<TStatus extends string | null> {
  /** Debounced text search. `onChange` fires once typing pauses, and at once when cleared. */
  search?: {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    debounceMs?: number;
  };
  /** Status select with coloured dots; `total` shows the matching count beside it. */
  status?: {
    value: TStatus;
    onChange: (value: TStatus) => void;
    options: StatusOption<TStatus>[];
    total?: number;
    loading?: boolean;
  };
  /** Sort field plus an ascending / descending toggle in one control. */
  sort?: {
    value: string;
    onChange: (value: string) => void;
    options: SortOption[];
    direction: SortDirection;
    onDirectionChange: (direction: SortDirection) => void;
  };
  /** Cards / Table switch. */
  view?: {
    value: ListView;
    onChange: (view: ListView) => void;
    /** Show only the icons in the Cards / Table switch. */
    iconOnly?: boolean;
  };
  /** Shows a reset button while true. */
  isFiltered?: boolean;
  onReset?: () => void;
  /** Extra controls after the status select (left group). */
  leading?: ReactNode;
  /** Extra controls before the view switch (right group). */
  trailing?: ReactNode;
  className?: string;
}

// The filter bar used above listing pages: search and status on the left, sort / layout on
// the right, stacking on phones. Every section is optional, so a page only renders the
// controls it supports. The page owns the filter state; this just renders and reports changes.
export default function ListToolbar<TStatus extends string | null = string | null>({
  search,
  status,
  sort,
  view,
  isFiltered,
  onReset,
  leading,
  trailing,
  className,
}: ListToolbarProps<TStatus>) {
  const isDesc = sort?.direction === 'DESC';

  return (
    <div className={cn('rounded-xl border border-border/70 bg-card shadow-sm', className)}>
      <div className="flex flex-col gap-3 p-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          {search && <SearchBox value={search.value} onChange={search.onChange} placeholder={search.placeholder} debounceMs={search.debounceMs} />}
          {status && (
            <StatusSelect
              value={status.value}
              onChange={status.onChange}
              options={status.options}
              total={status.total}
              loading={status.loading}
              className="sm:w-44"
            />
          )}
          {leading}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {trailing}
          {sort && (
            <div className="flex items-center rounded-md border bg-background">
              <Select value={sort.value} onValueChange={sort.onChange}>
                <SelectTrigger className="h-9 w-[150px] border-0 shadow-none focus:ring-0" aria-label="Sort by">
                  <span className="text-muted-foreground">Sort&nbsp;</span>
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  {sort.options.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <button
                type="button"
                onClick={() => sort.onDirectionChange(isDesc ? 'ASC' : 'DESC')}
                aria-label={isDesc ? 'Sorted descending, switch to ascending' : 'Sorted ascending, switch to descending'}
                title={isDesc ? 'Descending' : 'Ascending'}
                className="flex h-9 w-9 items-center justify-center border-l text-muted-foreground hover:bg-accent hover:text-foreground"
              >
                {isDesc ? <ArrowDownWideNarrow className="h-4 w-4" /> : <ArrowUpNarrowWide className="h-4 w-4" />}
              </button>
            </div>
          )}

          {view && <ViewSwitch value={view.value} onChange={view.onChange} iconOnly={view.iconOnly} className="h-9 items-center" />}

          {isFiltered && onReset && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-9 w-9 text-muted-foreground"
              onClick={onReset}
              aria-label="Reset filters"
              title="Reset filters"
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

interface SearchBoxProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  debounceMs?: number;
  className?: string;
}

// The box updates on every keystroke; the parent only hears about it once typing pauses.
export function SearchBox({ value, onChange, placeholder = 'Search…', debounceMs = 500, className }: SearchBoxProps) {
  const [text, setText] = useState(value);
  const [debounced] = useDebounce(text.trim(), debounceMs);

  useEffect(() => {
    if (debounced !== value) onChange(debounced);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debounced]);

  // Keep the box in step when the parent resets the filters.
  useEffect(() => {
    if (value === '' && text !== '') setText('');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return (
    <div className={cn('relative sm:w-72', className)}>
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
      <Input placeholder={placeholder} value={text} onChange={(e) => setText(e.target.value)} aria-label={placeholder} className="h-9 pl-9 pr-8" />
      {text && (
        <button
          type="button"
          onClick={() => setText('')}
          aria-label="Clear search"
          className="absolute right-2 top-1/2 flex h-5 w-5 -translate-y-1/2 items-center justify-center rounded text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}

export { default as StatusSelect, STATUS_FILTER_OPTIONS } from './status-select';
export type { StatusOption } from './status-select';
