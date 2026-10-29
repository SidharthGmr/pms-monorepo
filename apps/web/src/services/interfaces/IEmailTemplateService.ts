import { CustomResponse as Response, EmailTemplateDto, EmailTemplatePreviewDto, PreviewEmailTemplateModel, UpdateEmailTemplateModel } from '@pms/types';
import { AxiosResponse } from 'axios';

export default interface IEmailTemplateService {
  getAll(): Promise<AxiosResponse<Response<EmailTemplateDto[]>>>;
  getByKey(key: string): Promise<AxiosResponse<Response<EmailTemplateDto>>>;
  update(key: string, model: UpdateEmailTemplateModel): Promise<AxiosResponse<Response<EmailTemplateDto>>>;
  reset(key: string): Promise<AxiosResponse<Response<EmailTemplateDto>>>;
  preview(key: string, model: PreviewEmailTemplateModel): Promise<AxiosResponse<Response<EmailTemplatePreviewDto>>>;
  sendTest(key: string, model: PreviewEmailTemplateModel): Promise<AxiosResponse<Response<null>>>;
}
