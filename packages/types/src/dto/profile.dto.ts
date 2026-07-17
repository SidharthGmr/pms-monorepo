import { RoleDto } from "./role.dto";

/**
 * Read model for the currently authenticated user's profile.
 * Mirrors the profile-relevant columns on the Prisma `users` model.
 */
export interface ProfileDto {
  id: number;
  usersId: string;
  name: string;
  userName: string;
  email: string;
  phone?: string | null;
  role: string;
  roles?: RoleDto[] | null;
  storeCode?: string | null;
  profileImageUrl?: string | null;
  dateOfBirth?: Date | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  pincode?: string | null;
  bio?: string | null;
  isActive?: boolean;
  isEmailVerified?: boolean;
  isPhoneVerified?: boolean;
  createdAt?: Date;
  updatedAt?: Date | null;
}

/**
 * Write model accepted by `PUT /users/profile` (self-update).
 * Only these fields are settable through the profile endpoint —
 * `email`, `userName` uniqueness and `password` are handled elsewhere.
 */
export interface UpdateProfileDto {
  name?: string;
  userName?: string;
  phone?: string | null;
  profileImageUrl?: string | null;
  dateOfBirth?: Date | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  pincode?: string | null;
  bio?: string | null;
}
