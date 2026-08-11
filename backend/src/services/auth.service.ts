import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { randomBytes } from "node:crypto";
import { env } from "../config/env.js";
import { prisma } from "../lib/prisma.js";
import { ApiError } from "../middleware/error.js";
import type { AuthUser } from "../middleware/auth.js";
import type { LoginInput, InviteTeacherInput, ActivateInput } from "../schemas/auth.schema.js";
import type { User } from "../generated/prisma/client.js";
import { canAcknowledgeHandovers, canCreateHandovers } from "../lib/tenure.js";
import { currentAcademicYear } from "./handover.service.js";

const ACTIVATION_TTL_MS = 72 * 60 * 60 * 1000; // 72 hours

function signToken(user: Pick<User, "id" | "role" | "schoolId">) {
  return jwt.sign(
    { userId: user.id, role: user.role, schoolId: user.schoolId },
    env.JWT_SECRET,
    { expiresIn: "12h" }
  );
}

function serialize(user: User & { school: { id: string; name: string } | null }) {
  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    role: user.role,
    schoolId: user.schoolId,
    joinedAt: user.joinedAt,
    canCreateHandovers: canCreateHandovers(user.role, user.joinedAt),
    canAcknowledgeHandovers: canAcknowledgeHandovers(user.role, user.joinedAt),
    school: user.school,
  };
}

export async function login(input: LoginInput) {
  const user = await prisma.user.findUnique({
    where: { email: input.email.toLowerCase() },
    include: { school: true },
  });
  if (!user) {
    throw new ApiError(401, "INVALID_CREDENTIALS", "Invalid email or password");
  }
  const valid = await bcrypt.compare(input.password, user.passwordHash);
  if (!valid) {
    throw new ApiError(401, "INVALID_CREDENTIALS", "Invalid email or password");
  }
  return { accessToken: signToken(user), user: serialize(user) };
}

export async function getMe(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { school: true },
  });
  if (!user) throw new ApiError(404, "NOT_FOUND", "User not found");
  return serialize(user);
}

export async function inviteTeacher(admin: AuthUser, input: InviteTeacherInput) {
  if (!admin.schoolId) {
    throw new ApiError(403, "FORBIDDEN", "Only school administrators can invite teachers");
  }
  const email = input.email.toLowerCase().trim();
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    throw new ApiError(409, "EMAIL_TAKEN", "An account with this email already exists");
  }

  const activationToken = randomBytes(32).toString("hex");
  const activationTokenExpiresAt = new Date(Date.now() + ACTIVATION_TTL_MS);
  // Placeholder hash so the account can never be logged into before activation.
  const placeholderHash = await bcrypt.hash(randomBytes(24).toString("hex"), 10);

  const user = await prisma.user.create({
    data: {
      email,
      passwordHash: placeholderHash,
      firstName: input.firstName.trim(),
      lastName: input.lastName.trim(),
      role: "TEACHER",
      schoolId: admin.schoolId,
      joinedAt: new Date(),
      activationToken,
      activationTokenExpiresAt,
    },
    select: { id: true, email: true, firstName: true, lastName: true, role: true },
  });

  let classCreated = false;
  if (input.className?.trim()) {
    try {
      await prisma.class.create({
        data: {
          name: input.className.trim(),
          academicYear: currentAcademicYear(),
          schoolId: admin.schoolId,
          teacherId: user.id,
        },
      });
      classCreated = true;
    } catch {
      // Duplicate class (name + year) — already assigned, skip.
    }
  }

  const activationLink = `${env.CORS_ORIGIN}/activate?token=${activationToken}`;
  console.log(`[invite] ${user.email} → ${activationLink}`);

  return { ...user, activationLink, classCreated };
}

export async function activate(input: ActivateInput) {
  const user = await prisma.user.findUnique({
    where: { activationToken: input.token },
    include: { school: true },
  });
  if (!user) {
    throw new ApiError(400, "INVALID_TOKEN", "This activation link is invalid or has already been used");
  }
  if (!user.activationTokenExpiresAt || user.activationTokenExpiresAt < new Date()) {
    throw new ApiError(
      410,
      "TOKEN_EXPIRED",
      "This activation link has expired. Ask your school administrator to send a new invitation."
    );
  }

  const passwordHash = await bcrypt.hash(input.password, 10);
  const updated = await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash, activationToken: null, activationTokenExpiresAt: null },
    include: { school: true },
  });

  return { accessToken: signToken(updated), user: serialize(updated) };
}
