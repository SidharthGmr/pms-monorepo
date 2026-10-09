'use client';
import { DateRangePicker } from '@/components/common/date-range-picker';
import ListToolbar, { SortDirection, SortOption, STATUS_FILTER_OPTIONS } from '@/components/common/list-toolbar';
import { SelectSearch } from '@/components/common/select-search';
import { ListView } from '@/components/common/view-switch';
import { useGetAllBrandNames } from '@/hooks/service-hooks/useBrandNameService';
import { useGetAllCategories } from '@/hooks/service-hooks/useCategoryService';
import { Status } from '@pms/types';
import { useMemo } from 'react';
import { DateRange } from 'react-day-picker';

export type { SortDirection };

export interface ProductFilterValue {
  search: string;
  /** `null` means "everything except Trash", which is what the API does when status is omitted - same as brands and categories. */
  status: Status | null;
  categoryId?: number;
  brandNameId?: number;
  /** Filters on `createdAt`. */
  dateRange: DateRange | undefined;
  sortBy: string;
  sortDirection: SortDirection;
}

export const DEFAULT_PRODUCT_FILTER: ProductFilterValue = {
  search: '',
  status: null,
  categoryId: undefined,
  brandNameId: undefined,
  dateRange: undefined,
  sortBy: 'createdAt',
  sortDirection: 'DESC',
};

// Mirrors SORTABLE_COLUMNS in product.repository.ts - anything else falls back to createdAt.
const SORT_OPTIONS: SortOption[] = [
  { value: 'createdAt', label: 'Date added' },
  { value: 'name', label: 'Name' },
  { value: 'displayOrder', label: 'Display order' },
  { value: 'updatedAt', label: 'Last updated' },
  { value: 'id', label: 'Id' },
];

interface ProductListFilterProps {
  value: ProductFilterValue;
  onChange: (patch: Partial<ProductFilterValue>) => void;
  onReset: () => void;
  view: ListView;
  onViewChange: (view: ListView) => void;
  /** Total matching records, shown beside the status select. */
  total?: number;
  loading?: boolean;
}

// Product wiring of the shared ListToolbar: category and brand selects ride in the leading
// slot, the created-date range in the trailing one.
export default function ProductListFilter({ value, onChange, onReset, view, onViewChange, total, loading }: ProductListFilterProps) {
  // `showAllRecords` matters here - without it these lists stop at the first ten records.
  const { data: categoriesResponse } = useGetAllCategories({ showAllRecords: true });
  const { data: brandNamesResponse } = useGetAllBrandNames({ showAllRecords: true });

  const categoryItems = useMemo(
    () => (categoriesResponse?.data?.data?.data ?? []).map((category) => ({ label: category.name, value: category.id })),
    [categoriesResponse]
  );
  const brandItems = useMemo(
    () => (brandNamesResponse?.data?.data?.data ?? []).map((brand) => ({ label: brand.name, value: brand.id })),
    [brandNamesResponse]
  );

  const isFiltered =
    value.search !== '' ||
    value.status !== null ||
    value.categoryId !== undefined ||
    value.brandNameId !== undefined ||
    !!(value.dateRange?.from || value.dateRange?.to);

  return (
    <ListToolbar<Status | null>
      search={{ value: value.search, onChange: (search) => onChange({ search }), placeholder: 'Search name, slug or SKU…' }}
      status={{ value: value.status, onChange: (status) => onChange({ status }), options: STATUS_FILTER_OPTIONS, total, loading }}
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
            value={value.categoryId}
            placeholder="All categories"
            items={categoryItems}
            valueType="number"
            onChange={(next) => onChange({ categoryId: next === '' || next === undefined ? undefined : +next })}
            buttonClass="h-9 bg-background sm:w-44"
            containerName="product-category-filter"
          />
          <SelectSearch
            value={value.brandNameId}
            placeholder="All brands"
            items={brandItems}
            valueType="number"
            onChange={(next) => onChange({ brandNameId: next === '' || next === undefined ? undefined : +next })}
            buttonClass="h-9 bg-background sm:w-44"
            containerName="product-brand-filter"
          />
        </>
      }
      trailing={
        <DateRangePicker
          key={value.dateRange ? 'range' : 'empty'}
          mode="range"
          value={value.dateRange}
          selected={value.dateRange}
          onSelect={(dateRange) => onChange({ dateRange })}
          numberOfMonthsToShow={2}
          placeholder="Date added"
        />
      }
    />
  );
}
