import { Role } from "@prisma/client";

import { ListResponseDto, CreateReviewDto, ReviewDto, ReviewSummaryDto, UpdateReviewDto, ReviewFilterParams } from '@pms/types';
/** Identity of the caller, so the service can enforce owner-or-staff rules. */
export interface ReviewActor {
    userId: string;
    role: Role;
}

export interface IReviewService {
    getAll(filters?: ReviewFilterParams): Promise<ListResponseDto<ReviewDto>>;
    getById(id: number): Promise<ReviewDto | null>;
    getSummary(productId: number): Promise<ReviewSummaryDto>;
    create(data: CreateReviewDto, actor: ReviewActor, storeCode: string): Promise<ReviewDto>;
    update(id: number, data: UpdateReviewDto, actor: ReviewActor): Promise<ReviewDto>;
    delete(id: number, actor: ReviewActor): Promise<ReviewDto>;
}
