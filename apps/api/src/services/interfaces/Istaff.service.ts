import { CreateStaffDto, StaffDto, UpdateStaffDto } from "../../dtos/staff.dto";
import { StaffFilterParams } from "../../params/staff.params";

export interface IStaffService {
    getAll(filters?: StaffFilterParams): Promise<StaffDto[]>;
    getById(id: number): Promise<StaffDto | null>;
    getByUserId(userId: string): Promise<StaffDto | null>;
    getByStoreCode(storeCode: string): Promise<StaffDto[]>;
    create(data: CreateStaffDto): Promise<StaffDto>;
    update(id: number, data: UpdateStaffDto): Promise<StaffDto>;
    delete(id: number): Promise<StaffDto>;
    count(filters?: StaffFilterParams): Promise<number>;
}
