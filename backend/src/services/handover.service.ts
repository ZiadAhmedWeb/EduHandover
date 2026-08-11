import { prisma } from "../lib/prisma.js";
import { encrypt, decrypt } from "../lib/crypto.js";
import { ApiError } from "../middleware/error.js";
import { requireSchoolId } from "../middleware/rbac.js";
import type { AuthUser } from "../middleware/auth.js";
import type {
  CreateHandoverInput,
  UpdateHandoverInput,
} from "../schemas/handover.schema.js";
import type { TagCategory } from "../generated/prisma/enums.js";
import { HANDOVER_ACCESS_MONTHS, joinedBefore } from "../lib/tenure.js";

async function getJoinedAt(user: AuthUser): Promise<Date | null> {
  const u = await prisma.user.findUnique({ where: { id: user.userId }, select: { joinedAt: true } });
  return u?.joinedAt ?? null;
}

async function assertCanCreateHandovers(user: AuthUser) {
  if (user.role === "ADMIN") return;
  const joinedAt = await getJoinedAt(user);
  if (!joinedAt || !joinedBefore(joinedAt, HANDOVER_ACCESS_MONTHS)) {
    throw new ApiError(
      403,
      "HANDOVER_LOCKED",
      "Handover access unlocks after 6 months at your school"
    );
  }
}

async function assertCanAcknowledge(user: AuthUser) {
  if (user.role === "ADMIN") return;
  const joinedAt = await getJoinedAt(user);
  if (joinedAt && joinedBefore(joinedAt, HANDOVER_ACCESS_MONTHS)) {
    throw new ApiError(
      403,
      "ACKNOWLEDGE_LOCKED",
      "Only teachers within their first 6 months at the school can acknowledge handovers"
    );
  }
}

export function currentAcademicYear(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const start = month >= 7 ? year : year - 1;
  return `${start}-${start + 1}`;
}

export function nextAcademicYear(academicYear: string): string {
  const start = Number(academicYear.split("-")[0]);
  if (Number.isNaN(start)) throw new ApiError(400, "INVALID_ACADEMIC_YEAR", "Invalid academic year");
  return `${start + 1}-${start + 2}`;
}

async function validateTags(slugs: string[], category: TagCategory) {
  if (slugs.length === 0) return;
  const tags = await prisma.tag.findMany({ where: { slug: { in: slugs }, isActive: true } });
  const found = new Set(tags.map((t) => t.slug));

  const unknown = slugs.filter((s) => !found.has(s));
  if (unknown.length > 0) {
    throw new ApiError(400, "INVALID_TAG", `Unknown or inactive tag: ${unknown.join(", ")}`);
  }

  const wrongCategory = tags.filter((t) => t.category !== category);
  if (wrongCategory.length > 0) {
    throw new ApiError(
      400,
      "WRONG_TAG_CATEGORY",
      `Tags do not belong to category ${category}: ${wrongCategory.map((t) => t.slug).join(", ")}`
    );
  }
}

async function deriveReceiver(schoolId: string, academicYear: string, creatorId: string) {
  const nextYearClass = await prisma.class.findFirst({
    where: { schoolId, academicYear: nextAcademicYear(academicYear), teacherId: { not: creatorId } },
    orderBy: { name: "asc" },
  });
  return nextYearClass?.teacherId ?? null;
}

const profileInclude = {
  student: {
    select: {
      id: true,
      firstName: true,
      lastName: true,
      gradeLevel: true,
      schoolId: true,
      currentClass: { select: { id: true, name: true, academicYear: true } },
    },
  },
  creator: { select: { id: true, firstName: true, lastName: true, email: true } },
  receiver: { select: { id: true, firstName: true, lastName: true, email: true } },
  acknowledgments: { orderBy: { acknowledgedAt: "desc" }, take: 5 },
} as const;

type HandoverWithRelations = NonNullable<Awaited<ReturnType<typeof fetchProfile>>>;

