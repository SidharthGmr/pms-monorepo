import * as Yup from 'yup';

/** Backs the customer write-review form. */
const ReviewSchema = Yup.object().shape({
  rating: Yup.number().min(1, 'Please pick a rating').max(5, 'Rating must be between 1 and 5').required('Please pick a rating'),
  title: Yup.string().max(255, 'Title is too long').nullable().optional(),
  comment: Yup.string().max(5000, 'Comment is too long').nullable().optional(),
});

/** Backs the admin reply dialog. */
export const ReviewReplySchema = Yup.object().shape({
  comment: Yup.string().max(5000, 'Reply is too long').required('Reply is required'),
});

export default ReviewSchema;
