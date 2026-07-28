import { ReviewReplyDto } from "../../dtos/review.dto";
import { ListResponseDto } from "../../dtos/list-response.dto";
import { ReviewReplyFilterParams } from "../../params/review.params";

export interface IReviewReplyRepository {
    findAll(filters?: ReviewReplyFilterParams): Promise<ListResponseDto<ReviewReplyDto>>;
    findById(id: number): Promise<ReviewReplyDto | null>;
    /** Hard delete - a reply has no status column to soft-delete into. */
    delete(id: number): Promise<ReviewReplyDto>;
}
