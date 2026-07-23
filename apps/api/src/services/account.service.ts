
import { users } from "@prisma/client";
import bcrypt from "bcryptjs";
import { inject, injectable } from "inversify";
import { TYPES } from "../config/ioc.types";
import { OtpDto, UserDto } from "../dtos/user.dto";
import { ResetPasswordModel } from "../models/forgot-password.model";
import { LoginModel } from "../models/login.model";
import { CreateUserModel } from "../models/user.model";
import IUnitOfWork from "../repository/interfaces/iunitofwork.repository";
import { createUserName, generateStoreCode, generateUserGUID } from "../utils/authHelpers.service";
import { generateOtp } from "../utils/otp.util";
import { IAccountService } from "./interfaces/Iaccount.service";
import { getOtpExpiryDate } from "../utils/timeExpiry.util";
import { Role, Status, StatusEnum } from "@pms/types";

@injectable()
export class AccountService implements IAccountService {
  constructor(
    @inject(TYPES.IUnitOfWork) private unitOfWork: IUnitOfWork,
  ) { }


  async login(data: LoginModel, token: string,): Promise<UserDto | null> {
    const user = await this.unitOfWork.Account.login(data, token);
    if (!user) {
      return null;
    }

    return user;
  }

  async signup(data: CreateUserModel, role: Role) {
    const hashedPassword = await bcrypt.hash(data.password, 10);
    const { otp } = generateOtp();
    const storeCode = generateStoreCode(data.firstName);

    return this.unitOfWork.transaction(async (transactionClient) => {
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
          userName: createUserName(`${data.firstName}`, `${data.lastName}`),
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
        },
      });

      return this.convertToDto(user);
    });
  }

  async create(data: CreateUserModel, storeCode: string) {
    const hashedPassword = await bcrypt.hash(`${data.password}`, 10);
    const { otp } = generateOtp();

    return this.unitOfWork.transaction(async (transactionClient) => {
      const user = await transactionClient.users.create({
        data: {
          userId: generateUserGUID().toString(),
          name: `${data.firstName} ${data.lastName}`,
          userName: createUserName(`${data.firstName}`, `${data.lastName}`),
          phone: data.phone || null,
          email: data.email,
          password: hashedPassword,
          emailVerificationToken: otp,
          emailVerificationExpires: getOtpExpiryDate(10),
          isActive: false,
          isEmailVerified: false,
          isPhoneVerified: false,
          role: data.role || Role.user,
          storeCode: storeCode,
        },
      });

      // if (user.role === Role.STAFF) {
      //   await transactionClient.staff.create({
      //     data: {
      //       userId: ,
      //       storeCode: storeCode,
      //     }
      //   });
      // }

      return this.convertToDto(user);
    });
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
          emailVerificationToken: otp,
          emailVerificationExpires: otpExpiresAt,
        },
      });

      return this.convertToDto(user);
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
      });

      return this.convertToDto(user);
    });
  }

  async updateEmailStatus(email: string): Promise<UserDto> {
    return this.unitOfWork.transaction(async (transactionClient) => {
      const user = await transactionClient.users.update({
        where: { email },
        data: {
          isEmailVerified: true,
          emailVerificationToken: null,
          emailVerificationExpires: null,
        },
      });
      return this.convertToDto(user);
    });
  }

  async getUserById(userId: string): Promise<UserDto | null> {
    const user = await this.unitOfWork.User.findById(userId);
    if (!user) {
      return null;
    }
    return user;
  }

  async resetPassword(userId: string, data: ResetPasswordModel): Promise<UserDto> {

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
      });

      return this.convertToDto(updatedUser);
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
      token: includeToken ? user.token ?? null : null,
      tokenUpdated: user.tokenUpdated,
      refreshToken: includeRefreshToken ? user.refreshToken ?? null : null,
      storeCode: user.storeCode || null,
    };
  }



}

export default AccountService;
