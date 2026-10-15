'use client';
import ConfirmBox from '@/components/common/confirm-box';
import ListPageHeader from '@/components/common/list-page-header';
import ListPagination from '@/components/common/list-pagination';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/components/ui/use-toast';
import config from '@/config';
import { container } from '@/config/ioc';
import { TYPES } from '@/config/types';
import { useDeleteNotification, useGetAllNotifications, useGetUnreadNotificationCount, useMarkNotificationsRead } from '@/hooks/service-hooks/useNotificationService';
import useModalShowHide from '@/hooks/use-modal-show-hide';
import { useTranslations } from '@/i18n/locale-provider';
import { cn } from '@/lib/utils';
import IUnitOfService from '@/services/interfaces/IUnitOfService';
import { NotificationDto, NotificationFilterParams } from '@pms/types';
import { Bell, CheckCheck, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import NotificationFilter, { DEFAULT_NOTIFICATION_FILTER, NotificationFilterValue } from './filter';
import { notificationIcon, notificationTone, useRelativeTime } from './notification-meta';

/**
 * The full notification history. A feed rather than a data table: every row is a sentence to
 * read, not a set of columns to compare, and the same row shape already works in the header
 * panel. Rows are the signed-in user's own - the API scopes by recipient, never by a parameter.
 */

export default function NotificationList() {
  const unitOfService = container.get<IUnitOfService>(TYPES.IUnitOfService);
  const t = useTranslations();
  const relativeTime = useRelativeTime();
  const router = useRouter();

  const [filter, setFilter] = useState<NotificationFilterValue>(DEFAULT_NOTIFICATION_FILTER);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(config.recordPerPage);

  const params = useMemo<NotificationFilterParams>(
    () => ({
      search: filter.search || undefined,
      type: filter.type ?? undefined,
      isRead: filter.unreadOnly ? false : undefined,
      sortBy: filter.sortBy,
      sortDirection: filter.sortDirection,
      page,
      recordPerPage: pageSize,
    }),
    [filter, page, pageSize]
  );

  const listQuery = useGetAllNotifications(params);
  const { data: countResponse } = useGetUnreadNotificationCount();
  const markRead = useMarkNotificationsRead();
  const deleteMutation = useDeleteNotification();

  const result = listQuery.data?.data?.data;
  const notifications: NotificationDto[] = useMemo(() => result?.data ?? [], [result]);
  const total = result?.totalRecord ?? 0;
  const unreadCount = countResponse?.data?.data?.unreadCount ?? 0;

  const { showModal: showDeleteModal, openModal: openDeleteModal, closeModal: closeDeleteModal, uniqueId: deleteId } = useModalShowHide();

  const updateFilter = (patch: Partial<NotificationFilterValue>) => {
    setFilter((current) => ({ ...current, ...patch }));
    setPage(1);
  };

  const resetFilter = () => {
    setFilter(DEFAULT_NOTIFICATION_FILTER);
    setPage(1);
  };

  const changePageSize = (size: number) => {
    setPageSize(size);
    setPage(1);
  };

  const openNotification = (notification: NotificationDto) => {
    if (!notification.isRead) markRead.mutate({ ids: [notification.id] });
    if (notification.link) router.push(notification.link);
  };

  const markAllRead = async () => {
    const response = await markRead.mutateAsync({});
    if (response && response.status === 200) {
      toast({ variant: 'success', title: t('notifications.toast.allRead') });
    } else {
      const error = unitOfService.ErrorHandlerService.getErrorMessage(response);
      toast({ variant: 'destructive', title: t('common.error'), description: <span>{error}</span> });
    }
  };

  const handleDelete = async (id: number) => {
    const response = await deleteMutation.mutateAsync(id);
    if (response && response.status === 200) {
      toast({ variant: 'success', title: t('notifications.toast.deleted') });
    } else {
      const error = unitOfService.ErrorHandlerService.getErrorMessage(response);
      toast({ variant: 'destructive', title: t('common.error'), description: <span>{error}</span> });
    }
    closeDeleteModal(true);
  };

  const isFiltered = filter.search !== '' || filter.type !== null || filter.unreadOnly;

  return (
    <div className="space-y-4">
      <ListPageHeader
        icon={Bell}
        title={t('notifications.pageTitle')}
        description={listQuery.isPending ? t('notifications.pageSubtitle') : t('notifications.countLine', { total, unread: unreadCount })}
        actions={
          unreadCount > 0 ? (
            <Button variant="outline" onClick={markAllRead} loading={markRead.isPending} className="gap-1.5">
              <CheckCheck className="h-4 w-4" />
              {t('notifications.markAllRead')}
            </Button>
          ) : undefined
        }
      />

      <NotificationFilter
        value={filter}
        onChange={updateFilter}
        onReset={resetFilter}
        total={listQuery.isPending ? undefined : total}
        unreadCount={unreadCount}
        loading={listQuery.isFetching}
      />

      {listQuery.isError ? (
        <Card className="py-16 text-center">
          <p className="text-sm font-semibold text-destructive">{t('notifications.loadFailed')}</p>
          <p className="mt-1 text-xs text-muted-foreground">{t('notifications.loadFailedHint')}</p>
        </Card>
      ) : listQuery.isPending ? (
        <Card className="divide-y p-0 md:p-0" aria-busy="true">
          {[0, 1, 2, 3, 4].map((row) => (
            <div key={row} className="flex gap-4 p-4">
              <Skeleton className="h-10 w-10 shrink-0 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-1/3" />
                <Skeleton className="h-3 w-3/4" />
                <Skeleton className="h-3 w-20" />
              </div>
            </div>
          ))}
        </Card>
      ) : notifications.length === 0 ? (
        <Card className="py-16 text-center">
          <Bell className="mx-auto h-8 w-8 text-muted-foreground/40" />
          <p className="mt-3 text-sm font-semibold">{isFiltered ? t('notifications.noMatches') : t('notifications.emptyTitle')}</p>
          <p className="mt-1 text-xs text-muted-foreground">{isFiltered ? t('notifications.noMatchesHint') : t('notifications.emptyHint')}</p>
        </Card>
      ) : (
        <Card className={cn('divide-y p-0 md:p-0', listQuery.isFetching && 'opacity-60 transition-opacity')}>
          <ul className="divide-y">
            {notifications.map((notification) => {
              const Icon = notificationIcon(notification.type);
              return (
                <li key={notification.id} className={cn('group relative', !notification.isRead && 'bg-primary/[0.04]')}>
                  <button
                    type="button"
                    onClick={() => openNotification(notification)}
                    className="flex w-full gap-4 p-4 pr-12 text-left transition-colors hover:bg-muted/50 sm:pr-14"
                  >
                    <span className={cn('mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full', notificationTone(notification.type))}>
                      <Icon className="h-5 w-5" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-2">
                        {!notification.isRead && <span className="h-2 w-2 shrink-0 rounded-full bg-primary" aria-hidden="true" />}
                        <span className="min-w-0 flex-1 text-sm font-semibold leading-snug">{notification.title}</span>
                      </span>
                      <span className="mt-1 block text-sm leading-relaxed text-muted-foreground">{notification.message}</span>
                      <span className="mt-1.5 flex items-center gap-2 text-xs text-muted-foreground/70">
                        <span>{relativeTime(notification.createdAt)}</span>
                        {!notification.isRead && <span className="rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold text-primary">{t('notifications.newBadge')}</span>}
                      </span>
                    </span>
                  </button>

                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => openDeleteModal(String(notification.id))}
                    aria-label={t('common.dismiss')}
                    title={t('common.dismiss')}
                    className="absolute right-3 top-3 h-8 w-8 text-muted-foreground opacity-0 transition-opacity hover:text-destructive focus-visible:opacity-100 group-hover:opacity-100"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </li>
              );
            })}
          </ul>
        </Card>
      )}

      {total > pageSize && (
        <Card size="sm">
          <ListPagination page={page} pageSize={pageSize} total={total} loading={listQuery.isFetching} onPageChange={setPage} onPageSizeChange={changePageSize} />
        </Card>
      )}

      {showDeleteModal && deleteId && (
        <ConfirmBox
          isOpen={showDeleteModal}
          onClose={() => closeDeleteModal(false)}
          onSubmit={() => handleDelete(+deleteId)}
          heading={t('notifications.deleteHeading')}
          loading={deleteMutation.isPending}
          bodyText={t('notifications.deleteBody')}
        />
      )}
    </div>
  );
}
