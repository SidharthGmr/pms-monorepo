import { CustomResponse as Response, SettingsDto, UpdateSettingsModel } from '@pms/types';
import { AxiosResponse } from 'axios';

export default interface ISettingService {
  get(): Promise<AxiosResponse<Response<SettingsDto>>>;
  update(model: UpdateSettingsModel): Promise<AxiosResponse<Response<SettingsDto>>>;
}
