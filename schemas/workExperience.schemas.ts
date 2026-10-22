import { z } from "zod";

export const addWorkExperienceSchema = z
  .object({
    company_name: z.string().min(1, "Company name is required"),
    role: z.string().min(1, "Role is required"),
    start_date: z.string().min(1, "Start date is required"),
    end_date: z.string().optional(),
    is_current: z.boolean(),
    employment_type: z.enum(["full-time", "part-time", "freelance"]),
  })
  .superRefine((data, ctx) => {
    if (!data.is_current && !data.end_date) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "End date is required when not currently working here",
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

export const updateWorkExperienceSchema = z.object({
  role: z.string().min(1).optional(),
  end_date: z.string().optional(),
  is_current: z.boolean().optional(),
});

export type AddWorkExperienceInput = z.infer<typeof addWorkExperienceSchema>;
export type UpdateWorkExperienceInput = z.infer<typeof updateWorkExperienceSchema>;