 
import Response from '@/dtos/Response';
import { AxiosResponse } from 'axios';

export default interface IErrorHandlerService {
  getErrorMessage<T>(error: AxiosResponse<Response<T>>): string;
}
