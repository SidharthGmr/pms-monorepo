import { Status } from '@prisma/client';

export interface ReviewUserDto {
    userId: string;
    name: string;
    email: string;
    profileImageUrl?: string | null;
}

export interface ReviewProductDto {
    id: number;
    name: string;
    slug: string;
    images: string[];
    storeCode: string;
}

export interface ReviewReplyDto {
    id: number;
    reviewId: number;
    userId: string;
    comment: string;
    createdAt: Date;
    updatedAt: Date;
    user?: ReviewUserDto | null;
}

export interface ReviewDto {
    id: number;
    orderId: number;
    productId: number;
    userId: string;
    rating: number;
    title?: string | null;
    comment?: string | null;
    images: string[];
    isVerified: boolean;
    status: Status;
    createdAt: Date;
    updatedAt: Date;
    user?: ReviewUserDto | null;
    product?: ReviewProductDto | null;
    replies?: ReviewReplyDto[];
}

export interface CreateReviewDto {
    orderId: number;
    productId: number;
    rating: number;
    title?: string | null;
    comment?: string | null;
    images?: string[];
}

/** Customers may edit their own rating/text; only staff may move `status`. */
export interface UpdateReviewDto {
    rating?: number;
    title?: string | null;
    comment?: string | null;
    images?: string[];
    status?: Status;
}

export interface CreateReviewReplyDto {
    reviewId: number;
    comment: string;
}

export interface UpdateReviewReplyDto {
    comment: string;
}

/** Feeds the star breakdown on a product page. */
export interface ReviewSummaryDto {
    productId: number;
    averageRating: number;
    totalReviews: number;
    ratingCounts: Record<1 | 2 | 3 | 4 | 5, number>;
}
