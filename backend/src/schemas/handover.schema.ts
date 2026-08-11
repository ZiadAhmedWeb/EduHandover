import { z } from "zod";

const tagSlugList = z.array(z.string().min(1)).max(5, "Select at most 5 tags per category");

export const createHandoverSchema = z.object({
  studentId: z.string().uuid("A student id is required"),
  academicYear: z.string().regex(/^\d{4}-\d{4}$/, "academicYear must look like 2025-2026"),
  learningStyles: tagSlugList.default([]),
  focusTriggers: tagSlugList.default([]),
  behavioralTags: tagSlugList.default([]),
  notes: z.string().max(500, "Notes must be 500 characters or fewer").trim().optional(),
  status: z.enum(["DRAFT", "SUBMITTED"]).default("SUBMITTED"),
});

export const updateHandoverSchema = createHandoverSchema.partial();

export type CreateHandoverInput = z.infer<typeof createHandoverSchema>;
export type UpdateHandoverInput = z.infer<typeof updateHandoverSchema>;
