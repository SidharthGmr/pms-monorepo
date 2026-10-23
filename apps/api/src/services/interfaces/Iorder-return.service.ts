import { ListResponseDto, OrderReturnDto, OrderReturnFilterParams, OrderReturnModel, OrderReturnStatusModel, ReturnedQuantityDto } from '@pms/types';

export interface IOrderReturnService {
  create(data: OrderReturnModel, storeCode: string, userId: string, userName: string, isAdmin: boolean): Promise<OrderReturnDto>;
  getAll(filters?: OrderReturnFilterParams): Promise<ListResponseDto<OrderReturnDto>>;
  getById(id: number, storeCode: string): Promise<OrderReturnDto>;
  update(id: number, data: OrderReturnModel, storeCode: string, isAdmin: boolean): Promise<OrderReturnDto>;
  delete(id: number, storeCode: string): Promise<OrderReturnDto>;
  updateStatus(id: number, data: OrderReturnStatusModel, storeCode: string, userId: string, isAdmin: boolean): Promise<OrderReturnDto>;
  /** Per order line, units already claimed by live returns - the dialog caps its steppers with this. */
  getReturnedQuantities(orderId: number, storeCode: string): Promise<ReturnedQuantityDto[]>;
}
