import { z } from "zod";

// schemas/profile.schemas.ts

const optionalUrl = z
  .string()
  .transform(val => val.trim() === "" ? undefined : val)
  .pipe(
    z.string().url("Enter a valid URL")
      .includes("linkedin.com", { message: "Must be a LinkedIn URL" })
      .optional()
  )
  .optional();

const optionalPhone = z
  .string()
  .transform(val => val.trim() === "" ? undefined : val)
  .pipe(
    z.string()
      .regex(/^\+?[\d\s\-]{10,15}$/, "Enter a valid phone number")
      .optional()
  )
  .optional();

export const updateAlumniProfileSchema = z.object({
  display_name: z.string().min(2, "Name must be at least 2 characters").max(50).optional(),
  bio: z.string().max(300, "Bio must be under 300 characters").optional(),
  phone: optionalPhone,
  linkedin_url: optionalUrl,
});

export const updateStudentProfileSchema = z.object({
  display_name: z.string().min(2, "Name must be at least 2 characters").max(50).optional(),
  bio: z.string().max(300, "Bio must be under 300 characters").optional(),
  phone: optionalPhone,
  semester: z.number().min(1).max(8).optional(),
});

export const updatePartnerProfileSchema = z.object({
  bio: z.string().max(300, "Bio must be under 300 characters").optional(),
  affiliation: z.string().max(100).optional(),
  job_title: z.string().max(100).optional(),
  phone: optionalPhone,
  linkedin_url: optionalUrl,
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