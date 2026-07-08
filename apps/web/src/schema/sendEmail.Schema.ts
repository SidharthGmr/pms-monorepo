 import { sendEmailModel } from '@/models/sendEmail.model';
import * as Yup from 'yup';

const sendEmailSchema: Yup.ObjectSchema<sendEmailModel> = Yup.object().shape({
  userId: Yup.string().required('User ID is required'),
  newsletterId: Yup.number().optional(),
  recipient: Yup.string().required('Recipient Email is required'),
  subject: Yup.string().required('Subject is required'),
  htmlContent: Yup.string().required('HTML content is required'), 

});

export default sendEmailSchema;
