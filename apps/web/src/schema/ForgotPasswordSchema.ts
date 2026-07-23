import * as Yup from 'yup';
import ForgotPasswordModel from '@/models/ForgotPasswordModel';

const ForgotPasswordSchema: Yup.ObjectSchema<ForgotPasswordModel> = Yup.object().shape({
    email: Yup.string().required('Email is required').email('Enter a valid email address'),
});

export default ForgotPasswordSchema;
