import { z } from "zod";
 
export const CreateSchoolSchema = z.object({
  body: z.object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    code: z.string().min(1, "Code is required").optional(),
    address: z.string().min(1, "Address is required").optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    country: z.string().optional(),
    phone: z.string().min(10, "Phone number must be at least 10 characters"), // adjust as needed
    email: z.string().email("Invalid email format"),
    logoUrl: z.string().url("Invalid URL").optional(),
    status: z.coerce.boolean(),
    isActive: z.coerce.boolean(),
  }),
});

export const UpdateSchoolSchema = z.object({
   body: z.object({
     name: z.string().min(2).optional(),
     code: z.string().optional(),
     address: z.string().optional().nullable(),
   }),
});