import { container } from '@/config/ioc';
import { TYPES } from '@/config/types';
import {
  CustomResponse as Response,
  ListResponseDto,
  MarkNotificationsReadModel,
  MarkNotificationsReadResultDto,
  NotificationDto,
  NotificationFilterParams,
  NotificationSummaryDto,
} from '@pms/types';
import { AxiosResponse } from 'axios';
import { injectable } from 'inversify';
import IHttpService from './interfaces/IHttpService';
import INotificationService from './interfaces/INotificationService';

@injectable()
export default class NotificationService implements INotificationService {
  private readonly httpService: IHttpService;

  constructor(httpService = container.get<IHttpService>(TYPES.IHttpService)) {
    this.httpService = httpService;
  }

  getAll(params?: NotificationFilterParams): Promise<AxiosResponse<Response<ListResponseDto<NotificationDto>>>> {
    return this.httpService
      .call()
      .get<ListResponseDto<NotificationDto>, AxiosResponse<Response<ListResponseDto<NotificationDto>>>>('/notifications', { params });
  }

  getUnreadCount(): Promise<AxiosResponse<Response<NotificationSummaryDto>>> {
    return this.httpService.call().get<NotificationSummaryDto, AxiosResponse<Response<NotificationSummaryDto>>>('/notifications/unread-count');
  }

  markRead(model: MarkNotificationsReadModel): Promise<AxiosResponse<Response<MarkNotificationsReadResultDto>>> {
    return this.httpService
      .call()
      .post<MarkNotificationsReadResultDto, AxiosResponse<Response<MarkNotificationsReadResultDto>>>('/notifications/mark-read', model);
  }

  delete(id: number | string): Promise<AxiosResponse<Response<NotificationDto>>> {
    return this.httpService.call().delete<NotificationDto, AxiosResponse<Response<NotificationDto>>>(`/notifications/${id}`);
  }
}
