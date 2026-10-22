import { z } from "zod";

export const createEventSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters"),
  description: z.string().min(20, "Description must be at least 20 characters"),
  type: z.enum(["reunion", "webinar", "workshop", "networking", "other"] as const, {
    message: "Please select an event type",
  }),
  date: z
    .string()
    .min(1, "Date is required")
    .refine((d) => new Date(d) > new Date(), "Date must be in the future"),
  is_online: z.boolean(),
  location: z.string().optional(),
  meeting_link: z
    .string()
    .url("Enter a valid URL")
    .optional()
    .or(z.literal("")),
  max_attendees: z.number().positive("Must be greater than 0").optional(),
});

export const updateEventSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters").optional(),
  description: z
    .string()
    .min(20, "Description must be at least 20 characters")
    .optional(),
  type: z
    .enum(["reunion", "webinar", "workshop", "networking", "other"] as const)
    .optional(),
  date: z
    .string()
    .refine((d) => new Date(d) > new Date(), "Date must be in the future")
    .optional(),
  is_online: z.boolean().optional(),
  location: z.string().optional(),
  meeting_link: z
    .string()
    .url("Enter a valid URL")
    .optional()
    .or(z.literal("")),
  max_attendees: z.number().positive("Must be greater than 0").optional(),
});

export type CreateEventInput = z.infer<typeof createEventSchema>;
export type UpdateEventInput = z.infer<typeof updateEventSchema>;