function decorate(profile: HandoverWithRelations) {
  const { notesEncrypted, ...rest } = profile;
  return {
    ...rest,
    notes: notesEncrypted ? decrypt(notesEncrypted) : null,
  };
}

function fetchProfile(handoverId: string) {
  return prisma.handoverProfile.findUnique({
    where: { id: handoverId },
    include: profileInclude,
  });
}

function assertCanView(user: AuthUser, profile: HandoverWithRelations) {
  const isAdmin = user.role === "ADMIN";
  const isCreator = profile.creatorId === user.userId;
  const isReceiver = profile.receiverId === user.userId;
  const sameSchool = profile.student.schoolId === user.schoolId;
  if (!sameSchool) throw new ApiError(404, "NOT_FOUND", "Handover profile not found");
  if (!(isAdmin || isCreator || isReceiver)) {
    throw new ApiError(403, "FORBIDDEN", "You are not involved in this handover");
  }
}

export async function createHandover(user: AuthUser, input: CreateHandoverInput) {
  await assertCanCreateHandovers(user);

  const student = await prisma.student.findUnique({ where: { id: input.studentId } });
  if (!student || student.schoolId !== user.schoolId) {
    throw new ApiError(404, "NOT_FOUND", "Student not found");
  }

  await validateTags(input.learningStyles, "LEARNING_STYLE");
  await validateTags(input.focusTriggers, "FOCUS_TRIGGER");
  await validateTags(input.behavioralTags, "BEHAVIORAL_STRENGTH");

  const notesEncrypted = input.notes ? encrypt(input.notes) : null;
  const isSubmitted = input.status === "SUBMITTED";
  const receiverId = isSubmitted
    ? await deriveReceiver(requireSchoolId(user), input.academicYear, user.userId)
    : null;

  const profile = await prisma.handoverProfile.create({
    data: {
      studentId: input.studentId,
      creatorId: user.userId,
      receiverId,
      academicYear: input.academicYear,
      learningStyles: input.learningStyles,
      focusTriggers: input.focusTriggers,
      behavioralTags: input.behavioralTags,
      notesEncrypted,
      status: input.status,
      submittedAt: isSubmitted ? new Date() : null,
    },
    include: profileInclude,
  });

  return decorate(profile);
}

export async function getMyHandoverForStudent(user: AuthUser, studentId: string) {
  const student = await prisma.student.findUnique({ where: { id: studentId } });
  if (!student || student.schoolId !== user.schoolId) {
    throw new ApiError(404, "NOT_FOUND", "Student not found");
  }

  const profile = await prisma.handoverProfile.findFirst({
    where: { studentId, creatorId: user.userId },
    orderBy: { updatedAt: "desc" },
    include: profileInclude,
  });

  if (!profile) return null;
  assertCanView(user, profile);
  return decorate(profile);
}

export async function getActiveHandoverForStudent(user: AuthUser, studentId: string) {
  const student = await prisma.student.findUnique({ where: { id: studentId } });
  if (!student || student.schoolId !== user.schoolId) {
    throw new ApiError(404, "NOT_FOUND", "Student not found");
  }

  const profile = await prisma.handoverProfile.findFirst({
    where: { studentId, status: "SUBMITTED" },
    orderBy: { academicYear: "desc" },
    include: profileInclude,
  });

  if (!profile) {
    throw new ApiError(404, "NOT_FOUND", "No active handover profile for this student");
  }

  assertCanView(user, profile);
  return decorate(profile);
}

export async function getHandover(user: AuthUser, handoverId: string) {
  const profile = await fetchProfile(handoverId);
  if (!profile) throw new ApiError(404, "NOT_FOUND", "Handover profile not found");
  assertCanView(user, profile);
  return decorate(profile);
}

