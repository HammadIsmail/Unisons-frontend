import { z } from "zod";

export const postOpportunitySchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters"),
  type: z.enum(["job", "internship", "freelance"]),
  description: z.string().min(20, "Description must be at least 20 characters"),
  requirements: z.string().min(10, "Requirements must be at least 10 characters"),
  location: z.string().min(1, "Location is required"),
  is_remote: z.boolean(),
  deadline: z
    .string()
    .min(1, "Deadline is required")
    .refine(
      (date) => new Date(date) > new Date(),
      "Deadline must be a future date"
    ),
  company_name: z.string().min(1, "Company name is required"),
  apply_link: z.string().url("Enter a valid URL for the apply link"),
  required_skills: z
    .array(z.string())
    .min(1, "Add at least one required skill"),
});

export const updateOpportunitySchema = z.object({
  title: z.string().min(5).optional(),
  description: z.string().min(20).optional(),
  apply_link: z.string().url().optional(),
  deadline: z
    .string()
    .refine(
      (date) => new Date(date) > new Date(),
      "Deadline must be a future date"
    )
    .optional(),
  status: z.enum(["open", "closed"]).optional(),
});

export type PostOpportunityInput = z.infer<typeof postOpportunitySchema>;
export type UpdateOpportunityInput = z.infer<typeof updateOpportunitySchema>;