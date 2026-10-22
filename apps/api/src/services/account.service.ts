
import { users } from "@prisma/client";
import bcrypt from "bcryptjs";
import { inject, injectable } from "inversify";
import { TYPES } from "../config/ioc.types";




import IUnitOfWork from "../repository/interfaces/iunitofwork.repository";
import { createUserName, generateStoreCode, generateUserGUID } from "../utils/authHelpers.service";
import { generateOtp } from "../utils/otp.util";
import { IAccountService } from "./interfaces/Iaccount.service";
import { INotificationService } from "./interfaces/Inotification.service";
import { getOtpExpiryDate } from "../utils/timeExpiry.util";
import { toUserDto, userProfileInclude } from "../repository/user-profile.mapper";
import { Role, StatusEnum, UserDto, ResetPasswordTokenModel, CreateUserModel, Roles } from '@pms/types';
@injectable()
export class AccountService implements IAccountService {
  constructor(
    @inject(TYPES.IUnitOfWork) private unitOfWork: IUnitOfWork,
    @inject(TYPES.INotificationService) private notificationService: INotificationService,
  ) { }


  async recordLogin(userId: string, ipAddress?: string | null): Promise<UserDto | null> {
    const user = await this.unitOfWork.Account.recordLogin(userId, ipAddress);
    if (!user) {
      return null;
    }

    return user;
  }

  async signup(data: CreateUserModel, role: Role) {
    const hashedPassword = await bcrypt.hash(data.password, 10);
    const { otp } = generateOtp();
    const storeCode = generateStoreCode(data.firstName ?? data.email);

    const created = await this.unitOfWork.transaction(async (transactionClient) => {
      await transactionClient.store.create({
        data: {
          name: `${data.firstName} ${data.lastName}'s Store - ${storeCode}`,
          code: storeCode,
          status: StatusEnum.Published,
        },
      });

      const user = await transactionClient.users.create({
        data: {
          userId: generateUserGUID().toString(),
          name: `${data.firstName} ${data.lastName}`,
          phone: data.phone || null,
          email: data.email,
          password: hashedPassword,
          emailVerificationToken: otp,
          emailVerificationExpires: getOtpExpiryDate(10),
          isActive: false,
          isEmailVerified: false,
          isPhoneVerified: false,
          storeCode: storeCode,
          role,
          UserProfile: {
            create: {
              name: `${data.firstName} ${data.lastName}`,
              userName: createUserName(`${data.firstName}`, `${data.lastName}`),
            },
          },
        },
        include: userProfileInclude,
      });

      return this.convertToDto(toUserDto(user));
    });

    // Fired only after the transaction has committed, and never awaited: a failed notification
    // must not roll back or slow down the registration it reports.
    void this.notificationService.notifyUserRegistered({
      storeCode,
      userId: created.userId,
      name: created.name ?? '',
      email: created.email ?? '',
      role: String(created.role ?? role),
    });

    return created;
  }

  async create(data: CreateUserModel, storeCode: string) {
    const hashedPassword = await bcrypt.hash(`${data.password}`, 10);
    const { otp } = generateOtp();

    const created = await this.unitOfWork.transaction(async (transactionClient) => {
      const user = await transactionClient.users.create({
        data: {
          userId: generateUserGUID().toString(),
          name: `${data.firstName} ${data.lastName}`,
          phone: data.phone || null,
          email: data.email,
          password: hashedPassword,
          emailVerificationToken: otp,
          emailVerificationExpires: getOtpExpiryDate(10),
          isActive: false,
          isEmailVerified: false,
          isPhoneVerified: false,
          role: data.role || Roles.USER,
          storeCode: storeCode,
          UserProfile: {
            create: {
              name: `${data.firstName} ${data.lastName}`,
              userName: createUserName(`${data.firstName}`, `${data.lastName}`),
            },
          },
        },
        include: userProfileInclude,
      });

      if (user.role === Roles.STAFF) {
        await transactionClient.staff.create({
          data: {
            userId: user.userId,
            storeCode: storeCode,
          }
        });
      }

      return this.convertToDto(toUserDto(user));
    });

    // Same as signup: the store's admins hear about the new account once it exists, and a
    // failed notification cannot undo the account.
    void this.notificationService.notifyUserRegistered({
      storeCode,
      userId: created.userId,
      name: created.name ?? '',
      email: created.email ?? '',
      role: String(created.role ?? data.role ?? Roles.USER),
    });

    return created;
  }


