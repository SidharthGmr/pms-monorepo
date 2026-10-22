




import { CustomResponse as Response, ListResponseDto, UserListParams, LoginDto, PlainDto, UserDto, ResetPasswordModel, CreateUserModel } from '@pms/types';
import { AxiosResponse } from 'axios';

export default interface IUserListService {
  getAll(p?: UserListParams): Promise<AxiosResponse<Response<ListResponseDto<UserDto>>>>;
  getById(id: string): Promise<AxiosResponse<Response<UserDto>>>;
  update(id: string, model: any): Promise<AxiosResponse<Response<UserDto>>>;
  updateActiveStatus(userId: string, isActive: boolean): Promise<AxiosResponse<Response<UserDto>>>;

  // updateCommentStatus(commentId: number, model: ForumQuestionsOrCommentStatusModel): Promise<AxiosResponse<Response<ForumQuestionsDto>>>;

  delete(id: string): Promise<AxiosResponse<Response<UserDto>>>;

  getOtp(otp: number): Promise<AxiosResponse<Response<UserDto>>>;
  sendOtp(): Promise<AxiosResponse<Response<PlainDto>>>;
  resetPassword(model: ResetPasswordModel): Promise<AxiosResponse<Response<PlainDto>>>;
  createUser(model: CreateUserModel): Promise<AxiosResponse<Response<LoginDto>>>;
}
