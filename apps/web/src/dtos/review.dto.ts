import { StatusValues } from '@/enums/status-values.enum';

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
  createdAt: string;
  updatedAt: string;
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
  status: StatusValues | string;
  createdAt: string;
  updatedAt: string;
  user?: ReviewUserDto | null;
  product?: ReviewProductDto | null;
  replies?: ReviewReplyDto[];
}

export interface ReviewSummaryDto {
  productId: number;
  averageRating: number;
  totalReviews: number;
  ratingCounts: Record<string, number>;
}
