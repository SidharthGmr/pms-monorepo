import { container } from '@/config/ioc';
import { TYPES } from '@/config/types';




import { CustomResponse as Response, UpdateProfileModel, LoginDto, refreshTokenResponseDto, PlainDto, LoginModel, CreateUserModel, UserDto, VerifyTokenModel, ForgotPasswordModel, ResetPasswordTokenModel } from '@pms/types';
import { AxiosResponse } from 'axios';
import { injectable } from 'inversify';
import IAccountService from './interfaces/IAccountService';
import IHttpService from './interfaces/IHttpService';



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

  /**
   * Takes the *refresh* token, not the access token, and is unauthenticated —
   * it is called exactly when the access token is no longer usable.
   * Prefer letting NextAuth's `jwt` callback own this call: the API rotates the
   * refresh token and revokes the session if a spent one is replayed.
   */
  getRefreshToken(refreshToken: string): Promise<AxiosResponse<Response<refreshTokenResponseDto>>> {
    return this.httpService.externalCall().post<refreshTokenResponseDto, AxiosResponse<Response<refreshTokenResponseDto>>>('/auth/refresh-token', {
      token: refreshToken,
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

  forgotPassword(model: ForgotPasswordModel): Promise<AxiosResponse<Response<PlainDto>>> {
    return this.httpService.call().post<PlainDto, AxiosResponse<Response<PlainDto>>>('/auth/forgot-password', model);
  }

  resetPassword(model: ResetPasswordTokenModel): Promise<AxiosResponse<Response<UserDto>>> {
    return this.httpService.call().post<UserDto, AxiosResponse<Response<UserDto>>>('/auth/reset-password', model);
  }
}
