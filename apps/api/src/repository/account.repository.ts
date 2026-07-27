import prisma from "../config/prisma";
import { CreateUserDto, UserDto } from "../dtos/user.dto";
import { IAccountRepository } from "./interfaces/iaccount.repository";
import { toUserDto, userProfileInclude } from "./user-profile.mapper";

export class AccountRepository implements IAccountRepository {

  async login(data: CreateUserDto, token: string): Promise<UserDto | null> {
    const user = await prisma.users.update({
      where: { email: data.email },
      data: {
        token: token,
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
