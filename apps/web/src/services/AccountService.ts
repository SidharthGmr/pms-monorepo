import { container } from '@/config/ioc';
import { TYPES } from '@/config/types';
import { LoginDto, refreshTokenResponseDto } from '@/dtos/LoginDto';
import PlainDto from '@/dtos/PlainDto';
import Response from '@/dtos/Response';
import LoginModel from '@/models/LoginModel';
import VerifyEmailModel from '@/models/VerifyEmailModel';
import { CreateUserModel } from '@/models/user.model';
import { UpdateProfileModel } from '@pms/types';
import { UserDto } from '@/dtos/UserDto';
import { AxiosResponse } from 'axios';
import { injectable } from 'inversify';
import IAccountService from './interfaces/IAccountService';
import IHttpService from './interfaces/IHttpService';
import VerifyTokenModel from '@/models/VerifyTokenModel';

@injectable()
export default class AccountService implements IAccountService {
  private readonly httpService: IHttpService;
  constructor(httpService = container.get<IHttpService>(TYPES.IHttpService)) {
    this.httpService = httpService;
  }

  login_response_way(model: LoginModel): Promise<AxiosResponse<Response<LoginDto>>> {
    return this.httpService.externalCall().post<LoginDto, AxiosResponse<Response<LoginDto>>>('/auth/login', model);
  }

  login(model: LoginModel): Promise<AxiosResponse<LoginDto>> {
    return this.httpService.externalCall().post<LoginDto, AxiosResponse<LoginDto>>('/auth/login', model);
  }

  logout(token: string): Promise<AxiosResponse<Response<PlainDto>>> {
    const result = this.httpService.call().post<PlainDto, AxiosResponse<Response<PlainDto>>>('/auth/logout', {
      token: token,
    });
    return result;
  }

  logoutAllSession(): Promise<AxiosResponse<Response<PlainDto>>> {
    const result = this.httpService.call().post<PlainDto, AxiosResponse<Response<PlainDto>>>('/auth/logoutallsession');
    return result;
  }

  getRefreshToken(token: string): Promise<AxiosResponse<Response<refreshTokenResponseDto>>> {
    return this.httpService.call().post<refreshTokenResponseDto, AxiosResponse<Response<refreshTokenResponseDto>>>('/auth/refreshToken', {
      token: token,
    });
  }

  createUser(model: CreateUserModel): Promise<AxiosResponse<Response<LoginDto>>> {
    return this.httpService.externalCall().post<LoginDto, AxiosResponse<Response<LoginDto>>>('/auth/signup', model);
  }

  updateProfile(model: UpdateProfileModel): Promise<AxiosResponse<Response<UserDto>>> {
    return this.httpService.call().put<UserDto, AxiosResponse<Response<UserDto>>>('/users/profile', model);
  }

  verifyToken(model: VerifyTokenModel): Promise<AxiosResponse<Response<UserDto>>> {
    return this.httpService.call().post<UserDto, AxiosResponse<Response<UserDto>>>('/auth/verify-token', model);
  }
}
