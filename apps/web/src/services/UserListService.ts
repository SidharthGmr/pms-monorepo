import { container } from '@/config/ioc';
import { TYPES } from '@/config/types';
import { LoginDto } from '@/dtos/LoginDto';
import PlainDto from '@/dtos/PlainDto';
import Response from '@/dtos/Response';
import { ListResponseDto } from '@/dtos/list-response.dto';
import ResetPasswordModel from '@/models/ResetPasswordModel';
import { CreateUserModel } from '@/models/user.model';
import { AxiosResponse } from 'axios';
import { injectable } from 'inversify';
import IHttpService from './interfaces/IHttpService';
import IUserListService from './interfaces/IUserListService.ts';
import { UserDto, UserListParams } from '@pms/types';


@injectable()
export default class UserListService implements IUserListService {
  private readonly httpService: IHttpService;
  constructor(httpService = container.get<IHttpService>(TYPES.IHttpService)) {
    this.httpService = httpService;
  }

  getAll(p?: UserListParams): Promise<AxiosResponse<Response<ListResponseDto<UserDto>>>> {
    return this.httpService.call().get<ListResponseDto<UserDto>, AxiosResponse<Response<ListResponseDto<UserDto>>>>(`/users`, { params: p });
  }

  getById(id: string): Promise<AxiosResponse<Response<UserDto>>> {
    return this.httpService.call().get<UserDto, AxiosResponse<Response<UserDto>>>(`/users/${id}`);
  }
  update(id: string, model: any): Promise<AxiosResponse<Response<UserDto>>> {
    return this.httpService.call().put<UserDto, AxiosResponse<Response<UserDto>>>(`/users/${id}`, model);
  }

  updateActiveStatus(userId: string, isActive: boolean): Promise<AxiosResponse<Response<UserDto>>> {
    return this.httpService.call().put<UserDto, AxiosResponse<Response<UserDto>>>(`/users/active-status/${userId}`, { isActive });
  }
  delete(id: string): Promise<AxiosResponse<Response<UserDto>>> {
    return this.httpService.call().delete<UserDto, AxiosResponse<Response<UserDto>>>(`/users/${id}`);
  }

  getOtp(otp: number): Promise<AxiosResponse<Response<UserDto>>> {
    return this.httpService.call().get<UserDto, AxiosResponse<Response<UserDto>>>(`/auth/verify/${otp}`);
  }

  sendOtp(): Promise<AxiosResponse<Response<PlainDto>>> {
    return this.httpService.call().post<PlainDto, AxiosResponse<Response<PlainDto>>>(`/auth/otp/send`);
  }

  resetPassword(model: ResetPasswordModel): Promise<AxiosResponse<Response<PlainDto>>> {
    return this.httpService.call().post<PlainDto, AxiosResponse<Response<PlainDto>>>(`/auth/reset-password`, model);
  }

  createUser(model: CreateUserModel): Promise<AxiosResponse<Response<LoginDto>>> {
    return this.httpService.call().post<LoginDto, AxiosResponse<Response<LoginDto>>>('/auth/create-user', model);
  }
}
