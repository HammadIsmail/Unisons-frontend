import { z } from "zod";

export const addEducationSchema = z
  .object({
    university: z.string().min(1, "University is required"),
    degree: z.string().min(1, "Degree is required"),
    field_of_study: z.string().optional(),
    start_date: z.string().min(1, "Start date is required"),
    end_date: z.string().optional(),
    is_current: z.boolean(),
  })
  .superRefine((data, ctx) => {
    if (!data.is_current && !data.end_date) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "End date is required when not currently studying here",
        path: ["end_date"],
      });
    }
    if (data.end_date && data.start_date) {
      if (new Date(data.end_date) <= new Date(data.start_date)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "End date must be after start date",
          path: ["end_date"],
        });
      }
    }
  });

export const updateEducationSchema = z.object({
  degree: z.string().min(1).optional(),
  end_date: z.string().optional(),
  is_current: z.boolean().optional(),
});

export type AddEducationInput = z.infer<typeof addEducationSchema>;
export type UpdateEducationInput = z.infer<typeof updateEducationSchema>;
