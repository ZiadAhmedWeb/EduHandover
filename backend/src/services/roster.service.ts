import { prisma } from "../lib/prisma.js";
import { ApiError } from "../middleware/error.js";
import { requireSchoolId } from "../middleware/rbac.js";
import type { AuthUser } from "../middleware/auth.js";
import type { CreateClassInput, CreateStudentInput } from "../schemas/roster.schema.js";

export async function listClassesForUser(user: AuthUser) {
  if (user.role === "ADMIN") {
    const schoolId = requireSchoolId(user);
    return prisma.class.findMany({
      where: { schoolId },
      include: {
        teacher: { select: { id: true, firstName: true, lastName: true, email: true } },
        _count: { select: { students: true } },
      },
      orderBy: [{ academicYear: "desc" }, { name: "asc" }],
    });
  }

  return prisma.class.findMany({
    where: { teacherId: user.userId },
    include: {
      teacher: { select: { id: true, firstName: true, lastName: true, email: true } },
      _count: { select: { students: true } },
    },
    orderBy: [{ academicYear: "desc" }, { name: "asc" }],
  });
}

export async function getClassById(user: AuthUser, classId: string) {
  const cls = await prisma.class.findUnique({ where: { id: classId } });
  if (!cls || cls.schoolId !== user.schoolId) {
    throw new ApiError(404, "NOT_FOUND", "Class not found");
  }
  if (user.role === "TEACHER" && cls.teacherId !== user.userId) {
    throw new ApiError(403, "FORBIDDEN", "You are not assigned to this class");
  }
  return cls;
}

export async function listClassStudents(user: AuthUser, classId: string) {
  await getClassById(user, classId);

  const students = await prisma.student.findMany({
    where: { currentClassId: classId },
    include: {
      handoverProfiles: {
        where: { status: "SUBMITTED" },
        orderBy: { academicYear: "desc" },
        take: 1,
        select: { id: true, status: true, isAcknowledged: true, academicYear: true },
      },
    },
    orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
  });

  return students.map(({ handoverProfiles, ...student }) => ({
    ...student,
    handover: handoverProfiles[0] ?? null,
  }));
}

export async function createClass(user: AuthUser, input: CreateClassInput) {
  const schoolId = requireSchoolId(user);
  const teacher = await prisma.user.findUnique({ where: { id: input.teacherId } });
  if (!teacher || teacher.schoolId !== schoolId) {
    throw new ApiError(400, "INVALID_TEACHER", "The teacher does not belong to your school");
  }

  const duplicate = await prisma.class.findUnique({
    where: {
      schoolId_name_academicYear: {
        schoolId,
        name: input.name,
        academicYear: input.academicYear,
      },
    },
  });
  if (duplicate) {
    throw new ApiError(409, "CLASS_EXISTS", "A class with this name already exists for that academic year");
  }

  return prisma.class.create({
    data: {
      name: input.name,
      academicYear: input.academicYear,
      schoolId,
      teacherId: input.teacherId,
    },
    include: { teacher: { select: { id: true, firstName: true, lastName: true, email: true } } },
  });
}

export async function createStudent(user: AuthUser, input: CreateStudentInput) {
  const schoolId = requireSchoolId(user);
  const cls = await prisma.class.findUnique({ where: { id: input.classId } });
  if (!cls || cls.schoolId !== schoolId) {
    throw new ApiError(404, "NOT_FOUND", "Class not found");
  }

  return prisma.student.create({
    data: {
      firstName: input.firstName,
      lastName: input.lastName,
      gradeLevel: input.gradeLevel,
      schoolId,
      currentClassId: cls.id,
    },
    include: { currentClass: { select: { id: true, name: true, academicYear: true } } },
  });
}

export async function getSchoolInfo(user: AuthUser) {
  const schoolId = requireSchoolId(user);
  const school = await prisma.school.findUnique({
    where: { id: schoolId },
    include: {
      _count: { select: { users: true, classes: true, students: true } },
    },
  });
  if (!school) throw new ApiError(404, "NOT_FOUND", "School not found");
  return school;
}

export async function getStudent(user: AuthUser, studentId: string) {
  const student = await prisma.student.findUnique({
    where: { id: studentId },
    include: {
      currentClass: { select: { id: true, name: true, academicYear: true } },
      handoverProfiles: {
        where: { status: "SUBMITTED" },
        orderBy: { academicYear: "desc" },
        take: 1,
        select: { id: true, status: true, isAcknowledged: true, academicYear: true },
      },
    },
  });
  if (!student || student.schoolId !== user.schoolId) {
    throw new ApiError(404, "NOT_FOUND", "Student not found");
  }
  const { handoverProfiles, ...rest } = student;
  return { ...rest, handover: handoverProfiles[0] ?? null };
}

export async function listTeachers(user: AuthUser) {
  const schoolId = requireSchoolId(user);
  return prisma.user.findMany({
    where: { schoolId, role: "TEACHER" },
    select: { id: true, firstName: true, lastName: true, email: true },
    orderBy: { firstName: "asc" },
  });
}

export async function getDashboardStudents(user: AuthUser, tagSlug?: string) {
  const where = { schoolId: requireSchoolId(user) };

  let studentIds = new Set<string>();
  if (user.role === "ADMIN") {
    const all = await prisma.student.findMany({ where, select: { id: true } });
    studentIds = new Set(all.map((s) => s.id));
  } else {
    const ownClassStudents = await prisma.student.findMany({
      where: { ...where, currentClass: { teacherId: user.userId } },
      select: { id: true },
    });
    const received = await prisma.handoverProfile.findMany({
      where: { receiverId: user.userId, status: "SUBMITTED" },
      select: { studentId: true },
    });
    studentIds = new Set([...ownClassStudents.map((s) => s.id), ...received.map((h) => h.studentId)]);
  }

  const ids = [...studentIds];
  if (ids.length === 0) return [];

  const students = await prisma.student.findMany({
    where: { id: { in: ids } },
    include: {
      currentClass: { select: { id: true, name: true, academicYear: true } },
      handoverProfiles: {
        where: { status: "SUBMITTED" },
        orderBy: { academicYear: "desc" },
        include: { receiver: { select: { id: true, firstName: true, lastName: true } } },
      },
    },
    orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
  });

  let result = students.map(({ handoverProfiles, ...student }) => ({
    ...student,
    handover: handoverProfiles[0] ?? null,
  }));

  if (tagSlug) {
    result = result.filter((s) => {
      const h = s.handover;
      return h && [...h.learningStyles, ...h.focusTriggers, ...h.behavioralTags].includes(tagSlug);
    });
  }

  return result;
}
