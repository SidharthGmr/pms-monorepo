import { container } from '@/config/ioc';
import { TYPES } from '@/config/types';
import IUnitOfService from '@/services/interfaces/IUnitOfService';
import { MarkNotificationsReadModel, NotificationFilterParams } from '@pms/types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

export const NOTIFICATION_LIST_KEY = 'NotificationService.getAll';
export const NOTIFICATION_COUNT_KEY = 'NotificationService.getUnreadCount';

/** There is no push channel, so the badge polls. A minute is often enough to feel live
 *  without putting a request per user per few seconds on the API. */
const UNREAD_POLL_MS = 60_000;

const useGetAllNotifications = (params?: NotificationFilterParams, enabled: boolean = true) => {
  const unitOfService = container.get<IUnitOfService>(TYPES.IUnitOfService);

  return useQuery({
    queryKey: [NOTIFICATION_LIST_KEY, params],
    queryFn: () => unitOfService.NotificationService.getAll(params),
    enabled,
  });
};

const useGetUnreadNotificationCount = (enabled: boolean = true) => {
  const unitOfService = container.get<IUnitOfService>(TYPES.IUnitOfService);

  return useQuery({
    queryKey: [NOTIFICATION_COUNT_KEY],
    queryFn: () => unitOfService.NotificationService.getUnreadCount(),
    enabled,
    refetchInterval: enabled ? UNREAD_POLL_MS : false,
    refetchOnWindowFocus: true,
  });
};

const useMarkNotificationsRead = () => {
  const unitOfService = container.get<IUnitOfService>(TYPES.IUnitOfService);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (model: MarkNotificationsReadModel) => unitOfService.NotificationService.markRead(model),
    onSettled: (response) => {
      if (response && response.status === 200) {
        queryClient.invalidateQueries({ queryKey: [NOTIFICATION_LIST_KEY] });
        queryClient.invalidateQueries({ queryKey: [NOTIFICATION_COUNT_KEY] });
      }
    },
    onError: (error) => error,
  });
};

const useDeleteNotification = () => {
  const unitOfService = container.get<IUnitOfService>(TYPES.IUnitOfService);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number | string) => unitOfService.NotificationService.delete(id),
    onSettled: (response) => {
      if (response && response.status === 200) {
        queryClient.invalidateQueries({ queryKey: [NOTIFICATION_LIST_KEY] });
        queryClient.invalidateQueries({ queryKey: [NOTIFICATION_COUNT_KEY] });
      }
    },
    onError: (error) => error,
  });
};

export { useDeleteNotification, useGetAllNotifications, useGetUnreadNotificationCount, useMarkNotificationsRead };
