'use client';
import ListToolbar, { SortDirection, SortOption, StatusOption } from '@/components/common/list-toolbar';
import { PageStatus } from '@pms/types';

export type { SortDirection };

export interface CmsPageFilterValue {
  search: string;
  /** `null` means every status. */
  status: PageStatus | null;
  sortBy: string;
  sortDirection: SortDirection;
}

export const DEFAULT_CMS_PAGE_FILTER: CmsPageFilterValue = {
  search: '',
  status: null,
  sortBy: 'createdAt',
  sortDirection: 'DESC',
};

const STATUS_OPTIONS: StatusOption<PageStatus | null>[] = [
  { label: 'All', value: null },
  { label: 'Draft', value: 'Draft', dot: 'bg-amber-500' },
  { label: 'Published', value: 'Published', dot: 'bg-emerald-500' },
  { label: 'Unpublished', value: 'Unpublished', dot: 'bg-zinc-400' },
  { label: 'Archived', value: 'Archived', dot: 'bg-violet-500' },
];

// Mirrors SORTABLE_COLUMNS in cms-page.repository.ts - anything else is ignored server-side.
const SORT_OPTIONS: SortOption[] = [
  { value: 'createdAt', label: 'Date added' },
  { value: 'updatedAt', label: 'Last updated' },
  { value: 'name', label: 'Name' },
  { value: 'slug', label: 'URL' },
  { value: 'status', label: 'Status' },
];

interface CmsPageFilterProps {
  value: CmsPageFilterValue;
  onChange: (patch: Partial<CmsPageFilterValue>) => void;
  onReset: () => void;
  total?: number;
  loading?: boolean;
}

export default function CmsPageFilter({ value, onChange, onReset, total, loading }: CmsPageFilterProps) {
  const isFiltered =
    value.search !== DEFAULT_CMS_PAGE_FILTER.search ||
    value.status !== DEFAULT_CMS_PAGE_FILTER.status ||
    value.sortBy !== DEFAULT_CMS_PAGE_FILTER.sortBy ||
    value.sortDirection !== DEFAULT_CMS_PAGE_FILTER.sortDirection;

  return (
    <ListToolbar<PageStatus | null>
      search={{ value: value.search, onChange: (search) => onChange({ search }), placeholder: 'Search pages…' }}
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
    />
  );
}
