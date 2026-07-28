import { Status } from "@prisma/client";
import { z } from "zod";

// `code` is the stable key other features select by, so it is constrained to an
// uppercase snake token rather than free text.
const codeSchema = z
    .string()
    .min(1, "Code is required")
    .max(50)
    .regex(/^[A-Z][A-Z0-9_]*$/, "Code must be uppercase letters, numbers and underscores (e.g. SIZE, SHOE_SIZE)");

export const createMasterAttributeSchema = z.object({
    body: z.object({
        name: z.string().min(1, "Name is required").max(100),
        code: codeSchema,
        description: z.string().max(500).optional().nullable(),
        unit: z.string().max(20).optional().nullable(),
        status: z.nativeEnum(Status).optional(),
        displayOrder: z.number().int().optional().nullable(),
    }),
});

export const updateMasterAttributeSchema = z.object({
    body: z.object({
        name: z.string().min(1).max(100).optional(),
        code: codeSchema.optional(),
        description: z.string().max(500).optional().nullable(),
        unit: z.string().max(20).optional().nullable(),
        status: z.nativeEnum(Status).optional(),
        displayOrder: z.number().int().optional().nullable(),
    }),
});

export const createMasterEntrySchema = z.object({
    body: z.object({
        attributeId: z.number().int().positive("attributeId is required"),
        name: z.string().min(1, "Name is required").max(100),
        value: z.string().min(1, "Value is required").max(100),
        colorHex: z
            .string()
            .regex(/^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/, "Use a hex colour like #FF0000")
            .optional()
            .nullable(),
        metadata: z.record(z.string(), z.unknown()).optional().nullable(),
        status: z.nativeEnum(Status).optional(),
        displayOrder: z.number().int().optional().nullable(),
    }),
});

export const updateMasterEntrySchema = z.object({
    body: z.object({
        attributeId: z.number().int().positive().optional(),
        name: z.string().min(1).max(100).optional(),
        value: z.string().min(1).max(100).optional(),
        colorHex: z
            .string()
            .regex(/^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/, "Use a hex colour like #FF0000")
            .optional()
            .nullable(),
        metadata: z.record(z.string(), z.unknown()).optional().nullable(),
        status: z.nativeEnum(Status).optional(),
        displayOrder: z.number().int().optional().nullable(),
    }),
});
