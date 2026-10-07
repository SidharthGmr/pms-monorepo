'use client';
import { DateRangePicker } from '@/components/common/date-range-picker';
import ListToolbar, { SortDirection, SortOption, StatusOption } from '@/components/common/list-toolbar';
import { SelectSearch } from '@/components/common/select-search';
import { ListView } from '@/components/common/view-switch';
import { useGetAllProducts } from '@/hooks/service-hooks/useProductService';
import { useGetProductVariants } from '@/hooks/service-hooks/useProductVariantService';
import { useMemo } from 'react';
import { DateRange } from 'react-day-picker';

export type { SortDirection };

export type ChangeDirection = 'increase' | 'decrease' | undefined;
export type PriceStateFilter = 'live' | 'scheduled' | 'ended' | null;

export interface PriceHistoryFilterValue {
  search: string;
  productId?: number;
  variantId?: number;
  /** Filters on `effectiveFrom` - the date a price took force, not the date it was typed. */
  dateRange: DateRange | undefined;
  changeDirection: ChangeDirection;
  state: PriceStateFilter;
  sortBy: string;
  sortDirection: SortDirection;
}

export const DEFAULT_PRICE_FILTER: PriceHistoryFilterValue = {
  search: '',
  productId: undefined,
  variantId: undefined,
  dateRange: undefined,
  changeDirection: undefined,
  state: null,
  sortBy: 'effectiveFrom',
  sortDirection: 'DESC',
};

const STATE_OPTIONS: StatusOption<PriceStateFilter>[] = [
  { label: 'All', value: null },
  { label: 'Live now', value: 'live', dot: 'bg-emerald-500' },
  { label: 'Scheduled', value: 'scheduled', dot: 'bg-sky-500' },
  { label: 'Ended', value: 'ended', dot: 'bg-zinc-400' },
];

const DIRECTION_ITEMS = [
  { label: 'Any change', value: '' },
  { label: 'Increases only', value: 'increase' },
  { label: 'Decreases only', value: 'decrease' },
];

// Mirrors SORTABLE_COLUMNS in price-history.repository.ts - anything else falls back to effectiveFrom.
const SORT_OPTIONS: SortOption[] = [
  { value: 'effectiveFrom', label: 'Effective date' },
  { value: 'sellingPrice', label: 'Selling price' },
  { value: 'costPrice', label: 'Cost price' },
  { value: 'id', label: 'Recorded' },
];

interface PriceHistoryFilterProps {
  value: PriceHistoryFilterValue;
  onChange: (patch: Partial<PriceHistoryFilterValue>) => void;
  onReset: () => void;
  view: ListView;
  onViewChange: (view: ListView) => void;
  /** Total matching records, shown beside the state select. */
  total?: number;
  loading?: boolean;
}

// Price-history wiring of the shared ListToolbar: product, variant, effective-date range and
// the direction of the change ride in the leading slot, since this ledger has no status column.
export default function PriceHistoryFilter({ value, onChange, onReset, view, onViewChange, total, loading }: PriceHistoryFilterProps) {
  const { data: productsResponse } = useGetAllProducts({ showAllRecords: true });
  // Variants only exist per product, so this dropdown stays empty until one is picked.
  const { data: variantsResponse } = useGetProductVariants(value.productId ?? 0, { recordPerPage: 100 }, !!value.productId);

  const productItems = useMemo(() => (productsResponse?.data?.data?.data ?? []).map((product) => ({ label: product.name, value: product.id })), [productsResponse]);

  const variantItems = useMemo(
    () => (variantsResponse?.data?.data?.data ?? []).map((variant) => ({ label: variant.sku ? `${variant.sku}` : `Variant #${variant.id}`, value: variant.id })),
    [variantsResponse]
  );

  const isFiltered =
    value.search !== '' ||
    value.productId !== undefined ||
    value.variantId !== undefined ||
    !!(value.dateRange?.from || value.dateRange?.to) ||
    value.changeDirection !== undefined ||
    value.state !== null;

  return (
    <ListToolbar<PriceStateFilter>
      search={{ value: value.search, onChange: (search) => onChange({ search }), placeholder: 'Search reason, SKU or product…' }}
      status={{ value: value.state, onChange: (state) => onChange({ state }), options: STATE_OPTIONS, total, loading }}
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
        <>
          <SelectSearch
            value={value.productId}
            placeholder="All products"
            items={productItems}
            valueType="number"
            onChange={(next) => onChange({ productId: next === '' || next === undefined ? undefined : +next, variantId: undefined })}
            buttonClass="h-9 bg-background sm:w-44"
            containerName="price-history-product-filter"
          />
          <SelectSearch
            value={value.variantId}
            placeholder={value.productId ? 'All variants' : 'Pick a product'}
            items={variantItems}
            valueType="number"
            onChange={(next) => onChange({ variantId: next === '' || next === undefined ? undefined : +next })}
            buttonClass="h-9 bg-background sm:w-40"
            containerName="price-history-variant-filter"
          />
          <DateRangePicker
            key={value.dateRange ? 'range' : 'empty'}
            mode="range"
            value={value.dateRange}
            selected={value.dateRange}
            onSelect={(dateRange) => onChange({ dateRange })}
            numberOfMonthsToShow={2}
            placeholder="Effective between"
            buttonClass="bg-background"
          />
          <SelectSearch
            value={value.changeDirection ?? ''}
            placeholder="Any change"
            items={DIRECTION_ITEMS}
            valueType="string"
            disableSearch
            onChange={(next) => onChange({ changeDirection: next === '' || next === undefined ? undefined : (String(next) as 'increase' | 'decrease') })}
            buttonClass="h-9 bg-background sm:w-36"
            containerName="price-history-direction-filter"
          />
        </>
      }
    />
  );
}
