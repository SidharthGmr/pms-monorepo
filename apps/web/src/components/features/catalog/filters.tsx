'use client';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { useLocale } from '@/i18n/locale-provider';
import { cn } from '@/lib/utils';
import { CatalogFacetsDto } from '@pms/types';
import { RotateCcw, Star } from 'lucide-react';
import { useEffect, useState } from 'react';

/**
 * The e-commerce sidebar. It owns no data: facets come from /catalog/facets, the current
 * selection lives in the page, and every control reports a patch upward. Price inputs are
 * local state applied on blur/Enter so typing "12" does not fire a request at "1".
 */

export interface CatalogFilterValue {
  categoryIds: number[];
  brandNameIds: number[];
  entryIds: number[];
  minPrice?: number;
  maxPrice?: number;
  inStockOnly: boolean;
  offersOnly: boolean;
  minRating?: number;
}

export const EMPTY_CATALOG_FILTER: CatalogFilterValue = {
  categoryIds: [],
  brandNameIds: [],
  entryIds: [],
  inStockOnly: false,
  offersOnly: false,
};

export const isFiltered = (value: CatalogFilterValue): boolean =>
  value.categoryIds.length > 0 ||
  value.brandNameIds.length > 0 ||
  value.entryIds.length > 0 ||
  value.minPrice != null ||
  value.maxPrice != null ||
  value.inStockOnly ||
  value.offersOnly ||
  value.minRating != null;

const toggle = (list: number[], id: number): number[] => (list.includes(id) ? list.filter((item) => item !== id) : [...list, id]);

interface CatalogFiltersProps {
  facets?: CatalogFacetsDto;
  loading: boolean;
  value: CatalogFilterValue;
  onChange: (patch: Partial<CatalogFilterValue>) => void;
  onReset: () => void;
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="border-b border-border/70 pb-4">
      <h3 className="mb-2.5 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">{title}</h3>
      {children}
    </section>
  );
}

function CheckList({ options, selected, onToggle }: { options: { id: number; name: string; count: number }[]; selected: number[]; onToggle: (id: number) => void }) {
  return (
    <ul className="space-y-1.5">
      {options.map((option) => (
        <li key={option.id}>
          <Label className="flex cursor-pointer items-center gap-2 text-sm font-normal">
            <Checkbox checked={selected.includes(option.id)} onCheckedChange={() => onToggle(option.id)} />
            <span className="min-w-0 flex-1 truncate">{option.name}</span>
            <span className="text-[11px] tabular-nums text-muted-foreground">{option.count}</span>
          </Label>
        </li>
      ))}
    </ul>
  );
}

