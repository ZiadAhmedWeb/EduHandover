import { prisma } from "../lib/prisma.js";
import { ApiError } from "../middleware/error.js";
import type { AuthUser } from "../middleware/auth.js";
import type { LeadInput, UpdateLeadStatusInput } from "../schemas/lead.schema.js";

export async function createLead(input: LeadInput) {
  return prisma.lead.create({
    data: {
      fullName: input.fullName.trim(),
      workEmail: input.workEmail.toLowerCase().trim(),
      schoolName: input.schoolName.trim(),
      studentCount: input.studentCount,
      message: input.message?.trim() ?? null,
    },
  });
}

export async function listLeads() {
  return prisma.lead.findMany({
    orderBy: [{ createdAt: "desc" }],
    include: { handledBy: { select: { id: true, firstName: true, lastName: true, email: true } } },
  });
}

export async function updateLeadStatus(_user: AuthUser, id: string, input: UpdateLeadStatusInput) {
  const lead = await prisma.lead.findUnique({ where: { id } });
  if (!lead) {
    throw new ApiError(404, "NOT_FOUND", "Demo request not found");
  }
  if (lead.status !== "PENDING") {
    throw new ApiError(409, "LEAD_ALREADY_HANDLED", "This demo request has already been handled");
  }
  return prisma.lead.update({
    where: { id },
    data: {
      status: input.status,
      handledById: _user.userId,
      handledAt: new Date(),
    },
    include: { handledBy: { select: { id: true, firstName: true, lastName: true, email: true } } },
  });
}
