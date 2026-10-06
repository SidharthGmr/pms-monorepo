'use client';
import { useMemo } from 'react';
import ListToolbar, { SortDirection, SortOption, StatusOption } from '@/components/common/list-toolbar';
import { SelectSearch } from '@/components/common/select-search';
import { ListView } from '@/components/common/view-switch';
import { StatusValues } from '@/enums/status-values.enum';
import { useGetAllMasterAttributes } from '@/hooks/service-hooks/useMasterEntryService';

export type { SortDirection };

export interface MasterEntryFilterValue {
  search: string;
  /** `''` means every live status, which is what the API does when status is omitted. */
  status: string;
  attributeId?: number;
  sortBy: string;
  sortDirection: SortDirection;
}

export const DEFAULT_MASTER_ENTRY_FILTER: MasterEntryFilterValue = {
  search: '',
  status: '',
  attributeId: undefined,
  sortBy: 'createdAt',
  sortDirection: 'DESC',
};

const STATUS_OPTIONS: StatusOption<string>[] = [
  { label: 'All', value: '' },
  { label: 'Published', value: StatusValues.Published, dot: 'bg-emerald-500' },
  { label: 'Draft', value: StatusValues.Draft, dot: 'bg-amber-500' },
];

// Mirrors SORTABLE_COLUMNS in master-entry.repository.ts - anything else falls back to createdAt server-side.
const SORT_OPTIONS: SortOption[] = [
  { value: 'createdAt', label: 'Date added' },
  { value: 'updatedAt', label: 'Last updated' },
  { value: 'name', label: 'Label' },
  { value: 'value', label: 'Stored value' },
  { value: 'displayOrder', label: 'Display order' },
  { value: 'status', label: 'Status' },
];

interface MasterEntryFilterProps {
  value: MasterEntryFilterValue;
  onChange: (patch: Partial<MasterEntryFilterValue>) => void;
  onReset: () => void;
  view: ListView;
  onViewChange: (view: ListView) => void;
  /** Total matching records, shown beside the status select. */
  total?: number;
  loading?: boolean;
}

// Value-specific wiring of the shared ListToolbar: the attribute picker rides in the leading slot.
export default function MasterEntryFilter({ value, onChange, onReset, view, onViewChange, total, loading }: MasterEntryFilterProps) {
  const { data: attributesResponse } = useGetAllMasterAttributes({ showAllRecords: true, status: StatusValues.Published });
  const attributeItems = useMemo(
    () => (attributesResponse?.data?.data?.data ?? []).map((attribute) => ({ label: `${attribute.name} (${attribute.code})`, value: attribute.id })),
    [attributesResponse]
  );

  const isFiltered =
    value.search !== DEFAULT_MASTER_ENTRY_FILTER.search ||
    value.status !== DEFAULT_MASTER_ENTRY_FILTER.status ||
    value.attributeId !== undefined ||
    value.sortBy !== DEFAULT_MASTER_ENTRY_FILTER.sortBy ||
    value.sortDirection !== DEFAULT_MASTER_ENTRY_FILTER.sortDirection;

  return (
    <ListToolbar<string>
      search={{ value: value.search, onChange: (search) => onChange({ search }), placeholder: 'Search by label or value…' }}
      status={{ value: value.status, onChange: (status) => onChange({ status }), options: STATUS_OPTIONS, total, loading }}
      leading={
        <div className="sm:w-56">
          <SelectSearch
            value={value.attributeId ?? ''}
            placeholder="All attributes"
            items={attributeItems}
            valueType="number"
            containerName="master-entry-attribute-filter"
            buttonClass="h-9 w-full"
            onChange={(next) => onChange({ attributeId: next === '' || next === undefined ? undefined : +next })}
          />
        </div>
      }
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
