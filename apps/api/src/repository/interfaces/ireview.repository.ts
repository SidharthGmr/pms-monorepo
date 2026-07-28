import { Prisma } from "@prisma/client";
import { ReviewDto, ReviewSummaryDto } from "../../dtos/review.dto";
import { ListResponseDto } from "../../dtos/list-response.dto";
import { ReviewFilterParams } from "../../params/review.params";

export interface IReviewRepository {
    findAll(filters?: ReviewFilterParams): Promise<ListResponseDto<ReviewDto>>;
    /** Pass `tx` when reading back a row written inside an open transaction. */
    findById(id: number, tx?: Prisma.TransactionClient): Promise<ReviewDto | null>;
    /** Soft delete - Review carries a `status`, so Trash keeps the row for auditing. */
    delete(id: number): Promise<ReviewDto>;
    /** Average and per-star counts for a product, ignoring Draft/Trash rows. */
    getSummary(productId: number): Promise<ReviewSummaryDto>;
}
