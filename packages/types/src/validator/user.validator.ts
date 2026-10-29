import { z } from "zod";
import { Roles } from "../enum/role.enum";
import { emailField, passwordField, personNameField, phoneField } from "./fields";

/** Public sign-up. The password rule matches the API's byte for byte. */
export const signupFields = z.object({
  firstName: personNameField(),
  lastName: personNameField(),
  email: emailField(),
  password: passwordField(),
  phone: phoneField(true),
  isRegisteredByShop: z.boolean().optional(),
  role: z.nativeEnum(Roles).optional(),
});

/**
 * Admin "add user". Deliberately looser than sign-up: a shop creating an account on a
 * customer's behalf sets a provisional password the customer resets later.
 */
export const createUserByAdminFields = z.object({
  firstName: z.string().trim().min(3, "Name must be at least 3 characters"),
  lastName: z.string().trim().min(3, "Name must be at least 3 characters"),
  email: emailField("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  isRegisteredByShop: z.boolean().optional(),
  phone: phoneField(false),
  role: z.nativeEnum(Roles).optional(),
});

export const signupValidator = z.object({ body: signupFields });
export const createUserByAdminValidator = z.object({ body: createUserByAdminFields });
