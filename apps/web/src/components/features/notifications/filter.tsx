'use client';
import ListToolbar, { SortDirection, SortOption, StatusOption } from '@/components/common/list-toolbar';
import { Button } from '@/components/ui/button';
import { useTranslations } from '@/i18n/locale-provider';
import { cn } from '@/lib/utils';
import { NotificationType, NotificationTypeEnum } from '@pms/types';

export type { SortDirection };

export interface NotificationFilterValue {
  search: string;
  /** `null` means every type. */
  type: NotificationType | null;
  /** `true` shows only unread; `null` shows read and unread alike. */
  unreadOnly: boolean;
  sortBy: string;
  sortDirection: SortDirection;
}

export const DEFAULT_NOTIFICATION_FILTER: NotificationFilterValue = {
  search: '',
  type: null,
  unreadOnly: false,
  sortBy: 'createdAt',
  sortDirection: 'DESC',
};

interface NotificationFilterProps {
  value: NotificationFilterValue;
  onChange: (patch: Partial<NotificationFilterValue>) => void;
  onReset: () => void;
  total?: number;
  unreadCount?: number;
  loading?: boolean;
}

export default function NotificationFilter({ value, onChange, onReset, total, unreadCount = 0, loading }: NotificationFilterProps) {
  const t = useTranslations();

  const typeOptions: StatusOption<NotificationType | null>[] = [
    { label: t('notifications.filter.allTypes'), value: null },
    { label: t('notifications.type.orderPlaced'), value: NotificationTypeEnum.OrderPlaced, dot: 'bg-emerald-500' },
    { label: t('notifications.type.orderStatusChanged'), value: NotificationTypeEnum.OrderStatusChanged, dot: 'bg-violet-500' },
    { label: t('notifications.type.lowStock'), value: NotificationTypeEnum.LowStock, dot: 'bg-amber-500' },
    { label: t('notifications.type.userRegistered'), value: NotificationTypeEnum.UserRegistered, dot: 'bg-sky-500' },
  ];

  // Mirrors SORTABLE_COLUMNS in notification.repository.ts - anything else falls back to createdAt.
  const sortOptions: SortOption[] = [
    { value: 'createdAt', label: t('notifications.sort.received') },
    { value: 'type', label: t('notifications.sort.type') },
    { value: 'title', label: t('notifications.sort.title') },
    { value: 'isRead', label: t('notifications.sort.readState') },
  ];

  const isFiltered = value.search !== '' || value.type !== null || value.unreadOnly;

  // All / Unread sits in the toolbar's leading slot rather than the type select: it is the
  // switch people reach for constantly, so it stays one click away instead of inside a menu.
  const readToggle = (
    <div className="inline-flex rounded-lg border border-border/70 bg-background p-0.5">
      {[false, true].map((unread) => (
        <Button
          key={String(unread)}
          type="button"
          size="sm"
          variant="ghost"
          aria-pressed={value.unreadOnly === unread}
          onClick={() => onChange({ unreadOnly: unread })}
          className={cn('h-7 gap-1.5 px-3 text-xs font-medium', value.unreadOnly === unread && 'bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground')}
        >
          {unread ? t('notifications.filter.unread') : t('notifications.filter.all')}
          {unread && unreadCount > 0 && (
            <span className={cn('rounded-full px-1.5 text-[10px] font-bold tabular-nums', value.unreadOnly ? 'bg-primary-foreground/20' : 'bg-destructive text-destructive-foreground')}>
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </Button>
      ))}
    </div>
  );

  return (
    <ListToolbar<NotificationType | null>
      search={{ value: value.search, onChange: (search) => onChange({ search }), placeholder: t('notifications.filter.searchPlaceholder') }}
      status={{ value: value.type, onChange: (type) => onChange({ type }), options: typeOptions, total, loading }}
      leading={readToggle}
      sort={{
        value: value.sortBy,
        onChange: (sortBy) => onChange({ sortBy }),
        options: sortOptions,
        direction: value.sortDirection,
        onDirectionChange: (sortDirection) => onChange({ sortDirection }),
      }}
      isFiltered={isFiltered}
      onReset={onReset}
    />
  );
}
