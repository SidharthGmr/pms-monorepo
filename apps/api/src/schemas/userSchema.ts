import { z } from "zod";

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email("Invalid email address."),
    password: z.string().min(1, "Password is required."),
  }),
});

export const signupSchema = z.object({
  body: z.object({
    firstName: z.string().trim().min(1, "First name is required."),
    lastName: z.string().trim().min(1, "Last name is required."),
    email: z.string().email("Invalid email address."),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters.")
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter.")
      .regex(/[a-z]/, "Password must contain at least one lowercase letter.")
      .regex(/[0-9]/, "Password must contain at least one number.")
      .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character."),
    phone: z.string().optional(),
  }),
});

export const refreshTokenSchema = z.object({
  body: z.object({
    token: z.string().min(1, "Refresh token is required."),
  }),
});

export const forgotPasswordSchema = z.object({
  body: z.object({
    email: z.string().email("Invalid email address."),
  }),
});

export const verifyOtpSchema = z.object({
  body: z.object({
    email: z.string().email("Invalid email address.").optional(),
    userId: z.string().optional(),
    otp: z.string().min(4, "OTP is required.").max(8),
  }).refine(data => data.email || data.userId, {
    message: "Either email or userId must be provided",
  }),
});

export const verifyOtpByIdSchema = z.object({
  body: z.object({
    otp: z.string().min(4, "OTP is required.").max(8),
  }),
});

export const verifyEmailTokenSchema = z.object({
  body: z.object({
    token: z.string().min(1, "Token is required."),
  }),
});

export const sendOtpSchema = z.object({
  body: z.object({
    email: z.string().email("Invalid email address."),
  }),
});

export const resetPasswordSchema = z.object({
  body: z
    .object({
      token: z.string().min(1, "Token is required."),
      newPassword: z
        .string()
        .min(8, "Password must be at least 8 characters.")
        .regex(/[A-Z]/, "Password must contain at least one uppercase letter.")
        .regex(/[a-z]/, "Password must contain at least one lowercase letter.")
        .regex(/[0-9]/, "Password must contain at least one number.")
        .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character."),
      confirmPassword: z.string(),
    })
    .refine((data) => data.newPassword === data.confirmPassword, {
      message: "Confirm password does not match.",
      path: ["confirmPassword"],
    }),
});


// Rule for User Creation by Admin
export const createUserByAdminSchema = z.object({
  body: z.object({
    firstName: z.string().min(3, "Name must be at least 3 characters"),
    lastName: z.string().min(3, "Name must be at least 3 characters"),
    email: z.string().email("Invalid email address"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    isRegisteredByShop: z.boolean().optional(),
    phone: z
      .string()
      .min(10, "Phone number must be at least 10 digits")
      .or(z.literal(""))
      .optional(),
    role: z.enum(["SUPER_ADMIN", "ADMIN", "USER", "STAFF"]).or(z.literal("")).optional(),
  }),
});



// // Rule for Update
export const updateSchema = z.object({
  body: z.object({
    firstName: z.string().min(3, "Name must be at least 3 characters"),
    lastName: z.string().min(3, "Name must be at least 3 characters"),
    email: z.string().email("Invalid email address"),
    phone: z.string().min(10).optional(),
    isRegisteredByShop: z.boolean().optional(),
  }),
});

// Rule for Role Update
export const updateRoleSchema = z.object({
  body: z.object({
    role: z.enum(["SUPER_ADMIN", "ADMIN", "USER", "STAFF"], {
      error: "Role must be one of: SUPER_ADMIN, ADMIN, USER, STAFF",
    }),
  }),
});

// Rule for Super Admin Update (role/status by email, userId, or phone)
export const superAdminUpdateRoleSchema = z.object({
  body: z.object({
    email: z.string().email("Invalid email address").optional(),
    userId: z.string().optional(),
    phone: z.string().optional(),
    role: z.enum(["SUPER_ADMIN", "ADMIN", "USER", "STAFF"], {
      error: "Role must be one of: SUPER_ADMIN, ADMIN, USER, STAFF",
    }).optional(),
    status: z.enum(["Published", "Draft", "Trash"], {
      error: "Status must be one of: Published, Draft, Trash",
    }).optional(),
  }).refine(data => data.email || data.userId || data.phone, {
    message: "At least one of email, userId, or phone must be provided",
  }).refine(data => data.role || data.status, {
    message: "At least one of role or status must be provided",
  }),
});

// Rule for Profile Update
export const updateProfileSchema = z.object({
  body: z.object({
    name: z.string().min(3, "Name must be at least 3 characters").optional(),
    phone: z.string().min(10, "Phone number must be at least 10 digits").or(z.literal("")).optional(),
    userName: z.string().optional(),
    profileImageUrl: z.string().url("Invalid URL").or(z.literal("")).optional(),
    dateOfBirth: z.string().or(z.date()).optional(),
    address: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    country: z.string().optional(),
    pincode: z.string().optional(),
    bio: z.string().optional(),
  }),
});
