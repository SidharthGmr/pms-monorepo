
import { Role } from "@prisma/client";
import { UserDto } from "../../dtos/user.dto";
import { ResetPasswordModel } from "../../models/forgot-password.model";
import { LoginModel } from "../../models/login.model";
import { CreateUserModel } from "../../models/user.model";

export interface IAccountService {
  login(data: LoginModel, token: string): Promise<UserDto | null>;
  signup(data: CreateUserModel, role: Role): Promise<UserDto>;
  create(data: CreateUserModel, storeCode: string): Promise<UserDto>;
  logout(userId: string): Promise<UserDto | null>;
  updateToken(userId: string, token: string): Promise<UserDto | null>;
  updateEmailVerification(userId: string): Promise<UserDto>;
  sendVerificationOtp(userId: string): Promise<UserDto>;
  updateEmailStatus(email: string): Promise<UserDto | null>;
  resetPassword(userId: string, data: ResetPasswordModel): Promise<UserDto>;
  convertToDto(user: UserDto, includePassword: boolean, includeToken: boolean, includeRefreshToken: boolean, includeVerificationToken: boolean): UserDto;
}
