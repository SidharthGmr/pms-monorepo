
import { UserDto } from "../../dtos/user.dto";

export interface IAccountRepository {
  recordLogin(userId: string, ipAddress?: string | null): Promise<UserDto | null>;
  logout(userId: string): Promise<UserDto | null>;
  updateToken(userId: string, token: string): Promise<UserDto | null>;
  clearPasswordResetToken(email: string): Promise<UserDto | null>;
}
