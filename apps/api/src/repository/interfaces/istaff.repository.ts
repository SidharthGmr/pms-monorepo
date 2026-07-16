import { StaffDto } from "../../dtos/staff.dto";
import { StaffFilterParams } from "../../params/staff.params";

export interface IStaffRepository {
    findAll(filters?: StaffFilterParams): Promise<StaffDto[]>;
    findById(id: number): Promise<StaffDto | null>;
    findByUserId(userId: string): Promise<StaffDto | null>;
    findByStoreCode(storeCode: string): Promise<StaffDto[]>;
    create(data: any): Promise<StaffDto>;
    update(id: number, data: any): Promise<StaffDto>;
    delete(id: number): Promise<StaffDto>;
    count(filters?: StaffFilterParams): Promise<number>;
}
