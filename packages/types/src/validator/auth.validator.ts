import { z } from "zod";
import { emailField, passwordField } from "./fields";

export const loginFields = z.object({
  email: emailField(),
  password: z.string().min(1, "Password is required"),
});

export const forgotPasswordFields = z.object({
  email: emailField(),
});

export const otpFields = z.object({
  otp: z.coerce.number({ error: "OTP is required" }),
});

/** The reset form asks for the password twice; the token itself travels in the URL. */
export const resetPasswordTokenFields = z
  .object({
    newPassword: passwordField(),
    confirmPassword: z.string().min(1, "Confirm password is required"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords must match",
    path: ["confirmPassword"],
  });

export const loginValidator = z.object({ body: loginFields });
export const forgotPasswordValidator = z.object({ body: forgotPasswordFields });

export type ResetPasswordFormModel = z.infer<typeof resetPasswordTokenFields>;
