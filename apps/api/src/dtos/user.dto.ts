import { Role, Status } from "@prisma/client";

export interface UserDto {
  id: number;
  userId: string;
  name: string;
  userName: string;
  phone?: string | null;
  email: string;
  password: string | null;
  role: Role;
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
  status: Status;
  token?: string | null;
  tokenUpdated: boolean;
  refreshToken?: string | null;
  storeCode?: string | null;
  dateOfBirth?: Date | null;
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

export interface UpdateOtpDto {
  emailVerificationToken?: string | null;
  emailVerificationExpires?: Date | null;
}
export interface OtpDto {
  emailVerificationToken?: string | null;
  emailVerificationExpires?: Date | null;
}

// export interface UpdateUserDto extends Partial<CreateUserDto> {}
