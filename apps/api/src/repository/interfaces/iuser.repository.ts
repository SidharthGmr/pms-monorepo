import { Role } from "@prisma/client";
import { UpdateUserDto, UserDto } from "../../dtos/user.dto";
import { UserFilterParams } from "../../params/user.params";

export interface IUserRepository {
  findAll(filters: UserFilterParams): Promise<UserDto[]>;
  findById(id: string): Promise<UserDto | null>;
  findByEmail(email: string): Promise<UserDto | null>;
  findByPhone(phone: string): Promise<UserDto | null>;
  update(id: string, updatedData: UpdateUserDto): Promise<UserDto>;
  updateStatus(id: string, updatedData: UpdateUserDto): Promise<UserDto>;
  updateActiveStatus(id: string, isActive: boolean): Promise<UserDto>;
  delete(id: string): Promise<UserDto>;
  updateRole(id: string, role: Role): Promise<UserDto>;
  getBystoreId(storeId: string): Promise<UserDto | null>;
}
