import { LoginDto, refreshTokenResponseDto } from '@/dtos/LoginDto';
import PlainDto from '@/dtos/PlainDto';
import Response from '@/dtos/Response';
import { UserDto } from '@/dtos/UserDto';
import LoginModel from '@/models/LoginModel';
import VerifyTokenModel from '@/models/VerifyTokenModel';
import ForgotPasswordModel from '@/models/ForgotPasswordModel';
import ResetPasswordTokenModel from '@/models/ResetPasswordTokenModel';
import { CreateUserModel } from '@/models/user.model';
import { UpdateProfileModel } from '@pms/types';
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
