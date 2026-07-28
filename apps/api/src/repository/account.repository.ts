import prisma from "../config/prisma";
import { UserDto } from "../dtos/user.dto";
import { IAccountRepository } from "./interfaces/iaccount.repository";
import { toUserDto, userProfileInclude } from "./user-profile.mapper";

export class AccountRepository implements IAccountRepository {

  /**
   * Access tokens are no longer written to `users.token` — they live (hashed) on
   * `UserSession`. A successful login only stamps the audit columns.
   */
  async recordLogin(userId: string, ipAddress?: string | null): Promise<UserDto | null> {
    const user = await prisma.users.update({
      where: { userId },
      data: {
        loginAttempts: 0,
        lastLoginAt: new Date(),
        lastLoginIP: ipAddress ?? null,
      },
      include: userProfileInclude,
    });
    return toUserDto(user);
  }

  async logout(userId: string): Promise<UserDto | null> {
    const user = await prisma.users.update({
      where: { userId: userId },
      data: {
        token: null,
        refreshToken: null,
      },
      include: userProfileInclude,
    });
    return toUserDto(user);
  }

  async updateToken(userId: string, token: string): Promise<UserDto | null> {
    const user = await prisma.users.update({
      where: { userId: userId },
      data: {
        token: token,
        tokenUpdated: true,
      },
      include: userProfileInclude,
    });
    return toUserDto(user);
  }

  async clearPasswordResetToken(email: string): Promise<UserDto | null> {
    const user = await prisma.users.update({
      where: { email },
      data: {
        emailVerificationToken: null,
        emailVerificationExpires: null,
      },
      include: userProfileInclude,
    });
    return toUserDto(user);
  }


}
