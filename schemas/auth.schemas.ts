import { z } from "zod";

export const sendOTPSchema = z.object({
  email: z.string().min(1, "Email is required").email("Enter a valid email"),
});

export const verifyOTPSchema = z.object({
  otp: z
    .string()
    .length(6, "OTP must be 6 digits")
    .regex(/^\d+$/, "OTP must contain numbers only"),
});

export const registerSchema = z
  .object({
    username: z
      .string()
      .min(3, "Username must be at least 3 characters")
      .max(20, "Username must be under 20 characters")
      .regex(/^[a-z0-9_]+$/, "Lowercase letters, numbers, and underscores only"),
    display_name: z.string().min(2, "Display name must be at least 2 characters"),
    email: z.string().email("Enter a valid email"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Must contain at least one uppercase letter")
      .regex(/[0-9]/, "Must contain at least one number")
      .regex(/[^A-Za-z0-9]/, "Must contain at least one special character"),
    role: z.enum(["alumni", "student"]),
    roll_number: z.string().min(1, "Roll number is required"),
    degree: z.string().min(1, "Degree is required"),
    graduation_year: z.number().optional(),
    semester: z.number().min(1).max(8).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.role === "alumni" && !data.graduation_year) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Graduation year is required for alumni",
        path: ["graduation_year"],
      });
    }
    if (data.role === "student" && !data.semester) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Semester is required for students",
        path: ["semester"],
      });
    }
  });

export const loginSchema = z.object({
  email: z.string().min(1, "Email is required").email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
});

export const resetPasswordSchema = z
  .object({
    new_password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Must contain at least one uppercase letter")
      .regex(/[0-9]/, "Must contain at least one number")
      .regex(/[^A-Za-z0-9]/, "Must contain at least one special character"),
    confirm_password: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.new_password === data.confirm_password, {
    message: "Passwords do not match",
    path: ["confirm_password"],
  });

export type SendOTPInput = z.infer<typeof sendOTPSchema>;
export type VerifyOTPInput = z.infer<typeof verifyOTPSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;