import { CreateReviewReplyDto, ReviewReplyDto, UpdateReviewReplyDto } from "../../dtos/review.dto";
import { ListResponseDto } from "../../dtos/list-response.dto";
import { ReviewReplyFilterParams } from "../../params/review.params";
import { ReviewActor } from "./Ireview.service";

export interface IReviewReplyService {
    getAll(filters?: ReviewReplyFilterParams): Promise<ListResponseDto<ReviewReplyDto>>;
    getById(id: number): Promise<ReviewReplyDto | null>;
    create(data: CreateReviewReplyDto, actor: ReviewActor): Promise<ReviewReplyDto>;
    update(id: number, data: UpdateReviewReplyDto, actor: ReviewActor): Promise<ReviewReplyDto>;
    delete(id: number, actor: ReviewActor): Promise<ReviewReplyDto>;
}
