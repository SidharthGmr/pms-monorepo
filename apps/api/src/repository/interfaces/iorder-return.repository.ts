import { ListResponseDto, OrderReturnDto, OrderReturnFilterParams, ReturnedQuantityDto } from '@pms/types';

export interface IOrderReturnRepository {
  findAll(filters?: OrderReturnFilterParams): Promise<ListResponseDto<OrderReturnDto>>;
  findById(id: number): Promise<OrderReturnDto | null>;
  /** Every return a customer has raised, newest first - the customer-facing account view. */
  findByCustomerId(customerId: string): Promise<OrderReturnDto[]>;
  /** Per order line, units claimed by live returns - REJECTED and CANCELLED do not count. */
  sumActiveByOrderItem(orderId: number, excludeReturnId?: number): Promise<ReturnedQuantityDto[]>;
  /** Live returns on an order; used to block the whole-order RETURNED/CANCELLED restock path. */
  countActiveByOrder(orderId: number): Promise<number>;
  /** Refund money already promised or paid out against an order by live returns. */
  sumActiveRefundByOrder(orderId: number, excludeReturnId?: number): Promise<number>;
}
