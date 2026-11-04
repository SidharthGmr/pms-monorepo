'use client';
import ListToolbar, { SortDirection, SortOption } from '@/components/common/list-toolbar';
import { StatusOption } from '@/components/common/list-toolbar/status-select';

export type { SortDirection };

export type TaxActiveFilter = 'active' | 'inactive' | null;

export interface TaxFilterValue {
  search: string;
  /** `null` means every tax that is not deleted, active or not. */
  active: TaxActiveFilter;
  sortBy: string;
  sortDirection: SortDirection;
}

export const DEFAULT_TAX_FILTER: TaxFilterValue = {
  search: '',
  active: null,
  sortBy: 'createdAt',
  sortDirection: 'DESC',
};

const ACTIVE_FILTER_OPTIONS: StatusOption<TaxActiveFilter>[] = [
  { label: 'All', value: null },
  { label: 'Active', value: 'active', dot: 'bg-emerald-500' },
  { label: 'Inactive', value: 'inactive', dot: 'bg-rose-500' },
];

// Mirrors SORTABLE_COLUMNS in tax.repository.ts - anything else is ignored server-side.
const SORT_OPTIONS: SortOption[] = [
  { value: 'createdAt', label: 'Date added' },
  { value: 'updatedAt', label: 'Last updated' },
  { value: 'name', label: 'Name' },
  { value: 'code', label: 'Code' },
  { value: 'rate', label: 'Rate' },
];

interface TaxFilterProps {
  value: TaxFilterValue;
  onChange: (patch: Partial<TaxFilterValue>) => void;
  onReset: () => void;
  total?: number;
  loading?: boolean;
}

// Tax-specific wiring of the shared ListToolbar: which sort fields exist and the default filter.
export default function TaxFilter({ value, onChange, onReset, total, loading }: TaxFilterProps) {
  const isFiltered =
    value.search !== DEFAULT_TAX_FILTER.search ||
    value.active !== DEFAULT_TAX_FILTER.active ||
    value.sortBy !== DEFAULT_TAX_FILTER.sortBy ||
    value.sortDirection !== DEFAULT_TAX_FILTER.sortDirection;

  return (
    <ListToolbar<TaxActiveFilter>
      search={{ value: value.search, onChange: (search) => onChange({ search }), placeholder: 'Search taxes…' }}
      status={{ value: value.active, onChange: (active) => onChange({ active }), options: ACTIVE_FILTER_OPTIONS, total, loading }}
      sort={{
        value: value.sortBy,
        onChange: (sortBy) => onChange({ sortBy }),
        options: SORT_OPTIONS,
        direction: value.sortDirection,
        onDirectionChange: (sortDirection) => onChange({ sortDirection }),
      }}
      isFiltered={isFiltered}
      onReset={onReset}
    />
  );
}
