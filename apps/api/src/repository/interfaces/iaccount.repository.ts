
import { CreateUserDto, UserDto } from "../../dtos/user.dto";
import { LoginModel } from "../../models/login.model";

export interface IAccountRepository {
  login(data: LoginModel, token: string): Promise<UserDto | null>;
  logout(userId: string): Promise<UserDto | null>;
  updateToken(userId: string, token: string): Promise<UserDto | null>;
  clearPasswordResetToken(email: string): Promise<UserDto | null>;
}
