'use client';
import { ReactNode, useEffect, useState } from 'react';
import { useDebounce } from 'use-debounce';
import { ArrowDownWideNarrow, ArrowUpNarrowWide, ListFilter, RotateCcw, Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DateRangePicker } from '@/components/common/date-range-picker';
import type { DateRange } from 'react-day-picker';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import ViewSwitch, { ListView } from '@/components/common/view-switch';
import { cn } from '@/lib/utils';
import StatusSelect, { StatusOption } from './status-select';
import { Card } from '@/components/ui/card';

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
  /** Date-range filter after the status select; the control only renders when this is given. */
  dateRange?: {
    value: DateRange | undefined;
    onChange: (range: DateRange | undefined) => void;
    placeholder?: string;
    numberOfMonthsToShow?: number;
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
  /** Shows a reset button, and a dot on the filter toggle, while true. */
  isFiltered?: boolean;
  onReset?: () => void;
  /** Extra controls after the status select, always visible. */
  leading?: ReactNode;
  /** The page's extra filters. Folded away behind the filter icon until asked for. */
  trailing?: ReactNode;
  className?: string;
}

/**
 * The filter bar above every listing page: search, status and the page's own `leading`
 * controls on the left; the filter toggle, sort, layout switch and reset on the right.
 * `trailing` filters live in a second row that the funnel icon discloses - they are the
 * long tail, so they cost no width until someone reaches for them. The row opens by
 * itself when the page mounts already filtered (deep link), so an applied filter is
 * never invisible. The page owns the filter state; this renders and reports changes.
 */
export default function ListToolbar<TStatus extends string | null = string | null>({
  search,
  status,
  dateRange,
  sort,
  view,
  isFiltered,
  onReset,
  leading,
  trailing,
  className,
}: ListToolbarProps<TStatus>) {
  const isDesc = sort?.direction === 'DESC';
  const sortLabel = sort?.options.find((option) => option.value === sort.value)?.label ?? 'Default';
  const [showTrailing, setShowTrailing] = useState(() => !!isFiltered);

  return (
    <Card className={cn('!p-2 space-y-2', className)}>
      <div className="flex flex-col gap-2  lg:flex-row lg:flex-wrap lg:items-center">
        <div className=" flex-1 grid grid-cols-1 sm:grid-cols-3 gap-2">
          {search && <SearchBox value={search.value} onChange={search.onChange} placeholder={search.placeholder} debounceMs={search.debounceMs} />}
          {status && (
            <StatusSelect value={status.value} onChange={status.onChange} options={status.options} total={status.total} loading={status.loading} />
          )}

          <div className="flex flex-wrap items-center gap-2 lg:ml-auto">
            {dateRange && (
              <DateRangePicker
                key={dateRange.value ? 'range' : 'empty'}
                mode="range"
                value={dateRange.value}
                selected={dateRange.value}
                onSelect={dateRange.onChange}
                numberOfMonthsToShow={dateRange.numberOfMonthsToShow ?? 2}
                placeholder={dateRange.placeholder ?? 'Date added'}
              />
            )}
            {sort && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="h-9 w-9 text-muted-foreground"
                    aria-label={`Sort: ${sortLabel}, ${isDesc ? 'descending' : 'ascending'}`}
                    title={`Sort: ${sortLabel} · ${isDesc ? 'descending' : 'ascending'}`}
                  >
                    {isDesc ? <ArrowDownWideNarrow className="h-4 w-4" /> : <ArrowUpNarrowWide className="h-4 w-4" />}
                  </Button>
                </DropdownMenuTrigger>
                {/* preventDefault keeps the menu up, so field and direction adjust in one visit. */}
                <DropdownMenuContent align="end" sideOffset={8} className="w-48 rounded-lg">
                  <DropdownMenuLabel>Sort by</DropdownMenuLabel>
                  <DropdownMenuRadioGroup value={sort.value} onValueChange={sort.onChange}>
                    {sort.options.map((option) => (
                      <DropdownMenuRadioItem key={option.value} value={option.value} onSelect={(e) => e.preventDefault()}>
                        {option.label}
                      </DropdownMenuRadioItem>
                    ))}
                  </DropdownMenuRadioGroup>
                  <DropdownMenuSeparator />
                  <DropdownMenuRadioGroup value={sort.direction} onValueChange={(direction) => sort.onDirectionChange(direction as SortDirection)}>
                    <DropdownMenuRadioItem value="ASC" onSelect={(e) => e.preventDefault()}>
                      <ArrowUpNarrowWide className="mr-2 h-4 w-4 text-muted-foreground" />
                      Ascending
                    </DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="DESC" onSelect={(e) => e.preventDefault()}>
                      <ArrowDownWideNarrow className="mr-2 h-4 w-4 text-muted-foreground" />
                      Descending
                    </DropdownMenuRadioItem>
                  </DropdownMenuRadioGroup>
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            {view && <ViewSwitch value={view.value} onChange={view.onChange} iconOnly={view.iconOnly} className="h-9 items-center" />}
            {trailing && (
              <Button
                type="button"
                variant={showTrailing ? 'secondary' : 'outline'}
                size="icon"
                className="relative h-9 w-9"
                onClick={() => setShowTrailing((open) => !open)}
                aria-expanded={showTrailing}
                aria-label="More filters"
                title="More filters"
              >
                <ListFilter className="h-4 w-4" />
                {isFiltered && <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-primary" aria-hidden />}
              </Button>
            )}
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
          {leading}
        </div>
      </div>
      {trailing && showTrailing && <div className="grid grid-cols-3 gap-3">{trailing}</div>}
    </Card>
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
  }, [debounced]);

  useEffect(() => {
    if (value === '' && text !== '') setText('');
  }, [value]);

  return (
    <div className={cn('relative ', className)}>
      <Search className="pointer-events-none absolute left-3 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
      <Input placeholder={placeholder} value={text} onChange={(e) => setText(e.target.value)} aria-label={placeholder} className=" pl-9 pr-8" />
      {text && (
        <button
          type="button"
          onClick={() => setText('')}
          aria-label="Clear search"
          className="absolute right-2 top-1/2 z-10 flex h-5 w-5 -translate-y-1/2 items-center justify-center rounded text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}

export { default as StatusSelect, STATUS_FILTER_OPTIONS } from './status-select';
export type { StatusOption } from './status-select';
