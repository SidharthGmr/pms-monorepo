import { injectable } from 'inversify';
import { AxiosResponse } from 'axios';
import { TYPES } from '@/config/types';
import { container } from '@/config/ioc';
import IHttpService from './interfaces/IHttpService';
import IEmailService from './interfaces/IEmailService';
import Response from '@/dtos/Response';
import { EmailModel } from '@/models/email.model';
import { sendEmailDto } from '@/dtos/newsletter.dto';
import { ListResponseDto } from '@/dtos/list-response.dto';
import { UserListParams } from '@pms/types';

@injectable()
export default class EmailService implements IEmailService {
  private readonly httpService: IHttpService;

  constructor(
    httpService = container.get<IHttpService>(TYPES.IHttpService)
  ) {
    this.httpService = httpService;
  }

  sendEmail(model: EmailModel): Promise<AxiosResponse<Response<sendEmailDto>>> {
    return this.httpService
      .call()
      .post<sendEmailDto, AxiosResponse<Response<sendEmailDto>>>('/email', model);
  }

  getAll(p?: UserListParams): Promise<AxiosResponse<Response<ListResponseDto<sendEmailDto>>>> {
    return this.httpService.call().get<ListResponseDto<sendEmailDto>, AxiosResponse<Response<ListResponseDto<sendEmailDto>>>>(`/email`, { params: p });
  }

  getById(id: number): Promise<AxiosResponse<Response<sendEmailDto>>> {
    return this.httpService.call().get<sendEmailDto, AxiosResponse<Response<sendEmailDto>>>(`/email/${id}`);
  }

  delete(id: number): Promise<AxiosResponse<Response<sendEmailDto>>> {
    return this.httpService.call().delete<sendEmailDto, AxiosResponse<Response<sendEmailDto>>>(`/email/${id}`);
  }


}
