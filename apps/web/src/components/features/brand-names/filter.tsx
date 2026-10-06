'use client';
import { Status } from '@pms/types';
import ListToolbar, { SortDirection, SortOption, STATUS_FILTER_OPTIONS } from '@/components/common/list-toolbar';
import { ListView } from '@/components/common/view-switch';

export type { SortDirection };

export interface BrandNameFilterValue {
  search: string;
  /** `null` means "everything except Trash", which is what the API does when status is omitted. */
  status: Status | null;
  sortBy: string;
  sortDirection: SortDirection;
}

export const DEFAULT_BRAND_NAME_FILTER: BrandNameFilterValue = {
  search: '',
  status: null,
  sortBy: 'createdAt',
  sortDirection: 'DESC',
};

// Mirrors SORTABLE_COLUMNS in brand-name.repository.ts - anything else is ignored server-side.
const SORT_OPTIONS: SortOption[] = [
  { value: 'createdAt', label: 'Date added' },
  { value: 'updatedAt', label: 'Last updated' },
  { value: 'name', label: 'Name' },
  { value: 'displayOrder', label: 'Display order' },
  { value: 'status', label: 'Status' },
];

interface BrandNameFilterProps {
  value: BrandNameFilterValue;
  onChange: (patch: Partial<BrandNameFilterValue>) => void;
  onReset: () => void;
  view: ListView;
  onViewChange: (view: ListView) => void;
  /** Total matching records, shown beside the status select. */
  total?: number;
  loading?: boolean;
}

// Brand-specific wiring of the shared ListToolbar: which sort fields exist and the default filter.
export default function BrandNameFilter({ value, onChange, onReset, view, onViewChange, total, loading }: BrandNameFilterProps) {
  const isFiltered =
    value.search !== DEFAULT_BRAND_NAME_FILTER.search ||
    value.status !== DEFAULT_BRAND_NAME_FILTER.status ||
    value.sortBy !== DEFAULT_BRAND_NAME_FILTER.sortBy ||
    value.sortDirection !== DEFAULT_BRAND_NAME_FILTER.sortDirection;

  return (
    <ListToolbar<Status | null>
      search={{ value: value.search, onChange: (search) => onChange({ search }), placeholder: 'Search brands…' }}
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
    />
  );
}
