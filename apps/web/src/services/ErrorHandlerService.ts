import axios, { AxiosResponse } from 'axios';
import { injectable } from 'inversify';

import config from '@/config';
import IErrorHandlerService from './interfaces/IErrorHandlerService';
import Response from '@/dtos/Response';
import PlainDto from '@/dtos/PlainDto';

@injectable()
export default class ErrorHandlerService implements IErrorHandlerService {
  constructor() { }

  getErrorMessage<T>(error: AxiosResponse<Response<T>>): string {
    try {
      if (axios.isAxiosError(error)) {
        const actualError: Response<any> = error.response?.data;

        if (actualError) {
          if (actualError.errors) return actualError.errors.join('<br/>');
          else if (actualError.message) return actualError.message;
          else if (actualError.data && typeof actualError.data === 'string') {
            return actualError.data;
          } else {
            if (config.enviroment === 'production') {
              return 'Some error occured';
            } else {
              return JSON.stringify(actualError);
            }
          }
        }
      } else {
        if (error?.data?.errors) {
          const actualError: Response<any> = error?.data;

          if (actualError) {
            if (actualError.errors) return actualError.errors.join('<br/>');
            else if (actualError.message) return actualError.message;
            else if (actualError.data && typeof actualError.data === 'string') {
              return actualError.data;
            } else {
              if (config.enviroment === 'production') {
                return 'Some error occured';
              } else {
                return JSON.stringify(actualError);
              }
            }
          } else {
            const castedError = error.data as Response<PlainDto>;
            if (castedError.data) return castedError.errors?.join('<br/>') || castedError.message || 'Some error occured';
            else if (castedError.message) return castedError.message;
          }
        } else {
          if (typeof error.data === 'string') {
            return error.data;
          }

          const castedError = error.data as Response<PlainDto>;

          if (castedError.data) return castedError.errors?.join('<br/>') || castedError.message || 'Some error occured';
          else if (castedError.message) return castedError.message;
        }
      }
      return 'Some error occured';
    } catch (err) {
      return 'Some error occured.';
    }
  }
}
