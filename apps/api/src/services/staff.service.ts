import { inject, injectable } from "inversify";
import { TYPES } from "../config/ioc.types";
import IUnitOfWork from "../repository/interfaces/iunitofwork.repository";
import { IStaffService } from "./interfaces/Istaff.service";
import { CreateStaffDto, StaffDto, UpdateStaffDto } from "../dtos/staff.dto";
import { StaffFilterParams } from "../params/staff.params";

@injectable()
export class StaffService implements IStaffService {
    constructor(@inject(TYPES.IUnitOfWork) private unitOfWork: IUnitOfWork) { }

    async getAll(filters?: StaffFilterParams): Promise<StaffDto[]> {
        return this.unitOfWork.Staff.findAll(filters);
    }

    async getById(id: number): Promise<StaffDto | null> {
        return this.unitOfWork.Staff.findById(id);
    }

    async getByUserId(userId: number): Promise<StaffDto | null> {
        return this.unitOfWork.Staff.findByUserId(userId);
    }

    async getByStoreCode(storeCode: string): Promise<StaffDto[]> {
        return this.unitOfWork.Staff.findByStoreCode(storeCode);
    }

    async create(data: CreateStaffDto): Promise<StaffDto> {
        return this.unitOfWork.Staff.create(data);
    }

    async update(id: number, data: UpdateStaffDto): Promise<StaffDto> {
        return this.unitOfWork.Staff.update(id, data);
    }

    async delete(id: number): Promise<StaffDto> {
        return this.unitOfWork.Staff.delete(id);
    }

    async count(filters?: StaffFilterParams): Promise<number> {
        return this.unitOfWork.Staff.count(filters);
    }
}
