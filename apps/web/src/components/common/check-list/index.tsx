'use client';
import { useId, useMemo, useState } from 'react';
import { Check, ChevronDown, Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface CheckListItem<T extends string | number> {
  label: string;
  value: T;
  hint?: string | number;
}

export interface CheckListProps<T extends string | number> {
  items: CheckListItem<T>[];
  values: T[];
  onChange: (values: T[]) => void;
  title?: string;
  searchable?: boolean;
  searchPlaceholder?: string;
  maxHeight?: number | string;
  emptyText?: string;
  loading?: boolean;
  /** Adds a chevron to the title that folds the box down to its header. */
  collapsible?: boolean;
  defaultOpen?: boolean;
  className?: string;
}

/**
 * The multi-select twin of RadioList: every option visible in a bordered, scrollable box, any
 * number ticked at once. Native checkboxes underneath so keyboard and screen readers work, and
 * ticked rows float to the top so the current selection is always in view.
 */
export default function CheckList<T extends string | number>({
  items,
  values,
  onChange,
  title,
  searchable = false,
  searchPlaceholder = 'Search…',
  maxHeight = 400,
  emptyText = 'Nothing to show.',
  loading = false,
  collapsible = false,
  defaultOpen = true,
  className,
}: CheckListProps<T>) {
  const groupId = useId();
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(!collapsible || defaultOpen);
  const selected = useMemo(() => new Set(values), [values]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    const matched = q ? items.filter((item) => item.label.toLowerCase().includes(q)) : items;
    return [...matched].sort((a, b) => Number(selected.has(b.value)) - Number(selected.has(a.value)));
  }, [items, query, selected]);

  const toggle = (value: T) => onChange(selected.has(value) ? values.filter((v) => v !== value) : [...values, value]);

  return (
    <fieldset className={cn('rounded-md border bg-background', className)}>
      {title && <legend className="sr-only">{title}</legend>}

      {(title || searchable) && (
        <div className="border-b">
          {title && (
            <div className="flex items-center justify-between gap-2 px-3 py-2">
              {collapsible ? (
                <button
                  type="button"
                  onClick={() => setOpen((v) => !v)}
                  aria-expanded={open}
                  aria-controls={`${groupId}-body`}
                  className="flex min-w-0 flex-1 items-center gap-1.5 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground hover:text-foreground"
                >
                  <ChevronDown className={cn('h-3.5 w-3.5 shrink-0 transition-transform', !open && '-rotate-90')} />
                  <span className="truncate">{title}</span>
                  {!open && values.length > 0 && <span className="rounded-full bg-primary/10 px-1.5 text-[10px] normal-case tracking-normal text-primary">{values.length} selected</span>}
                </button>
              ) : (
                <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{title}</span>
              )}
              {values.length > 0 ? (
                <button type="button" onClick={() => onChange([])} className="shrink-0 text-[11px] font-medium text-primary hover:underline">
                  Clear {values.length}
                </button>
              ) : (
                <span className="shrink-0 text-[11px] tabular-nums text-muted-foreground">{loading ? '…' : items.length}</span>
              )}
            </div>
          )}
          {searchable && open && (
            <div className={cn('relative px-2 pb-2', !title && 'pt-2')}>
              <Search className="pointer-events-none absolute left-4 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" style={{ marginTop: title ? -4 : 0 }} aria-hidden />
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

      <div id={`${groupId}-body`} className={cn('overflow-y-auto p-1', !open && 'hidden')} style={{ maxHeight }}>
        {loading ? (
          <div className="space-y-1 p-1" aria-busy="true">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-7 animate-pulse rounded bg-muted/60" />
            ))}
          </div>
        ) : visible.length === 0 ? (
          <p className="px-2 py-3 text-xs text-muted-foreground">{query ? `No match for “${query.trim()}”.` : emptyText}</p>
        ) : (
          visible.map((item) => {
            const checked = selected.has(item.value);
            return (
              <label
                key={String(item.value)}
                className={cn(
                  'flex cursor-pointer items-center gap-2.5 rounded px-2 py-1.5 text-sm transition-colors hover:bg-accent',
                  checked ? 'bg-primary/5 font-medium text-foreground' : 'text-muted-foreground'
                )}
              >
                <input type="checkbox" name={groupId} className="peer sr-only" checked={checked} onChange={() => toggle(item.value)} />
                <span
                  aria-hidden
                  className={cn(
                    'flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-ring peer-focus-visible:ring-offset-1',
                    checked ? 'border-primary bg-primary text-primary-foreground' : 'border-input bg-background'
                  )}
                >
                  <Check className={cn('h-3 w-3 transition-transform', checked ? 'scale-100' : 'scale-0')} strokeWidth={3} />
                </span>
                <span className="min-w-0 flex-1 truncate">{item.label}</span>
                {item.hint !== undefined && <span className="shrink-0 text-[11px] tabular-nums text-muted-foreground">{item.hint}</span>}
              </label>
            );
          })
        )}
      </div>
    </fieldset>
  );
}
