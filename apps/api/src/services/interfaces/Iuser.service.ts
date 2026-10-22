import { Role, Status } from "@prisma/client";

import { ListResponseDto, UpdateUserDto, UserDto, UserFilterParams } from '@pms/types';
export interface IUserService {
  getAll(filters: UserFilterParams): Promise<ListResponseDto<UserDto>>;
  getUserById(userId: string): Promise<UserDto | null>;
  getByEmail(email: string, includePassword?: boolean): Promise<UserDto | null>;
  update(userId: string, updatedData: UpdateUserDto): Promise<UserDto | null>;
  updateStatus(userId: string, updatedData: UpdateUserDto): Promise<UserDto | null>;
  updateActiveStatus(userId: string, isActive: boolean): Promise<UserDto | null>;
  delete(userId: string): Promise<UserDto | null>;
  updateRole(userId: string, role: Role): Promise<UserDto | null>;
  updateUserByIdentifier(identifier: { email?: string; userId?: string; phone?: string }, data: { role?: Role; status?: Status }): Promise<UserDto | null>;
  getBystoreId(storeId: string): Promise<UserDto | null>;

  getUserOtp(userId: string): Promise<UserDto | null>;
}
