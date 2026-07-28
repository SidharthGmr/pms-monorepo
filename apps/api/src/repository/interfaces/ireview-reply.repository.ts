import { Prisma } from "@prisma/client";
import { ReviewReplyDto } from "../../dtos/review.dto";
import { ListResponseDto } from "../../dtos/list-response.dto";
import { ReviewReplyFilterParams } from "../../params/review.params";

export interface IReviewReplyRepository {
    findAll(filters?: ReviewReplyFilterParams): Promise<ListResponseDto<ReviewReplyDto>>;
    /** Pass `tx` when reading back a row written inside an open transaction. */
    findById(id: number, tx?: Prisma.TransactionClient): Promise<ReviewReplyDto | null>;
    /** Hard delete - a reply has no status column to soft-delete into. */
    delete(id: number): Promise<ReviewReplyDto>;
}
