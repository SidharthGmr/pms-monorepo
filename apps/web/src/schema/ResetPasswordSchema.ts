import * as Yup from 'yup';
import ResetPasswordModel from '@/models/ResetPasswordModel';

const ResetPasswordSchema: Yup.ObjectSchema<ResetPasswordModel> = Yup.object().shape({
    otp: Yup.string()
        .required('OTP is required')
        .length(4, 'OTP must be exactly 4 characters'),
    password: Yup.string()
        .required('Password is required')
        .min(8, 'Password must be at least 8 characters')
        .matches(
            /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
            'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
        ),
    confirmPassword: Yup.string()
        .required('Confirm Password is required')
        .oneOf([Yup.ref('password')], 'Passwords must match'),
});

export default ResetPasswordSchema;
