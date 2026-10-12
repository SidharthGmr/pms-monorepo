'use client';
import ListToolbar, { SortDirection, SortOption, StatusOption } from '@/components/common/list-toolbar';
import { ContactMessageStatus, ContactMessageStatusEnum } from '@pms/types';

export type { SortDirection };

export interface ContactMessageFilterValue {
  search: string;
  /** `null` means every status. */
  status: ContactMessageStatus | null;
  sortBy: string;
  sortDirection: SortDirection;
}

export const DEFAULT_CONTACT_MESSAGE_FILTER: ContactMessageFilterValue = {
  search: '',
  status: null,
  sortBy: 'createdAt',
  sortDirection: 'DESC',
};

const STATUS_OPTIONS: StatusOption<ContactMessageStatus | null>[] = [
  { label: 'All', value: null },
  { label: 'New', value: ContactMessageStatusEnum.New, dot: 'bg-sky-500' },
  { label: 'Read', value: ContactMessageStatusEnum.Read, dot: 'bg-amber-500' },
  { label: 'Resolved', value: ContactMessageStatusEnum.Resolved, dot: 'bg-emerald-500' },
];

// Mirrors SORTABLE_COLUMNS in contact-message.repository.ts - anything else falls back to createdAt.
const SORT_OPTIONS: SortOption[] = [
  { value: 'createdAt', label: 'Received' },
  { value: 'name', label: 'Sender name' },
  { value: 'subject', label: 'Subject' },
  { value: 'status', label: 'Status' },
  { value: 'updatedAt', label: 'Last updated' },
];

interface ContactMessageFilterProps {
  value: ContactMessageFilterValue;
  onChange: (patch: Partial<ContactMessageFilterValue>) => void;
  onReset: () => void;
  total?: number;
  loading?: boolean;
}

export default function ContactMessageFilter({ value, onChange, onReset, total, loading }: ContactMessageFilterProps) {
  const isFiltered = value.search !== '' || value.status !== null;

  return (
    <ListToolbar<ContactMessageStatus | null>
      search={{ value: value.search, onChange: (search) => onChange({ search }), placeholder: 'Search name, email, subject or message' }}
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
