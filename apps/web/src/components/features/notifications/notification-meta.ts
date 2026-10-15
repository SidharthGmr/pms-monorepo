'use client';

import { useLocale } from '@/i18n/locale-provider';
import { NotificationType, NotificationTypeEnum } from '@pms/types';
import { Bell, PackageCheck, ShoppingBag, TriangleAlert, UserPlus } from 'lucide-react';
import { useCallback } from 'react';

/**
 * How a notification looks, in one place. The header bell and the notifications page both read
 * from here so a type never shows one icon in the panel and another on the page.
 */

export const NOTIFICATION_ICONS: Record<NotificationType, React.ElementType> = {
  [NotificationTypeEnum.UserRegistered]: UserPlus,
  [NotificationTypeEnum.OrderPlaced]: ShoppingBag,
  [NotificationTypeEnum.OrderStatusChanged]: PackageCheck,
  [NotificationTypeEnum.LowStock]: TriangleAlert,
};

export const NOTIFICATION_TONES: Record<NotificationType, string> = {
  [NotificationTypeEnum.UserRegistered]: 'bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300',
  [NotificationTypeEnum.OrderPlaced]: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300',
  [NotificationTypeEnum.OrderStatusChanged]: 'bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300',
  [NotificationTypeEnum.LowStock]: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300',
};

export const notificationIcon = (type: NotificationType): React.ElementType => NOTIFICATION_ICONS[type] ?? Bell;

export const notificationTone = (type: NotificationType): string => NOTIFICATION_TONES[type] ?? 'bg-muted text-muted-foreground';

/**
 * "2 minutes ago" in the reader's language, falling back to a real date after a week - past
 * that point the exact day matters more than the distance.
 */
export function useRelativeTime() {
  const { t, formatDate } = useLocale();

  return useCallback(
    (value: Date | string): string => {
      const seconds = Math.max(0, Math.round((Date.now() - new Date(value).getTime()) / 1000));
      if (seconds < 60) return t('time.justNow');
      const minutes = Math.round(seconds / 60);
      if (minutes < 60) return t('time.minutes', { count: minutes });
      const hours = Math.round(minutes / 60);
      if (hours < 24) return t('time.hours', { count: hours });
      const days = Math.round(hours / 24);
      if (days < 7) return t('time.days', { count: days });
      return formatDate(value);
    },
    [t, formatDate]
  );
}
