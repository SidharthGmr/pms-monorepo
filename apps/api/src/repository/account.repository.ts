import prisma from "../config/prisma";
import { CreateUserDto, UserDto } from "../dtos/user.dto";
import { IAccountRepository } from "./interfaces/iaccount.repository";

export class AccountRepository implements IAccountRepository {

  async login(data: CreateUserDto, token: string): Promise<UserDto | null> {
    return prisma.users.update({
      where: { email: data.email },
      data: {
        token: token,
      },
    });
  }

  async logout(userId: string): Promise<UserDto | null> {
    return prisma.users.update({
      where: { userId: userId },
      data: {
        token: null,
        refreshToken: null,
      },
    });
  }

  async updateToken(userId: string, token: string): Promise<UserDto | null> {
    return prisma.users.update({
      where: { userId: userId },
      data: {
        token: token,
        tokenUpdated: true,
      },
    });
  }

  async clearPasswordResetToken(email: string): Promise<UserDto | null> {
    return await prisma.users.update({
      where: { email },
      data: {
        emailVerificationToken: null,
        emailVerificationExpires: null,
      },
    });
  }


}
