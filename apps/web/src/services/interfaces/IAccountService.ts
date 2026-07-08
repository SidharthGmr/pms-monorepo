import { LoginDto, refreshTokenResponseDto } from '@/dtos/LoginDto';
import PlainDto from '@/dtos/PlainDto';
import Response from '@/dtos/Response';
import { UserDto } from '@/dtos/UserDto';
import LoginModel from '@/models/LoginModel';
import { CreateUserModel, UpdateUserModel } from '@/models/user.model';
import { AxiosResponse } from 'axios';

export default interface IAccountService {
  login_response_way(model: LoginModel): Promise<AxiosResponse<Response<LoginDto>>>;
  login(model: LoginModel): Promise<AxiosResponse<LoginDto>>;
  logout(token: string): Promise<AxiosResponse<Response<PlainDto>>>
  logoutAllSession(): Promise<AxiosResponse<Response<PlainDto>>>;
  getRefreshToken(token: string): Promise<AxiosResponse<Response<refreshTokenResponseDto>>>;
  createUser(model: CreateUserModel): Promise<AxiosResponse<Response<LoginDto>>>;
  updateProfile(model: UpdateUserModel): Promise<AxiosResponse<Response<UserDto>>>;
}
