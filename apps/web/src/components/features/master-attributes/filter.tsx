'use client';
import ListToolbar, { SortDirection, SortOption, STATUS_FILTER_OPTIONS } from '@/components/common/list-toolbar';
import { ListView } from '@/components/common/view-switch';
import { Status } from '@pms/types';

export type { SortDirection, ListView };

export interface MasterAttributeFilterValue {
  search: string;
  /** `null` means "everything except Trash", which is what the API does when status is omitted - same as brands and categories. */
  status: Status | null;
  sortBy: string;
  sortDirection: SortDirection;
}

export const DEFAULT_MASTER_ATTRIBUTE_FILTER: MasterAttributeFilterValue = {
  search: '',
  status: null,
  sortBy: 'createdAt',
  sortDirection: 'DESC',
};

// Mirrors SORTABLE_COLUMNS in master-attribute.repository.ts - anything else falls back to createdAt server-side.
const SORT_OPTIONS: SortOption[] = [
  { value: 'createdAt', label: 'Date added' },
  { value: 'updatedAt', label: 'Last updated' },
  { value: 'name', label: 'Name' },
  { value: 'code', label: 'Code' },
  { value: 'displayOrder', label: 'Display order' },
  { value: 'status', label: 'Status' },
];

interface MasterAttributeFilterProps {
  value: MasterAttributeFilterValue;
  onChange: (patch: Partial<MasterAttributeFilterValue>) => void;
  onReset: () => void;
  view: ListView;
  onViewChange: (view: ListView) => void;
  /** Total matching records, shown beside the status select. */
  total?: number;
  loading?: boolean;
}

// Attribute-specific wiring of the shared ListToolbar: which sort fields exist and the default filter.
export default function MasterAttributeFilter({ value, onChange, onReset, view, onViewChange, total, loading }: MasterAttributeFilterProps) {
  const isFiltered =
    value.search !== DEFAULT_MASTER_ATTRIBUTE_FILTER.search ||
    value.status !== DEFAULT_MASTER_ATTRIBUTE_FILTER.status ||
    value.sortBy !== DEFAULT_MASTER_ATTRIBUTE_FILTER.sortBy ||
    value.sortDirection !== DEFAULT_MASTER_ATTRIBUTE_FILTER.sortDirection;

  return (
    <ListToolbar<Status | null>
      search={{ value: value.search, onChange: (search) => onChange({ search }), placeholder: 'Search by name or code…' }}
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