export default function CatalogFilters({ facets, loading, value, onChange, onReset }: CatalogFiltersProps) {
  const { formatCurrency } = useLocale();
  const [minText, setMinText] = useState('');
  const [maxText, setMaxText] = useState('');

  useEffect(() => {
    setMinText(value.minPrice != null ? String(value.minPrice) : '');
    setMaxText(value.maxPrice != null ? String(value.maxPrice) : '');
  }, [value.minPrice, value.maxPrice]);

  const applyPrice = () => {
    const min = minText.trim() === '' ? undefined : Math.max(0, Number(minText));
    const max = maxText.trim() === '' ? undefined : Math.max(0, Number(maxText));
    onChange({
      minPrice: Number.isFinite(min as number) ? min : undefined,
      maxPrice: Number.isFinite(max as number) ? max : undefined,
    });
  };

  if (loading) {
    return (
      <div className="space-y-5" aria-busy="true">
        {[0, 1, 2].map((block) => (
          <div key={block} className="space-y-2">
            <Skeleton className="h-3.5 w-20" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold">Filters</h2>
        {isFiltered(value) && (
          <Button variant="ghost" size="sm" className="h-7 gap-1 px-2 text-xs" onClick={onReset}>
            <RotateCcw className="h-3 w-3" />
            Clear all
          </Button>
        )}
      </div>

      {!!facets?.categories.length && (
        <Section title="Category">
          <CheckList options={facets.categories} selected={value.categoryIds} onToggle={(id) => onChange({ categoryIds: toggle(value.categoryIds, id) })} />
        </Section>
      )}

      {!!facets?.brands.length && (
        <Section title="Brand">
          <CheckList options={facets.brands} selected={value.brandNameIds} onToggle={(id) => onChange({ brandNameIds: toggle(value.brandNameIds, id) })} />
        </Section>
      )}

      {facets?.attributes.map((attribute) => {
        const isColor = attribute.entries.some((entry) => entry.colorHex);
        return (
          <Section key={attribute.id} title={attribute.name}>
            {isColor ? (
              <div className="flex flex-wrap gap-2">
                {attribute.entries.map((entry) => {
                  const active = value.entryIds.includes(entry.id);
                  return (
                    <button
                      key={entry.id}
                      type="button"
                      title={`${entry.value} (${entry.count})`}
                      aria-pressed={active}
                      onClick={() => onChange({ entryIds: toggle(value.entryIds, entry.id) })}
                      className={cn(
                        'h-7 w-7 rounded-full border-2 transition-all',
                        active ? 'border-primary ring-2 ring-primary/30' : 'border-border/70 hover:border-muted-foreground'
                      )}
                      style={{ backgroundColor: entry.colorHex ?? undefined }}
                    >
                      <span className="sr-only">{entry.value}</span>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {attribute.entries.map((entry) => {
                  const active = value.entryIds.includes(entry.id);
                  return (
                    <button
                      key={entry.id}
                      type="button"
                      aria-pressed={active}
                      onClick={() => onChange({ entryIds: toggle(value.entryIds, entry.id) })}
                      className={cn(
                        'rounded-md border px-2.5 py-1 text-xs font-medium transition-colors',
                        active ? 'border-primary bg-primary text-primary-foreground' : 'border-border/70 hover:border-muted-foreground'
                      )}
                    >
                      {entry.value}
                      <span className={cn('ml-1 text-[10px]', active ? 'text-primary-foreground/70' : 'text-muted-foreground')}>{entry.count}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </Section>
        );
      })}

      <Section title="Price">
        {facets?.price && (
          <p className="mb-2 text-[11px] text-muted-foreground">
            {formatCurrency(facets.price.min)} – {formatCurrency(facets.price.max)}
          </p>
        )}
        <div className="flex items-center gap-2">
          <Input
            inputMode="numeric"
            placeholder="Min"
            value={minText}
            onChange={(e) => setMinText(e.target.value)}
            onBlur={applyPrice}
            onKeyDown={(e) => e.key === 'Enter' && applyPrice()}
            className="h-8 text-xs"
            aria-label="Minimum price"
          />
          <span className="text-muted-foreground">–</span>
          <Input
            inputMode="numeric"
            placeholder="Max"
            value={maxText}
            onChange={(e) => setMaxText(e.target.value)}
            onBlur={applyPrice}
            onKeyDown={(e) => e.key === 'Enter' && applyPrice()}
            className="h-8 text-xs"
            aria-label="Maximum price"
          />
        </div>
      </Section>

      <Section title="Rating">
        <div className="flex flex-wrap gap-1.5">
          {[4, 3, 2, 1].map((rating) => {
            const active = value.minRating === rating;
            return (
              <button
                key={rating}
                type="button"
                aria-pressed={active}
                onClick={() => onChange({ minRating: active ? undefined : rating })}
                className={cn(
                  'flex items-center gap-1 rounded-md border px-2 py-1 text-xs font-medium transition-colors',
                  active ? 'border-primary bg-primary text-primary-foreground' : 'border-border/70 hover:border-muted-foreground'
                )}
              >
                <Star className={cn('h-3 w-3', active ? 'fill-current' : 'fill-amber-400 text-amber-400')} />
                {rating}+
              </button>
            );
          })}
        </div>
      </Section>

      <section className="space-y-3 pt-1">
        <Label className="flex cursor-pointer items-center justify-between gap-2 text-sm font-normal">
          In stock only
          <Switch checked={value.inStockOnly} onCheckedChange={(inStockOnly) => onChange({ inStockOnly })} />
        </Label>
        <Label className="flex cursor-pointer items-center justify-between gap-2 text-sm font-normal">
          On offer
          <Switch checked={value.offersOnly} onCheckedChange={(offersOnly) => onChange({ offersOnly })} />
        </Label>
      </section>
    </div>
  );
}