  async logout(userId: string): Promise<UserDto | null> {
    const user = await this.unitOfWork.Account.logout(userId);
    if (!user) {
      return null;
    }
    return user;
  }

  async updateToken(userId: string, token: string): Promise<UserDto | null> {
    const user = await this.unitOfWork.Account.updateToken(userId, token);
    if (!user) {
      return null;
    }
    return user;
  }

  async updateEmailVerification(userId: string): Promise<UserDto> {
    const { otp } = generateOtp();
    const otpExpiresAt = getOtpExpiryDate(10);

    return this.unitOfWork.transaction(async (transactionClient) => {
      const user = await transactionClient.users.update({
        where: { userId },
        data: {
          isActive: true,
          emailVerificationToken: otp,
          emailVerificationExpires: otpExpiresAt,
        },
        include: userProfileInclude,
      });

      return this.convertToDto(toUserDto(user));
    });
  }

  async sendVerificationOtp(userId: string): Promise<UserDto> {
    const { otp } = generateOtp();
    const otpExpiresAt = getOtpExpiryDate(10);

    return this.unitOfWork.transaction(async (transactionClient) => {
      const user = await transactionClient.users.update({
        where: { userId },
        data: {
          emailVerificationToken: otp,
          emailVerificationExpires: otpExpiresAt,
        },
        include: userProfileInclude,
      });

      return this.convertToDto(toUserDto(user));
    });
  }

  async updateEmailStatus(email: string): Promise<UserDto> {
    return this.unitOfWork.transaction(async (transactionClient) => {
      const user = await transactionClient.users.update({
        where: { email },
        data: {
          isEmailVerified: true,
          isActive: true,
          emailVerificationToken: null,
          emailVerificationExpires: null,
        },
        include: userProfileInclude,
      });
      return this.convertToDto(toUserDto(user));
    });
  }

  async getUserById(userId: string): Promise<UserDto | null> {
    const user = await this.unitOfWork.User.findById(userId);
    if (!user) {
      return null;
    }
    return user;
  }

  async resetPassword(userId: string, data: ResetPasswordTokenModel): Promise<UserDto> {

    if (data.newPassword !== data.confirmPassword) {
      throw new Error("New password and confirm password do not match.");
    }

    const existingUser = await this.unitOfWork.User.findById(userId);

    if (!existingUser) {
      throw new Error("User account was not found.");
    }

    const hashedPassword = await bcrypt.hash(data.newPassword, 10);

    // Clear the reset token so the link can only be used once.
    return this.unitOfWork.transaction(async (transactionClient) => {
      const updatedUser = await transactionClient.users.update({
        where: { userId },
        data: {
          password: hashedPassword,
          token: null,
          tokenUpdated: false,
        },
        include: userProfileInclude,
      });

      return this.convertToDto(toUserDto(updatedUser));
    });
  }

  async getUserOtp(userId: string): Promise<UserDto | null> {
    const user = await this.unitOfWork.User.findById(userId);
    if (!user) {
      return null;
    }
    return this.convertToDto(user, false, false, false, true);
  }

  convertToDto(user: UserDto, includePassword = false, includeToken = false, includeRefreshToken = false, includeVerificationToken = false): UserDto {
    return {
      id: user.id,
      userId: user.userId,
      // The web client reads `usersId`; it is the same value as `userId`.
      usersId: user.userId,
      name: user.name,
      userName: user.userName,
      email: user.email,
      phone: user.phone ?? null,
      password: includePassword ? user.password : null,
      role: user.role,
      isActive: user.isActive,
      isEmailVerified: user.isEmailVerified,
      isPhoneVerified: user.isPhoneVerified,
      loginAttempts: user.loginAttempts,
      lastLoginAt: user.lastLoginAt ?? null,
      lastLoginIP: user.lastLoginIP ?? null,
      emailVerificationToken: includeVerificationToken ? user.emailVerificationToken ?? null : null,
      emailVerificationExpires: includeVerificationToken ? user.emailVerificationExpires ?? null : null,
      profileImageUrl: user.profileImageUrl ?? null,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt ?? null,
      status: user.status,
      // token: includeToken ? user.token ?? null : null,
      // tokenUpdated: user.tokenUpdated,
      // refreshToken: includeRefreshToken ? user.refreshToken ?? null : null,
      storeCode: user.storeCode || null,
    };
  }

}

export default AccountService;
