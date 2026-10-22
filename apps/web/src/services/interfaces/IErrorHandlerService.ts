 

import { AxiosResponse } from 'axios';
import { CustomResponse as Response } from '@pms/types';

export default interface IErrorHandlerService {
  getErrorMessage<T>(error: AxiosResponse<Response<T>>): string;
}
