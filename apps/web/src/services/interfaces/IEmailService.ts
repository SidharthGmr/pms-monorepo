import { AxiosResponse } from 'axios';
import Response from '@/dtos/Response';
import { EmailModel } from '@/models/email.model';
import { sendEmailDto } from '@/dtos/newsletter.dto';
import { UserListParams } from '@/params/user-list.params';
import { ListResponseDto } from '@/dtos/list-response.dto';

export default interface IEmailService {
    sendEmail(model: EmailModel): Promise<AxiosResponse<Response<sendEmailDto>>>;
    getAll(p?: UserListParams): Promise<AxiosResponse<Response<ListResponseDto<sendEmailDto>>>>;
    getById(id: number): Promise<AxiosResponse<Response<sendEmailDto>>>;
    delete(id: number): Promise<AxiosResponse<Response<sendEmailDto>>>;
}
