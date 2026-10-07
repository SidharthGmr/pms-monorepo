'use client';

import { DateRangePicker } from '@/components/common/date-range-picker';
import ListToolbar, { SortDirection, SortOption, StatusOption } from '@/components/common/list-toolbar';
import { ListView } from '@/components/common/view-switch';
import { SelectSearch } from '@/components/common/select-search';
import { Roles } from '@/enums/roles.enum';
import useGetCurrentUser from '@/hooks/useGetCurrentUser';
import { useMemo } from 'react';
import { DateRange } from 'react-day-picker';

export type { SortDirection };

export type UserStatus = 'Published' | 'Draft' | 'Trash' | null;

export interface UserFilterValue {
  search: string;
  status: UserStatus;
  role: string;
  dateRange?: DateRange;
  sortBy: string;
  sortDirection: SortDirection;
}

export const DEFAULT_USER_FILTER: UserFilterValue = {
  search: '',
  status: null,
  role: '',
  dateRange: undefined,
  sortBy: 'createdAt',
  sortDirection: 'DESC',
};

const STATUS_OPTIONS: StatusOption<UserStatus>[] = [
  { label: 'All', value: null },
  { label: 'Published', value: 'Published', dot: 'bg-emerald-500' },
  { label: 'Draft', value: 'Draft', dot: 'bg-amber-500' },
  { label: 'Trash', value: 'Trash', dot: 'bg-rose-500' },
];

const SORT_OPTIONS: SortOption[] = [
  { value: 'createdAt', label: 'Joined' },
  { value: 'name', label: 'Name' },
  { value: 'email', label: 'Email' },
  { value: 'role', label: 'Role' },
  { value: 'lastLoginAt', label: 'Last active' },
];

const ROLE_OPTIONS = [
  { label: 'All roles', value: '' },
  { label: 'Super Admin', value: Roles.SUPER_ADMIN },
  { label: 'Admin', value: Roles.ADMIN },
  { label: 'Staff', value: Roles.STAFF },
  { label: 'Customer', value: Roles.USER },
];

interface UserListFilterProps {
  value: UserFilterValue;
  onChange: (patch: Partial<UserFilterValue>) => void;
  onReset: () => void;
  view: ListView;
  onViewChange: (view: ListView) => void;
  total?: number;
  loading?: boolean;
  /** Set when the page is locked to one role, e.g. the customers view; the role select is then hidden. */
  lockedRole?: string;
}

export default function UserListFilter({ value, onChange, onReset, view, onViewChange, total, loading, lockedRole }: UserListFilterProps) {
  // Only a super admin gets the Super Admin option - same check as `active-status-toggle`.
  const { currentUser } = useGetCurrentUser();
  const isSuperAdmin = currentUser?.role === Roles.SUPER_ADMIN;
  const roleOptions = useMemo(() => ROLE_OPTIONS.filter((option) => isSuperAdmin || option.value !== Roles.SUPER_ADMIN), [isSuperAdmin]);

  const isFiltered = value.search !== '' || value.status !== null || (!lockedRole && value.role !== '') || !!value.dateRange;

  return (
    <ListToolbar<UserStatus>
      search={{ value: value.search, onChange: (search) => onChange({ search }), placeholder: 'Search name, email or phone…' }}
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
      leading={
        <>
          {!lockedRole && (
            <SelectSearch
              value={value.role}
              placeholder="All roles"
              items={roleOptions}
              onChange={(role) => onChange({ role: String(role ?? '') })}
              buttonClass="h-9 bg-background sm:w-40"
              disableSearch
            />
          )}
          <div className="w-full sm:w-auto">
            <DateRangePicker mode="range" value={value.dateRange} selected={value.dateRange} onSelect={(dateRange) => onChange({ dateRange })} numberOfMonthsToShow={2} />
          </div>
        </>
      }
    />
  );
}
