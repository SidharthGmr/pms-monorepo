import { container } from '@/config/ioc';
import { TYPES } from '@/config/types';
import { CustomResponse as Response, SettingsDto, UpdateSettingsModel } from '@pms/types';
import { AxiosResponse } from 'axios';
import { injectable } from 'inversify';
import IHttpService from './interfaces/IHttpService';
import ISettingService from './interfaces/ISettingService';

@injectable()
export default class SettingService implements ISettingService {
  private readonly httpService: IHttpService;

  constructor(httpService = container.get<IHttpService>(TYPES.IHttpService)) {
    this.httpService = httpService;
  }

  get(): Promise<AxiosResponse<Response<SettingsDto>>> {
    return this.httpService.call().get<SettingsDto, AxiosResponse<Response<SettingsDto>>>('/settings');
  }

  update(model: UpdateSettingsModel): Promise<AxiosResponse<Response<SettingsDto>>> {
    return this.httpService.call().put<SettingsDto, AxiosResponse<Response<SettingsDto>>>('/settings', model);
  }
}
