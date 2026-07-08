import { z } from "zod";

export const CreateFeeHeadSchema = z.object({
  body: z.object({
    schoolId: z.string().min(1, "schoolId is required"),
    name: z.string().min(1, "name is required"),
    isActive: z.boolean().optional(),
    metadata: z.any().optional(),
  }),
}); 

export const UpdateFeeHeadSchema = z.object({
  body: z.object({
    name: z.string().optional(),
    isActive: z.boolean().optional(),
    metadata: z.any().optional(),
  }),
});

export const FeeHeadParamsSchema = z.object({
  params: z.object({ feeHeadId: z.string().min(1, "feeHeadId is required") }),
});
