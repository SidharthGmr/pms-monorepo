import { container } from '@/config/ioc';
import { TYPES } from '@/config/types';
import { CustomResponse as Response, EmailTemplateDto, EmailTemplatePreviewDto, PreviewEmailTemplateModel, UpdateEmailTemplateModel } from '@pms/types';
import { AxiosResponse } from 'axios';
import { injectable } from 'inversify';
import IEmailTemplateService from './interfaces/IEmailTemplateService';
import IHttpService from './interfaces/IHttpService';

@injectable()
export default class EmailTemplateService implements IEmailTemplateService {
  private readonly httpService: IHttpService;

  constructor(httpService = container.get<IHttpService>(TYPES.IHttpService)) {
    this.httpService = httpService;
  }

  getAll(): Promise<AxiosResponse<Response<EmailTemplateDto[]>>> {
    return this.httpService.call().get<EmailTemplateDto[], AxiosResponse<Response<EmailTemplateDto[]>>>('/email-templates');
  }

  getByKey(key: string): Promise<AxiosResponse<Response<EmailTemplateDto>>> {
    return this.httpService.call().get<EmailTemplateDto, AxiosResponse<Response<EmailTemplateDto>>>(`/email-templates/${key}`);
  }

  update(key: string, model: UpdateEmailTemplateModel): Promise<AxiosResponse<Response<EmailTemplateDto>>> {
    return this.httpService.call().put<EmailTemplateDto, AxiosResponse<Response<EmailTemplateDto>>>(`/email-templates/${key}`, model);
  }

  reset(key: string): Promise<AxiosResponse<Response<EmailTemplateDto>>> {
    return this.httpService.call().delete<EmailTemplateDto, AxiosResponse<Response<EmailTemplateDto>>>(`/email-templates/${key}`);
  }

  preview(key: string, model: PreviewEmailTemplateModel): Promise<AxiosResponse<Response<EmailTemplatePreviewDto>>> {
    return this.httpService.call().post<EmailTemplatePreviewDto, AxiosResponse<Response<EmailTemplatePreviewDto>>>(`/email-templates/${key}/preview`, model);
  }

  sendTest(key: string, model: PreviewEmailTemplateModel): Promise<AxiosResponse<Response<null>>> {
    return this.httpService.call().post<null, AxiosResponse<Response<null>>>(`/email-templates/${key}/test`, model);
  }
}
