import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("A valid email is required"),
  password: z.string().min(1, "Password is required"),
});

export const inviteTeacherSchema = z.object({
  firstName: z.string().min(1, "First name is required").max(60),
  lastName: z.string().min(1, "Last name is required").max(60),
  email: z.string().email("A valid email is required"),
  className: z.string().max(120).trim().optional(),
});

export const activateSchema = z.object({
  token: z.string().min(1, "Activation token is required"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type InviteTeacherInput = z.infer<typeof inviteTeacherSchema>;
export type ActivateInput = z.infer<typeof activateSchema>;
