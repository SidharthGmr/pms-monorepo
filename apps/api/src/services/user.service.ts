import { Role as PrismaRole, Status as PrismaStatus, users } from "@prisma/client";
import { inject, injectable } from "inversify";
import { TYPES } from "../config/ioc.types";
import { UpdateUserDto, UserDto } from "../dtos/user.dto";
import type IUnitOfWork from "../repository/interfaces/iunitofwork.repository";
import type { IDateTimeService } from "./interfaces/idatetime.service";
import type { IUserService } from "./interfaces/Iuser.service";
import { UserFilterParams } from "../params/user.params";
import type { UserWithProfile } from "../repository/user-profile.mapper";

@injectable()
export class UserService implements IUserService {
  constructor(
    @inject(TYPES.IUnitOfWork) private unitOfWork: IUnitOfWork,
    @inject(TYPES.IDateTimeService)
    private dateTime: IDateTimeService
  ) { }


  async getAll(filters: UserFilterParams): Promise<UserDto[] | null> {
    const userList = await this.unitOfWork.User.findAll(filters);
    if (!userList || userList.length === 0) {
      throw new Error("No user found");
    }
    return userList;
  }

  async getUserById(userId: string): Promise<UserDto | null> {
    const user = await this.unitOfWork.User.findById(userId);
    if (!user) {
      return null;
    }
    return user;
  }

  async getByEmail(email: string): Promise<UserDto | null> {
    const user = await this.unitOfWork.User.findByEmail(email);

    if (!user) {
      return null;
    }
    return user;
  }

  async update(userId: string, updatedData: UpdateUserDto): Promise<UserDto | null> {
    const user = await this.unitOfWork.User.update(userId, { ...updatedData, });
    if (!user) {
      return null;
    }
    return user;
  }

  async updateStatus(userId: string, updatedData: UpdateUserDto): Promise<UserDto | null> {
    const user = await this.unitOfWork.User.updateStatus(userId, { ...updatedData });
    if (!user) {
      return null;
    }
    return user;
  }

  async updateActiveStatus(userId: string, isActive: boolean): Promise<UserDto | null> {
    const user = await this.unitOfWork.User.updateActiveStatus(userId, isActive);
    if (!user) {
      return null;
    }
    return user;
  }

  async delete(userId: string): Promise<UserDto | null> {
    const user = await this.unitOfWork.User.delete(userId);
    return user;
  }

  async updateRole(userId: string, role: PrismaRole): Promise<UserDto | null> {
    const user = await this.unitOfWork.User.updateRole(userId, role);
    if (!user) {
      return null;
    }
    return user;
  }

  async updateUserByIdentifier(
    identifier: { email?: string; userId?: string; phone?: string },
    data: { role?: PrismaRole; status?: PrismaStatus }
  ): Promise<UserDto | null> {
    const { email, userId, phone } = identifier;

    let user: UserDto | null = null;

    if (userId) {
      user = await this.unitOfWork.User.findById(userId);
    } else if (email) {
      user = await this.unitOfWork.User.findByEmail(email);
    } else if (phone) {
      user = await this.unitOfWork.User.findByPhone(phone);
    }

    if (!user) {
      return null;
    }

    let result: UserDto | null = user;

    if (data.role) {
      result = await this.unitOfWork.User.updateRole(user.userId, data.role);
    }

    if (data.status) {
      result = await this.unitOfWork.User.update(user.userId, { status: data.status });
    }

    return result;
  }


  async getBystoreId(storeId: string): Promise<UserDto | null> {
    const user = await this.unitOfWork.User.getBystoreId(storeId);
    if (!user) {
      return null;
    }
    return user;
  }

  async getUserOtp(userId: string): Promise<UserDto | null> {
    const user = await this.unitOfWork.User.findById(userId);
    if (!user) {
      return null;
    }
    return user;
  }

  convertToDto(user: UserWithProfile, includePassword: boolean = false, token: boolean = false, refreshToken: boolean = false,): UserDto {
    const profile = user.UserProfile;
    return {
      id: user.id,
      userId: user.userId,
      name: user.name,
      userName: profile?.userName ?? '',
      email: user.email,
      phone: user.phone,
      password: includePassword ? user.password : '',
      role: user.role,
      isActive: user.isActive,
      isEmailVerified: user.isEmailVerified,
      isPhoneVerified: user.isPhoneVerified,
      loginAttempts: user.loginAttempts,
      lastLoginAt: user.lastLoginAt,
      lastLoginIP: user.lastLoginIP,
      emailVerificationToken: user.emailVerificationToken,
      emailVerificationExpires: user.emailVerificationExpires,
      profileImageUrl: profile?.profileImageUrl ?? null,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      status: user.status,
      token: token ? user.token : null,
      tokenUpdated: user.tokenUpdated,
      refreshToken: token ? user.refreshToken : null,
      storeCode: user.storeCode || null,
      dateOfBirth: profile?.dateOfBirth || null,
      address: profile?.address || null,
      city: profile?.city || null,
      state: profile?.state || null,
      country: profile?.country || null,
      pincode: profile?.pincode || null,
      bio: profile?.bio || null,
    };
  }
}

export default UserService;
