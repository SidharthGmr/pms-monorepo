







import { CustomResponse as Response, UpdateProfileModel, LoginDto, refreshTokenResponseDto, PlainDto, UserDto, LoginModel, VerifyTokenModel, ForgotPasswordModel, ResetPasswordTokenModel, CreateUserModel } from '@pms/types';
import { AxiosResponse } from 'axios';

export default interface IAccountService {
  login_response_way(model: LoginModel): Promise<AxiosResponse<Response<LoginDto>>>;
  login(model: LoginModel): Promise<AxiosResponse<LoginDto>>;
  logout(token: string): Promise<AxiosResponse<Response<PlainDto>>>
  logoutAllSession(): Promise<AxiosResponse<Response<PlainDto>>>;
  getRefreshToken(token: string): Promise<AxiosResponse<Response<refreshTokenResponseDto>>>;
  createUser(model: CreateUserModel): Promise<AxiosResponse<Response<LoginDto>>>;
  updateProfile(model: UpdateProfileModel): Promise<AxiosResponse<Response<UserDto>>>;
  verifyToken(model: VerifyTokenModel): Promise<AxiosResponse<Response<UserDto>>>;
  forgotPassword(model: ForgotPasswordModel): Promise<AxiosResponse<Response<PlainDto>>>;
  resetPassword(model: ResetPasswordTokenModel): Promise<AxiosResponse<Response<UserDto>>>;
}