export async function updateHandover(user: AuthUser, handoverId: string, input: UpdateHandoverInput) {
  await assertCanCreateHandovers(user);

  const profile = await fetchProfile(handoverId);
  if (!profile) throw new ApiError(404, "NOT_FOUND", "Handover profile not found");
  if (profile.creatorId !== user.userId) {
    throw new ApiError(403, "FORBIDDEN", "Only the creator can edit this handover");
  }
  if (profile.status !== "DRAFT") {
    throw new ApiError(400, "NOT_EDITABLE", "Only draft handovers can be edited");
  }

  if (input.learningStyles) await validateTags(input.learningStyles, "LEARNING_STYLE");
  if (input.focusTriggers) await validateTags(input.focusTriggers, "FOCUS_TRIGGER");
  if (input.behavioralTags) await validateTags(input.behavioralTags, "BEHAVIORAL_STRENGTH");

  const becomingSubmitted = input.status === "SUBMITTED" && profile.status === "DRAFT";
  const receiverId = becomingSubmitted
    ? profile.receiverId ?? (await deriveReceiver(requireSchoolId(user), input.academicYear ?? profile.academicYear, user.userId))
    : profile.receiverId;

  const updated = await prisma.handoverProfile.update({
    where: { id: handoverId },
    data: {
      ...(input.learningStyles ? { learningStyles: input.learningStyles } : {}),
      ...(input.focusTriggers ? { focusTriggers: input.focusTriggers } : {}),
      ...(input.behavioralTags ? { behavioralTags: input.behavioralTags } : {}),
      ...(input.notes !== undefined ? { notesEncrypted: input.notes ? encrypt(input.notes) : null } : {}),
      ...(input.academicYear ? { academicYear: input.academicYear } : {}),
      ...(becomingSubmitted ? { status: "SUBMITTED", submittedAt: new Date(), receiverId } : {}),
    },
    include: profileInclude,
  });

  return decorate(updated);
}

export async function acknowledge(user: AuthUser, handoverId: string) {
  const profile = await fetchProfile(handoverId);
  if (!profile) throw new ApiError(404, "NOT_FOUND", "Handover profile not found");

  const isAdmin = user.role === "ADMIN" && profile.student.schoolId === user.schoolId;
  const isReceiver = profile.receiverId === user.userId;
  if (!(isAdmin || isReceiver)) {
    throw new ApiError(403, "FORBIDDEN", "Only the receiving teacher can acknowledge this handover");
  }
  if (!isAdmin && isReceiver) {
    await assertCanAcknowledge(user);
  }
  if (profile.status !== "SUBMITTED") {
    throw new ApiError(400, "NOT_ACKNOWLEDGEABLE", "Only submitted handovers can be acknowledged");
  }
  if (profile.isAcknowledged) {
    throw new ApiError(409, "ALREADY_ACKNOWLEDGED", "This handover has already been acknowledged");
  }

  const now = new Date();
  await prisma.$transaction([
    prisma.handoverProfile.update({
      where: { id: handoverId },
      data: { isAcknowledged: true, acknowledgedAt: now },
    }),
    prisma.acknowledgmentLog.create({
      data: { handoverId, teacherId: user.userId, acknowledgedAt: now },
    }),
  ]);

  return decorate((await fetchProfile(handoverId))!);
}

export async function listTagsGrouped() {
  const tags = await prisma.tag.findMany({
    where: { isActive: true },
    orderBy: { label: "asc" },
  });

  return {
    learningStyles: tags
      .filter((t) => t.category === "LEARNING_STYLE")
      .map((t) => ({ slug: t.slug, label: t.label })),
    focusTriggers: tags
      .filter((t) => t.category === "FOCUS_TRIGGER")
      .map((t) => ({ slug: t.slug, label: t.label })),
    behavioralStrengths: tags
      .filter((t) => t.category === "BEHAVIORAL_STRENGTH")
      .map((t) => ({ slug: t.slug, label: t.label })),
  };
}
