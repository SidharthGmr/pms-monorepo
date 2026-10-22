import { Role } from '../enum/role.enum';

export interface CreateUserModel {
  firstName?: string;
  lastName?: string;
  email: string;
  phone?: string;
  password: string;
  /** Set when an admin creates the account from the back-office rather than self sign-up. */
  isRegisteredByShop?: boolean;
  role?: Role;
}

export interface UpdateUserModel {
  name?: string;
  userName?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  profileImageUrl?: string;
  dateOfBirth?: Date | string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  pincode?: string;
  bio?: string;
}
