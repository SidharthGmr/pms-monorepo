'use client';

import ListToolbar, { SortDirection, SortOption, StatusOption } from '@/components/common/list-toolbar';
import { SelectSearch } from '@/components/common/select-search';
import { ListView } from '@/components/common/view-switch';
import { useGetAllCategories } from '@/hooks/service-hooks/useCategoryService';
import { useGetAllProducts } from '@/hooks/service-hooks/useProductService';
import { useMemo } from 'react';

export type { SortDirection };

/** `null` means both: the API only filters when `isActive` is sent. */
export type ActiveFilter = 'active' | 'retired' | null;

export interface VariantFilterValue {
  search: string;
  productId?: number;
  categoryId?: number;
  active: ActiveFilter;
  sortBy: string;
  sortDirection: SortDirection;
}

export const DEFAULT_VARIANT_FILTER: VariantFilterValue = {
  search: '',
  productId: undefined,
  categoryId: undefined,
  active: null,
  sortBy: 'createdAt',
  sortDirection: 'DESC',
};

const ACTIVE_OPTIONS: StatusOption<ActiveFilter>[] = [
  { label: 'All', value: null },
  { label: 'Active', value: 'active', dot: 'bg-emerald-500' },
  { label: 'Retired', value: 'retired', dot: 'bg-zinc-400' },
];

// Mirrors SORTABLE_COLUMNS in product-variant.repository.ts - anything else falls back to createdAt.
const SORT_OPTIONS: SortOption[] = [
  { value: 'createdAt', label: 'Date added' },
  { value: 'name', label: 'Name' },
  { value: 'sku', label: 'SKU' },
  { value: 'id', label: 'Id' },
];

interface ProductVariantFilterProps {
  value: VariantFilterValue;
  onChange: (patch: Partial<VariantFilterValue>) => void;
  onReset: () => void;
  view: ListView;
  onViewChange: (view: ListView) => void;
  /** Total matching records, shown beside the active select. */
  total?: number;
  loading?: boolean;
}

// Variant wiring of the shared ListToolbar: product and category selects ride in the leading slot.
export default function ProductVariantFilter({ value, onChange, onReset, view, onViewChange, total, loading }: ProductVariantFilterProps) {
  // `showAllRecords` matters here - without it these lists stop at the first ten records.
  const { data: productsResponse } = useGetAllProducts({ showAllRecords: true });
  const { data: categoriesResponse } = useGetAllCategories({ showAllRecords: true });

  const productItems = useMemo(() => (productsResponse?.data?.data?.data ?? []).map((product) => ({ label: product.name, value: product.id })), [productsResponse]);
  const categoryItems = useMemo(() => (categoriesResponse?.data?.data?.data ?? []).map((category) => ({ label: category.name, value: category.id })), [categoriesResponse]);

  const isFiltered = value.search !== '' || value.productId !== undefined || value.categoryId !== undefined || value.active !== null;

  return (
    <ListToolbar<ActiveFilter>
      search={{ value: value.search, onChange: (search) => onChange({ search }), placeholder: 'Search name, SKU or barcode…' }}
      status={{ value: value.active, onChange: (active) => onChange({ active }), options: ACTIVE_OPTIONS, total, loading }}
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
            onChange={(next) => onChange({ productId: next === '' || next === undefined ? undefined : +next })}
            buttonClass="h-9 bg-background sm:w-44"
            containerName="variant-product-filter"
          />
          <SelectSearch
            value={value.categoryId}
            placeholder="All categories"
            items={categoryItems}
            valueType="number"
            onChange={(next) => onChange({ categoryId: next === '' || next === undefined ? undefined : +next })}
            buttonClass="h-9 bg-background sm:w-44"
            containerName="variant-category-filter"
          />
        </>
      }
    />
  );
}
