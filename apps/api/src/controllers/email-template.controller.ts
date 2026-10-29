import { CustomResponse, EmailTemplateDto, EmailTemplatePreviewDto, PreviewEmailTemplateModel, UpdateEmailTemplateModel } from '@pms/types';
import { Request, Response } from 'express';
import { container } from '../config/ioc.config';
import { TYPES } from '../config/ioc.types';
import IUnitOfService from '../services/interfaces/iunitof.service';

export class EmailTemplateController {
  constructor(private unitOfService = container.get<IUnitOfService>(TYPES.IUnitOfService)) {}

  getAll = async (_req: Request, res: Response): Promise<Response<CustomResponse<EmailTemplateDto[]>>> => {
    const data = await this.unitOfService.EmailTemplate.getAll();
    return res.status(200).json({ success: true, message: 'Email templates fetched successfully', data });
  };

  getByKey = async (req: Request, res: Response): Promise<Response<CustomResponse<EmailTemplateDto>>> => {
    const data = await this.unitOfService.EmailTemplate.getByKey(req.params['key'] as string);
    return res.status(200).json({ success: true, message: 'Email template fetched successfully', data });
  };

  update = async (req: Request, res: Response): Promise<Response<CustomResponse<EmailTemplateDto>>> => {
    const data = await this.unitOfService.EmailTemplate.update(req.params['key'] as string, req.body as UpdateEmailTemplateModel);
    return res.status(200).json({ success: true, message: 'Email template saved successfully', data });
  };

  reset = async (req: Request, res: Response): Promise<Response<CustomResponse<EmailTemplateDto>>> => {
    const data = await this.unitOfService.EmailTemplate.reset(req.params['key'] as string);
    return res.status(200).json({ success: true, message: 'Email template reset to default', data });
  };

  preview = async (req: Request, res: Response): Promise<Response<CustomResponse<EmailTemplatePreviewDto>>> => {
    const data = await this.unitOfService.EmailTemplate.preview(req.params['key'] as string, req.body as PreviewEmailTemplateModel);
    return res.status(200).json({ success: true, message: 'Email template preview rendered', data });
  };

  // The test always goes to the signed-in admin's own inbox - the address is never client-supplied.
  sendTest = async (req: Request, res: Response): Promise<Response<CustomResponse<null>>> => {
    const to = req.user?.email;
    if (!to) return res.status(400).json({ success: false, message: 'Your account has no email address to send the test to' });

    const sent = await this.unitOfService.EmailTemplate.sendTest(req.params['key'] as string, to, req.body as PreviewEmailTemplateModel);
    if (!sent) return res.status(502).json({ success: false, message: 'The test email could not be sent - check the mail configuration' });
    return res.status(200).json({ success: true, message: `Test email sent to ${to}`, data: null });
  };
}
