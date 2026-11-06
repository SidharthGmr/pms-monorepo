'use client';
import { DateRangePicker } from '@/components/common/date-range-picker';
import ListToolbar, { SortDirection, SortOption, StatusOption } from '@/components/common/list-toolbar';
import { DateRange } from 'react-day-picker';
import { EstimateStatus, EstimateStatusEnum } from '@pms/types';

export type { SortDirection };

export interface EstimateFilterValue {
  search: string;
  status: EstimateStatus | null;
  dateRange: DateRange | undefined;
  sortBy: string;
  sortDirection: SortDirection;
}

export const DEFAULT_ESTIMATE_FILTER: EstimateFilterValue = {
  search: '',
  status: null,
  dateRange: undefined,
  sortBy: 'createdAt',
  sortDirection: 'DESC',
};

// Same tones as EstimateStatusBadge, so one estimate reads alike everywhere.
const STATUS_OPTIONS: StatusOption<EstimateStatus | null>[] = [
  { label: 'All', value: null },
  { label: 'Draft', value: EstimateStatusEnum.Draft, dot: 'bg-slate-500' },
  { label: 'Sent', value: EstimateStatusEnum.Sent, dot: 'bg-sky-500' },
  { label: 'Accepted', value: EstimateStatusEnum.Accepted, dot: 'bg-emerald-500' },
  { label: 'Rejected', value: EstimateStatusEnum.Rejected, dot: 'bg-rose-500' },
  { label: 'Expired', value: EstimateStatusEnum.Expired, dot: 'bg-amber-500' },
  { label: 'Converted', value: EstimateStatusEnum.Converted, dot: 'bg-violet-500' },
  { label: 'Cancelled', value: EstimateStatusEnum.Cancelled, dot: 'bg-zinc-500' },
];

// Mirrors SORTABLE_COLUMNS in estimate.repository.ts - anything else falls back to createdAt.
const SORT_OPTIONS: SortOption[] = [
  { value: 'createdAt', label: 'Created' },
  { value: 'estimateNumber', label: 'Estimate number' },
  { value: 'customerName', label: 'Customer' },
  { value: 'estimateDate', label: 'Estimate date' },
  { value: 'validUntil', label: 'Valid until' },
  { value: 'grandTotal', label: 'Amount' },
  { value: 'status', label: 'Status' },
  { value: 'updatedAt', label: 'Last updated' },
];

interface EstimateListFilterProps {
  value: EstimateFilterValue;
  onChange: (patch: Partial<EstimateFilterValue>) => void;
  onReset: () => void;
  total?: number;
  loading?: boolean;
}

export default function EstimateListFilter({ value, onChange, onReset, total, loading }: EstimateListFilterProps) {
  const isFiltered = value.search !== '' || value.status !== null || !!(value.dateRange?.from || value.dateRange?.to);

  return (
    <ListToolbar<EstimateStatus | null>
      search={{ value: value.search, onChange: (search) => onChange({ search }), placeholder: 'Search estimate no., customer…' }}
      status={{ value: value.status, onChange: (status) => onChange({ status }), options: STATUS_OPTIONS, total, loading }}
      sort={{
        value: value.sortBy,
        onChange: (sortBy) => onChange({ sortBy }),
        options: SORT_OPTIONS,
        direction: value.sortDirection,
        onDirectionChange: (sortDirection) => onChange({ sortDirection }),
      }}
      isFiltered={isFiltered}
      onReset={onReset}
      leading={
        <DateRangePicker
          key={value.dateRange ? 'range' : 'empty'}
          mode="range"
          value={value.dateRange}
          selected={value.dateRange}
          onSelect={(dateRange) => onChange({ dateRange })}
          numberOfMonthsToShow={2}
          placeholder="Estimate date"
        />
      }
    />
  );
}
