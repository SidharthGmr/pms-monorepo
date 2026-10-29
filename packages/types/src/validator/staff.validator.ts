import { z } from "zod";
import { optionalNumberField } from "./fields";

/** The employment details an admin edits; the user and store links are set on create. */
export const staffFields = z.object({
  position: z.string().nullable().optional(),
  department: z.string().nullable().optional(),
  hireDate: z.union([z.string(), z.date()]).optional(),
  salary: optionalNumberField("Salary must be a number").refine((value) => value === undefined || value >= 0, "Salary must be >= 0").nullable(),
  isActive: z.boolean().optional(),
});

/**
 * Create also carries the links. These mirror `model staff` in schema.prisma: `userId` is the
 * users table's UUID and the tenant key is `storeCode`, a string - the previous schema asked
 * for numeric `userId`/`storeId`, which Prisma could never accept, so POST /staff always failed.
 */
export const staffValidator = z.object({
  body: staffFields.extend({
    userId: z.string().min(1, "User ID is required"),
    storeCode: z.string().min(1, "Store code is required"),
  }),
});

export const updateStaffValidator = z.object({
  body: staffFields.extend({ storeCode: z.string().min(1).optional() }).partial(),
});
