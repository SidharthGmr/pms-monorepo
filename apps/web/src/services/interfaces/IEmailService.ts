import { AxiosResponse } from 'axios';


import { CustomResponse as Response, ListResponseDto, UserListParams, EmailModel, sendEmailDto } from '@pms/types';
export default interface IEmailService {
    sendEmail(model: EmailModel): Promise<AxiosResponse<Response<sendEmailDto>>>;
    getAll(p?: UserListParams): Promise<AxiosResponse<Response<ListResponseDto<sendEmailDto>>>>;
    getById(id: number): Promise<AxiosResponse<Response<sendEmailDto>>>;
    delete(id: number): Promise<AxiosResponse<Response<sendEmailDto>>>;
}
