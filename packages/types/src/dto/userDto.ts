import { RoleDto } from "./roleDto";



export interface UserDto {
  id: number;
  usersId: string;
  name: string;
  userName: string;
  phone?: string | null;
  email: string;
  password?: string | null;
  isRegisterbyShop: boolean;
  storeCode?: string | null;
  role: string;
  roles: RoleDto[] | null;
  isActive: boolean;
  isEmailVerified: boolean;
  emailVerificationToken?: string | null;
  emailVerificationExpires?: Date | null;
  isPhoneVerified: boolean;
  profileImageUrl?: string | null;
  loginAttempts: number;
  lastLoginAt?: Date | null;
  lastLoginIP?: string | null;
  createdAt: Date;
  updatedAt?: Date | null;
  token: string | null;
  tokenUpdated?: Date | null;
  refreshToken: string | null;
  status: boolean;
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
  isRegisterbyShop: boolean;
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