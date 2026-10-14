'use client';

import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';
import { useDeleteNotification, useGetAllNotifications, useGetUnreadNotificationCount, useMarkNotificationsRead } from '@/hooks/service-hooks/useNotificationService';
import useGetCurrentUser from '@/hooks/useGetCurrentUser';
import { cn } from '@/lib/utils';
import { NotificationDto, NotificationTypeEnum } from '@pms/types';
import { Bell, CheckCheck, PackageCheck, ShoppingBag, TriangleAlert, UserPlus, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

/**
 * Top-bar notification bell for both the admin and the customer dashboard. The badge polls for
 * the unread count; the list itself is only fetched once the panel is opened, so a signed-in
 * user sitting on a page costs one small request a minute.
 *
 * The list scrolls in a plain overflow container rather than ScrollArea: that component's
 * viewport is `h-full`, which resolves to auto under a max-height parent, so the rows clip at
 * the panel edge without ever scrolling.
 */

const PANEL_SIZE = 15;

const ICONS = {
  [NotificationTypeEnum.UserRegistered]: UserPlus,
  [NotificationTypeEnum.OrderPlaced]: ShoppingBag,
  [NotificationTypeEnum.OrderStatusChanged]: PackageCheck,
  [NotificationTypeEnum.LowStock]: TriangleAlert,
} as const;

const TONES = {
  [NotificationTypeEnum.UserRegistered]: 'bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300',
  [NotificationTypeEnum.OrderPlaced]: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300',
  [NotificationTypeEnum.OrderStatusChanged]: 'bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300',
  [NotificationTypeEnum.LowStock]: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300',
} as const;

const relativeTime = (value: Date | string): string => {
  const then = new Date(value).getTime();
  const seconds = Math.max(0, Math.round((Date.now() - then) / 1000));
  if (seconds < 60) return 'just now';
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(value).toLocaleDateString();
};

export function NotificationBell() {
  const { currentUser } = useGetCurrentUser();
  const signedIn = !!currentUser;
  const router = useRouter();

  const [open, setOpen] = useState(false);

  const { data: countResponse } = useGetUnreadNotificationCount(signedIn);
  const { data: listResponse, isLoading } = useGetAllNotifications({ recordPerPage: PANEL_SIZE }, signedIn && open);
  const markRead = useMarkNotificationsRead();
  const removeNotification = useDeleteNotification();

  const unreadCount = countResponse?.data?.data?.unreadCount ?? 0;
  const notifications = (listResponse?.data?.data?.data ?? []) as NotificationDto[];

  if (!signedIn) return null;

  const openNotification = (notification: NotificationDto) => {
    if (!notification.isRead) markRead.mutate({ ids: [notification.id] });
    setOpen(false);
    if (notification.link) router.push(notification.link);
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative h-9 w-9"
          title={unreadCount > 0 ? `${unreadCount} unread notification${unreadCount === 1 ? '' : 's'}` : 'No new notifications'}
          aria-label={unreadCount > 0 ? `Notifications, ${unreadCount} unread` : 'Notifications'}
        >
          {/* Swings only while something is unread, and only for visitors who accept motion. */}
          <Bell className={cn('h-[18px] w-[18px]', unreadCount > 0 && 'origin-top motion-safe:animate-bell-ring')} />
          {unreadCount > 0 && (
            <span className="absolute -right-1 -top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold leading-none text-destructive-foreground">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" sideOffset={8} collisionPadding={8} className="w-[calc(100vw-1.5rem)] max-w-[22rem] rounded-lg p-0 sm:w-[22rem]">
        <div className="flex items-center justify-between border-b px-3 py-2.5">
          <p className="text-sm font-semibold">
            Notifications
            {unreadCount > 0 && <span className="ml-1.5 text-xs font-normal text-muted-foreground">({unreadCount} unread)</span>}
          </p>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" className="h-7 gap-1.5 text-xs" onClick={() => markRead.mutate({})} disabled={markRead.isPending}>
              <CheckCheck className="h-3.5 w-3.5" />
              Mark all read
            </Button>
          )}
        </div>

        {isLoading ? (
          <div className="space-y-3 p-3" aria-busy="true">
            {[0, 1, 2].map((row) => (
              <div key={row} className="flex gap-3">
                <Skeleton className="h-8 w-8 shrink-0 rounded-full" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-3.5 w-2/3" />
                  <Skeleton className="h-3 w-full" />
                </div>
              </div>
            ))}
          </div>
        ) : notifications.length === 0 ? (
          <div className="px-4 py-10 text-center">
            <Bell className="mx-auto h-7 w-7 text-muted-foreground/40" />
            <p className="mt-2 text-sm font-medium">You are all caught up</p>
            <p className="mt-0.5 text-xs text-muted-foreground">New orders, signups and stock warnings land here.</p>
          </div>
        ) : (
          <div className="max-h-[60vh] overflow-y-auto overscroll-contain sm:max-h-[22rem]">
            <ul className="divide-y">
              {notifications.map((notification) => {
                const Icon = ICONS[notification.type] ?? Bell;
                return (
                  <li key={notification.id} className={cn('group relative', !notification.isRead && 'bg-primary/[0.04]')}>
                    <button type="button" onClick={() => openNotification(notification)} className="flex w-full gap-3 px-3 py-3 text-left transition-colors hover:bg-muted/60">
                      <span className={cn('mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full', TONES[notification.type] ?? 'bg-muted text-muted-foreground')}>
                        <Icon className="h-4 w-4" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center gap-1.5">
                          {!notification.isRead && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />}
                          <span className="truncate text-[13px] font-semibold leading-tight">{notification.title}</span>
                        </span>
                        <span className="mt-0.5 block text-xs leading-snug text-muted-foreground">{notification.message}</span>
                        <span className="mt-1 block text-[11px] text-muted-foreground/70">{relativeTime(notification.createdAt)}</span>
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => removeNotification.mutate(notification.id)}
                      aria-label="Dismiss notification"
                      title="Dismiss"
                      className="absolute right-2 top-2 rounded-md p-1 text-muted-foreground opacity-0 transition-opacity hover:bg-muted hover:text-foreground focus:opacity-100 group-hover:opacity-100"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
