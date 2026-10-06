'use client';
import ListToolbar, { SortDirection, SortOption, StatusOption } from '@/components/common/list-toolbar';
import { ListView } from '@/components/common/view-switch';
import { StatusValues } from '@/enums/status-values.enum';

export type { SortDirection, ListView };

export interface MasterAttributeFilterValue {
  search: string;
  /** `''` means every live status, which is what the API does when status is omitted. */
  status: string;
  sortBy: string;
  sortDirection: SortDirection;
}

export const DEFAULT_MASTER_ATTRIBUTE_FILTER: MasterAttributeFilterValue = {
  search: '',
  status: '',
  sortBy: 'createdAt',
  sortDirection: 'DESC',
};

// Trash is listed so a deleted attribute can be found and restored by editing its status.
const STATUS_OPTIONS: StatusOption<string>[] = [
  { label: 'All', value: '' },
  { label: 'Published', value: StatusValues.Published, dot: 'bg-emerald-500' },
  { label: 'Draft', value: StatusValues.Draft, dot: 'bg-amber-500' },
  { label: 'Trash', value: StatusValues.Trash, dot: 'bg-rose-500' },
];

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
    <ListToolbar<string>
      search={{ value: value.search, onChange: (search) => onChange({ search }), placeholder: 'Search by name or code…' }}
      status={{ value: value.status, onChange: (status) => onChange({ status }), options: STATUS_OPTIONS, total, loading }}
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
