import { z } from "zod";

export const leadSchema = z.object({
  fullName: z.string().min(1, "Full name is required").max(120),
  workEmail: z.string().email("A valid work email is required"),
  schoolName: z.string().min(1, "School / district name is required").max(160),
  studentCount: z.enum(["Under 250", "250 - 500", "500 - 1,000", "1,000+"], {
    message: "Please choose a student count range",
  }),
  message: z.string().max(1000, "Message must be 1000 characters or fewer").trim().optional(),
});

export const updateLeadStatusSchema = z.object({
  status: z.enum(["ACCEPTED", "DECLINED"], { message: "Status must be ACCEPTED or DECLINED" }),
});

export type UpdateLeadStatusInput = z.infer<typeof updateLeadStatusSchema>;

export type LeadInput = z.infer<typeof leadSchema>;
