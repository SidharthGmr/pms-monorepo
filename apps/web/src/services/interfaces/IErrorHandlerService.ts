 
import { CustomResponse as Response } from '@pms/types';
import { AxiosResponse } from 'axios';

export default interface IErrorHandlerService {
  getErrorMessage<T>(error: AxiosResponse<Response<T>>): string;
}
