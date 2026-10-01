'use client';
import { useId, useMemo, useState } from 'react';
import { Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface RadioListItem<T extends string | number> {
  label: string;
  value: T;
  /** Optional small text on the right, e.g. a count. */
  hint?: string | number;
}

export interface RadioListProps<T extends string | number> {
  items: RadioListItem<T>[];
  /** `undefined` selects the "all" option. */
  value: T | undefined;
  onChange: (value: T | undefined) => void;
  /** Box header. */
  title?: string;
  /** Label of the first row that clears the selection. Pass `null` to omit it. */
  allLabel?: string | null;
  /** Shows a search box above the rows. */
  searchable?: boolean;
  searchPlaceholder?: string;
  /** Height the rows may use before the box scrolls. */
  maxHeight?: number | string;
  emptyText?: string;
  loading?: boolean;
  className?: string;
}

/**
 * Every option visible at once as a radio list inside a bordered, scrollable box - the
 * alternative to a select when the user benefits from seeing the whole set. Native radios
 * underneath, so arrow keys, Tab and screen readers behave like any radio group.
 */
export default function RadioList<T extends string | number>({
  items,
  value,
  onChange,
  title,
  allLabel = 'All',
  searchable = false,
  searchPlaceholder = 'Search…',
  maxHeight = 300,
  emptyText = 'Nothing to show.',
  loading = false,
  className,
}: RadioListProps<T>) {
  const name = useId();
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? items.filter((item) => item.label.toLowerCase().includes(q)) : items;
  }, [items, query]);

  const showAll = allLabel !== null && !query.trim();

  return (
    <fieldset className={cn('rounded-md border bg-background', className)}>
      {title && <legend className="sr-only">{title}</legend>}

      {(title || searchable) && (
        <div className="border-b">
          {title && (
            <div className="flex items-center justify-between px-3 py-2">
              <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{title}</span>
              <span className="text-[11px] tabular-nums text-muted-foreground">{loading ? '…' : items.length}</span>
            </div>
          )}
          {searchable && (
            <div className={cn('relative px-2 pb-2', !title && 'pt-2')}>
              <Search
                className="pointer-events-none absolute left-4 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground"
                style={{ marginTop: title ? -4 : 0 }}
                aria-hidden
              />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={searchPlaceholder}
                aria-label={title ? `Search ${title.toLowerCase()}` : 'Search options'}
                className="h-8 w-full rounded border bg-background pl-7 pr-7 text-sm placeholder:text-muted-foreground focus-visible:border-primary focus-visible:outline-none [&::-webkit-search-cancel-button]:hidden"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery('')}
                  aria-label="Clear search"
                  className="absolute right-4 top-1/2 -translate-y-1/2 rounded text-muted-foreground hover:text-foreground"
                  style={{ marginTop: title ? -4 : 0 }}
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          )}
        </div>
      )}

      <div className="overflow-y-auto p-1" style={{ maxHeight }}>
        {loading ? (
          <div className="space-y-1 p-1" aria-busy="true">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-7 animate-pulse rounded bg-muted/60" />
            ))}
          </div>
        ) : (
          <>
            {showAll && <Row name={name} label={allLabel as string} checked={value === undefined} onSelect={() => onChange(undefined)} />}
            {filtered.map((item) => (
              <Row
                key={String(item.value)}
                name={name}
                label={item.label}
                hint={item.hint}
                checked={value === item.value}
                onSelect={() => onChange(item.value)}
              />
            ))}
            {filtered.length === 0 && (
              <p className="px-2 py-3 text-xs text-muted-foreground">{query ? `No match for “${query.trim()}”.` : emptyText}</p>
            )}
          </>
        )}
      </div>
    </fieldset>
  );
}

interface RowProps {
  name: string;
  label: string;
  hint?: string | number;
  checked: boolean;
  onSelect: () => void;
}

function Row({ name, label, hint, checked, onSelect }: RowProps) {
  return (
    <label
      className={cn(
        'flex cursor-pointer items-center gap-2.5 rounded px-2 py-1.5 text-sm transition-colors hover:bg-accent',
        checked ? 'bg-primary/5 font-medium text-foreground' : 'text-muted-foreground'
      )}
    >
      <input type="radio" name={name} className="peer sr-only" checked={checked} onChange={onSelect} />
      <span
        aria-hidden
        className={cn(
          'flex h-4 w-4 shrink-0 items-center justify-center rounded-full border transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-ring peer-focus-visible:ring-offset-1',
          checked ? 'border-primary' : 'border-input'
        )}
      >
        <span className={cn('h-2 w-2 rounded-full bg-primary transition-transform', checked ? 'scale-100' : 'scale-0')} />
      </span>
      <span className="min-w-0 flex-1 truncate">{label}</span>
      {hint !== undefined && <span className="shrink-0 text-[11px] tabular-nums text-muted-foreground">{hint}</span>}
    </label>
  );
}
