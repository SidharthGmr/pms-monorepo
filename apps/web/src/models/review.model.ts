export interface CreateReviewModel {
  orderId: number;
  productId: number;
  rating: number;
  title?: string | null;
  comment?: string | null;
  images?: string[];
}

/** Customers send the text fields; only staff may send `status`. */
export interface UpdateReviewModel {
  rating?: number;
  title?: string | null;
  comment?: string | null;
  images?: string[];
  status?: string;
}

export interface CreateReviewReplyModel {
  reviewId: number;
  comment: string;
}

export interface UpdateReviewReplyModel {
  comment: string;
}
