import { Role } from "../enum/role.enum";
import { Status } from "../enum/status.enum";
import { RoleDto } from "./role.dto";

/**
 * A user row as the API returns it (`toUserDto` flattens `UserProfile` back onto it).
 * `usersId` is the same value as `userId`, exposed under both names because the web
 * client reads `usersId`.
 */
export interface UserDto {
  id: number;
  userId: string;
  usersId: string;
  name: string;
  userName: string;
  phone?: string | null;
  email: string;
  password: string | null;
  isRegisteredByShop?: boolean;
  storeCode?: string | null;
  role: Role;
  roles?: RoleDto[] | null;
  isActive: boolean;
  isEmailVerified: boolean;
  emailVerificationToken?: string | null;
  emailVerificationExpires?: Date | string | null;
  isPhoneVerified: boolean;
  profileImageUrl?: string | null;
  loginAttempts: number;
  lastLoginAt?: Date | string | null;
  lastLoginIP?: string | null;
  createdAt: Date | string;
  updatedAt?: Date | string | null;
  status: Status;
  token?: string | null;
  tokenUpdated?: boolean;
  refreshToken?: string | null;
  dateOfBirth?: Date | string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  pincode?: string | null;
  bio?: string | null;
}

export interface CreateUserDto {
  userId: string;
  name: string;
  userName: string;
  phone?: string | null;
  email: string;
  password: string;
  role: Role;
  isActive: boolean;
  createdAt: Date;
  storeId?: number | null;
}

export interface UpdateUserDto {
  name?: string;
  userName?: string;
  phone?: string | null;
  updatedAt?: Date | null;
  profileImageUrl?: string | null;
  status?: Status;
  storeId?: number | null;
  dateOfBirth?: Date | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  pincode?: string | null;
  bio?: string | null;
}

export interface UserBasicDto {
  id: number;
  employeeCode: string | null;
  companyId: number;
  userId: string;
  userName: string;
  email: string;
  fullName: string;
  roleName: string;
  isRegisteredByShop: boolean;
  storeCode: string | null;
  role: RoleDto[] | null;
  roles: RoleDto[] | null;
  profilePicture: string | null;
  phoneNumber: string | null;
  token: string | null;
  isActive: boolean;
  isDelete: boolean;
  userType: string;
  timezoneId: string;
  backgroundColorClass?: string;
}

export interface UserStatusDto {
  isActive: boolean;
  isEmailVerified: boolean;
  isPhoneVerified: boolean;
}