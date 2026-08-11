import { z } from "zod";

export const createClassSchema = z.object({
  name: z.string().min(1, "Class name is required").max(120),
  academicYear: z
    .string()
    .regex(/^\d{4}-\d{4}$/, "academicYear must look like 2025-2026"),
  teacherId: z.string().uuid("A teacher id is required"),
});

export const createStudentSchema = z.object({
  firstName: z.string().min(1, "First name is required").max(60),
  lastName: z.string().min(1, "Last name is required").max(60),
  gradeLevel: z.string().min(1, "Grade level is required").max(40),
  classId: z.string().uuid("A class id is required"),
});

export type CreateClassInput = z.infer<typeof createClassSchema>;
export type CreateStudentInput = z.infer<typeof createStudentSchema>;
