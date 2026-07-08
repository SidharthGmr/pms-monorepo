import * as Yup from 'yup';

export const nameField = (customMsg?: Partial<Record<'required' | 'pattern' | 'min' | 'max', string>>) =>
  Yup.string()
    .required(customMsg?.required || 'Name is required.')
    .matches(/^[a-zA-Z\s\-']+$/, customMsg?.pattern || 'Name can only contain letters, spaces, hyphens, and apostrophes.')
    .min(2, customMsg?.min || 'Name must be at least ${min} characters long.')
    .max(50, customMsg?.max || 'Name must not exceed ${max} characters.');

export const emailField = (customMsg?: Partial<Record<'required' | 'email', string>>) =>
  Yup.string()
    .required(customMsg?.required || 'Email is required.')
    .email(customMsg?.email || 'Invalid email address.');

export const passwordField = (customMsg?: Partial<Record<'required' | 'min' | 'uppercase' | 'lowercase' | 'number' | 'special', string>>) =>
  Yup.string()
    .required(customMsg?.required || 'Password is required.')
    .min(8, customMsg?.min || 'Password must be at least ${min} characters long.')
    .matches(/[A-Z]/, customMsg?.uppercase || 'Password must contain at least one uppercase letter.')
    .matches(/[a-z]/, customMsg?.lowercase || 'Password must contain at least one lowercase letter.')
    .matches(/[0-9]/, customMsg?.number || 'Password must contain at least one number.')
    .matches(/[!@#$%^&*(),.?":{}|<>]/, customMsg?.special || 'Password must contain at least one special character.');

export const confirmPasswordField = (refKey = 'password', message = 'Passwords must match.') =>
  Yup.string()
    .oneOf([Yup.ref(refKey), ''], message)
    .required('Confirm password is required.');

export const phoneField = ({
  required = true,
  messages = {},
}: {
  required?: boolean;
  messages?: {
    required?: string;
    pattern?: string;
  };
} = {}): Yup.StringSchema<string> => {
  let schema = Yup.string()
    .transform((value) => (value ? value.replace(/\D/g, '') : ''))
    .matches(/^[0-9]{10}$/, messages.pattern || 'Phone number must be exactly 10 digits.');

  if (required) {
    schema = schema.required(messages.required || 'Phone number is required.');
  } else {
    schema = schema.transform((value) => value ?? '');
  }

  return schema as Yup.StringSchema<string>;
};

export const zipCodeField = (customMsg?: Partial<Record<'required' | 'pattern', string>>) =>
  Yup.string()
    .required(customMsg?.required || 'Zip code is required.')
    .matches(/^\d{6}(-\d{5})?$/, customMsg?.pattern || 'Invalid zip code format.');

export const statusField = (customMsg?: Partial<Record<'required' | 'oneOf', string>>) =>
  Yup.string()
    .required(customMsg?.required || 'Status is required.')
    .oneOf(['active', 'inactive'], customMsg?.oneOf || 'Status must be either active or inactive.');

export const isAgreeField = (message = 'You must accept the privacy policy.') =>
  Yup.boolean()
    .oneOf([true], message)
    .required('This field is required.');

export const isOfferField = (message = 'This field is required.') =>
  Yup.boolean().required(message);

export const messageField = ({
  required = false,
  messages = {},
}: {
  required?: boolean;
  messages?: {
    required?: string;
    invalid?: string;
  };
} = {}): Yup.StringSchema<string> => {
  let schema = Yup.string()
    .test(
      'validate-message',
      messages.invalid || 'Message contains invalid characters.',
      (value) =>
        typeof value === 'undefined' || /^[a-zA-Z0-9\s.,'!?@#&()_\-]*$/.test(value)
    );

  if (required) {
    schema = schema.required(messages.required || 'Message is required.');
  } else {
    schema = schema.transform((value) => value ?? '');
  }

  return schema as Yup.StringSchema<string>;
};

export const recaptchaTokenField = (message = 'Verify you are a human.') =>
  Yup.string().required(message);
