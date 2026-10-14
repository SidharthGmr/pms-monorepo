import { ListResponseDto } from '@/dtos/list-response.dto';
import Response from '@/dtos/Response';
import { MarkNotificationsReadModel, MarkNotificationsReadResultDto, NotificationDto, NotificationFilterParams, NotificationSummaryDto } from '@pms/types';
import { AxiosResponse } from 'axios';

export default interface INotificationService {
  getAll(params?: NotificationFilterParams): Promise<AxiosResponse<Response<ListResponseDto<NotificationDto>>>>;
  getUnreadCount(): Promise<AxiosResponse<Response<NotificationSummaryDto>>>;
  markRead(model: MarkNotificationsReadModel): Promise<AxiosResponse<Response<MarkNotificationsReadResultDto>>>;
  delete(id: number | string): Promise<AxiosResponse<Response<NotificationDto>>>;
}
