import * as Yup from 'yup';

interface ResetPasswordFormModel {
    newPassword: string;
    confirmPassword: string;
}

const ResetPasswordTokenSchema: Yup.ObjectSchema<ResetPasswordFormModel> = Yup.object().shape({
    newPassword: Yup.string()
        .required('Password is required')
        .min(8, 'Password must be at least 8 characters')
        .matches(
            /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
            'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
        ),
    confirmPassword: Yup.string()
        .required('Confirm Password is required')
        .oneOf([Yup.ref('newPassword')], 'Passwords must match'),
});

export type { ResetPasswordFormModel };
export default ResetPasswordTokenSchema;
