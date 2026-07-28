import { Role } from "@prisma/client";
import { CreateReviewDto, ReviewDto, ReviewSummaryDto, UpdateReviewDto } from "../../dtos/review.dto";
import { ListResponseDto } from "../../dtos/list-response.dto";
import { ReviewFilterParams } from "../../params/review.params";

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
