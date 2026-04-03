import { z } from "zod";

export const updateAlumniProfileSchema = z.object({
  display_name: z.string().min(2, "Name must be at least 2 characters").max(50).optional(),
  bio: z.string().max(300, "Bio must be under 300 characters").optional(),
  phone: z
    .string()
    .regex(/^\+?[\d\s\-]{10,15}$/, "Enter a valid phone number")
    .optional(),
  linkedin_url: z
    .string()
    .url("Enter a valid LinkedIn URL")
    .includes("linkedin.com", { message: "Must be a LinkedIn URL" })
    .optional()
    .or(z.literal("")),
});

export const updateStudentProfileSchema = z.object({
  display_name: z.string().min(2, "Name must be at least 2 characters").max(50).optional(),
  bio: z.string().max(300, "Bio must be under 300 characters").optional(),
  phone: z
    .string()
    .regex(/^\+?[\d\s\-]{10,15}$/, "Enter a valid phone number")
    .optional(),
});

export const addSkillSchema = z.object({
  skill_name: z.string().min(1, "Skill name is required"),
  category: z.string().min(1, "Category is required"),
  proficiency_level: z.enum(["beginner", "intermediate", "expert"]),
  years_experience: z.number().min(0).max(50).optional(),
});

export type UpdateAlumniProfileInput = z.infer<typeof updateAlumniProfileSchema>;
export type UpdateStudentProfileInput = z.infer<typeof updateStudentProfileSchema>;
export type AddSkillInput = z.infer<typeof addSkillSchema>;