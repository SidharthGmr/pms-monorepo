import { CustomResponse, SettingsDto, UpdateSettingsModel } from '@pms/types';
import { Request, Response } from 'express';
import { container } from '../config/ioc.config';
import { TYPES } from '../config/ioc.types';
import IUnitOfService from '../services/interfaces/iunitof.service';

export class SettingController {
  constructor(private unitOfService = container.get<IUnitOfService>(TYPES.IUnitOfService)) {}

  get = async (_req: Request, res: Response): Promise<Response<CustomResponse<SettingsDto>>> => {
    const data = await this.unitOfService.Setting.get();
    return res.status(200).json({ success: true, message: 'Settings fetched successfully', data });
  };

  update = async (req: Request, res: Response): Promise<Response<CustomResponse<SettingsDto>>> => {
    const data = await this.unitOfService.Setting.update(req.body as UpdateSettingsModel);
    return res.status(200).json({ success: true, message: 'Settings saved successfully', data });
  };
}
