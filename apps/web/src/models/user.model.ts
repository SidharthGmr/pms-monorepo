export interface CreateUserModel {
  firstName?: string;
  lastName?: string;
  email: string;
  phone?: string;
  password: string;
  isRegisterbyShop?: boolean;
  role?: string;
}

export interface UpdateUserModel {
  name?: string;
  userName?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  profileImageUrl?: string;
  dateOfBirth?: Date | undefined;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  pincode?: string;
  bio?: string;
}
