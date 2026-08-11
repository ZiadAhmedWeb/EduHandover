import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client.js";
import { encrypt } from "../src/lib/crypto.js";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

const ADMIN_PASSWORD = "Admin123!";
const TEACHER_PASSWORD = "Teacher123!";
const PLATFORM_PASSWORD = "Platform123!";

const SENIOR_JOINED_AT = new Date("2025-01-15T00:00:00.000Z");

type TagCategory = "LEARNING_STYLE" | "FOCUS_TRIGGER" | "BEHAVIORAL_STRENGTH";

const TAG_DEFS: { slug: string; label: string; category: TagCategory }[] = [
  { slug: "visual", label: "Visual Learner", category: "LEARNING_STYLE" },
  { slug: "auditory", label: "Auditory Learner", category: "LEARNING_STYLE" },
  { slug: "kinesthetic", label: "Kinesthetic / Hands-On", category: "LEARNING_STYLE" },
  { slug: "readingWriting", label: "Reading & Writing", category: "LEARNING_STYLE" },
  { slug: "collaborative", label: "Collaborative / Group", category: "LEARNING_STYLE" },
  { slug: "movementBreaks", label: "Needs Movement Breaks", category: "FOCUS_TRIGGER" },
  { slug: "quietSpace", label: "Prefers Quiet Space", category: "FOCUS_TRIGGER" },
  { slug: "shortTasks", label: "Short Task Chunks", category: "FOCUS_TRIGGER" },
  { slug: "peerSupport", label: "Thrives With Peer Support", category: "FOCUS_TRIGGER" },
  { slug: "visualTimers", label: "Uses Visual Timers", category: "FOCUS_TRIGGER" },
  { slug: "reducedDistraction", label: "Low-Distraction Seating", category: "FOCUS_TRIGGER" },
  { slug: "resilience", label: "Resilience", category: "BEHAVIORAL_STRENGTH" },
  { slug: "curiosity", label: "Curiosity", category: "BEHAVIORAL_STRENGTH" },
  { slug: "empathy", label: "Empathy", category: "BEHAVIORAL_STRENGTH" },
  { slug: "leadership", label: "Leadership", category: "BEHAVIORAL_STRENGTH" },
  { slug: "creativity", label: "Creativity", category: "BEHAVIORAL_STRENGTH" },
  { slug: "teamwork", label: "Teamwork", category: "BEHAVIORAL_STRENGTH" },
  { slug: "communication", label: "Communication", category: "BEHAVIORAL_STRENGTH" },
  { slug: "selfRegulation", label: "Self-Regulation", category: "BEHAVIORAL_STRENGTH" },
  { slug: "problemSolving", label: "Problem Solving", category: "BEHAVIORAL_STRENGTH" },
  { slug: "perseverance", label: "Perseverance", category: "BEHAVIORAL_STRENGTH" },
];

const STUDENT_DEFS = [
  { firstName: "Maya", lastName: "Thompson", gradeLevel: "Year 5" },
  { firstName: "Oliver", lastName: "Reed", gradeLevel: "Year 5" },
  { firstName: "Sofia", lastName: "Martinez", gradeLevel: "Year 5" },
  { firstName: "Noah", lastName: "Kim", gradeLevel: "Year 5" },
  { firstName: "Ava", lastName: "Patel", gradeLevel: "Year 5" },
  { firstName: "Lucas", lastName: "Bennett", gradeLevel: "Year 5" },
  { firstName: "Emma", lastName: "Doyle", gradeLevel: "Year 5" },
];

async function main() {
  console.log("Clearing existing data...");
  await prisma.lead.deleteMany();
  await prisma.acknowledgmentLog.deleteMany();
  await prisma.handoverProfile.deleteMany();
  await prisma.tag.deleteMany();
  await prisma.student.deleteMany();
  await prisma.class.deleteMany();
  await prisma.user.deleteMany();
  await prisma.school.deleteMany();

  console.log("Seeding school...");
  const school = await prisma.school.create({ data: { name: "Maple Grove Academy" } });

  console.log("Seeding users...");
  const admin = await prisma.user.create({
    data: {
      email: "admin@eduhandover.demo",
      passwordHash: await bcrypt.hash(ADMIN_PASSWORD, 10),
      firstName: "Grace",
      lastName: "Lin",
      role: "ADMIN",
      schoolId: school.id,
      joinedAt: SENIOR_JOINED_AT,
    },
  });

  const amy = await prisma.user.create({
    data: {
      email: "amy.harding@eduhandover.demo",
      passwordHash: await bcrypt.hash(TEACHER_PASSWORD, 10),
      firstName: "Amy",
      lastName: "Harding",
      role: "TEACHER",
      schoolId: school.id,
      joinedAt: SENIOR_JOINED_AT,
    },
  });

  const james = await prisma.user.create({
    data: {
      email: "james.chen@eduhandover.demo",
      passwordHash: await bcrypt.hash(TEACHER_PASSWORD, 10),
      firstName: "James",
      lastName: "Chen",
      role: "TEACHER",
      schoolId: school.id,
      joinedAt: SENIOR_JOINED_AT,
    },
  });

  const nina = await prisma.user.create({
    data: {
      email: "nina.alvarado@eduhandover.demo",
      passwordHash: await bcrypt.hash(TEACHER_PASSWORD, 10),
      firstName: "Nina",
      lastName: "Alvarado",
      role: "TEACHER",
      schoolId: school.id,
    },
  });

  const platformAdmin = await prisma.user.create({
    data: {
      email: "platform@eduhandover.demo",
      passwordHash: await bcrypt.hash(PLATFORM_PASSWORD, 10),
      firstName: "Avery",
      lastName: "Morgan",
      role: "PLATFORM_ADMIN",
      schoolId: null,
    },
  });

  console.log("Seeding demo requests (leads)...");
  const daysAgo = (days: number) => new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  await prisma.lead.createMany({
    data: [
      {
        fullName: "Priya Raman",
        workEmail: "priya.raman@lakeside.k12.ca.us",
        schoolName: "Lakeside Elementary",
        studentCount: "500 - 1,000",
        message: "Interested in a walkthrough for our 4th-grade team ahead of the May transition.",
        status: "PENDING",
        createdAt: daysAgo(1),
      },
      {
        fullName: "Marcus Webb",
        workEmail: "m.webb@harborview.school.nz",
        schoolName: "Harborview School",
        studentCount: "250 - 500",
        message: "We'd like to see how handovers work across classes.",
        status: "PENDING",
        createdAt: daysAgo(3),
      },
      {
        fullName: "Chloe Dubois",
        workEmail: "chloe.dubois@colline-ecole.fr",
        schoolName: "Colline Academy",
        studentCount: "Under 250",
        status: "ACCEPTED",
        handledById: platformAdmin.id,
        handledAt: daysAgo(2),
        createdAt: daysAgo(5),
      },
    ],
  });

  console.log("Seeding classes...");
  const year5 = await prisma.class.create({
    data: { name: "Year 5 Alpha", academicYear: "2026-2027", schoolId: school.id, teacherId: amy.id },
  });
  const year6 = await prisma.class.create({
    data: { name: "Year 6 Alpha", academicYear: "2027-2028", schoolId: school.id, teacherId: nina.id },
  });
  const year6Beta = await prisma.class.create({
    data: { name: "Year 6 Beta", academicYear: "2027-2028", schoolId: school.id, teacherId: james.id },
  });

  console.log("Seeding tags...");
  for (const tag of TAG_DEFS) {
    await prisma.tag.create({ data: tag });
  }

  console.log("Seeding students...");
  const students: Record<string, Awaited<ReturnType<typeof prisma.student.create>>> = {};
  for (const def of STUDENT_DEFS) {
    const student = await prisma.student.create({
      data: { ...def, schoolId: school.id, currentClassId: year5.id },
    });
    students[def.firstName] = student;
  }

  console.log("Seeding handovers...");
  const now = new Date();

  await prisma.handoverProfile.create({
    data: {
      studentId: students["Maya"]!.id,
      creatorId: amy.id,
      receiverId: nina.id,
      academicYear: "2026-2027",
      learningStyles: ["visual", "readingWriting"],
      focusTriggers: ["movementBreaks", "shortTasks"],
      behavioralTags: ["resilience", "curiosity"],
      notesEncrypted: encrypt(
        "Maya works best with short written instructions broken into steps. She responds really well to a visual timer during independent work. Please seat her near the front of the room — she has asked for a 'quiet zone' when the class gets loud."
      ),
      status: "SUBMITTED",
      isAcknowledged: false,
      submittedAt: now,
    },
  });

  const acknowledgedAt = new Date(now.getTime() - 1000 * 60 * 60 * 24 * 2);
  await prisma.handoverProfile.create({
    data: {
      studentId: students["Oliver"]!.id,
      creatorId: amy.id,
      receiverId: nina.id,
      academicYear: "2026-2027",
      learningStyles: ["kinesthetic", "collaborative"],
      focusTriggers: ["peerSupport", "movementBreaks"],
      behavioralTags: ["teamwork", "leadership"],
      notesEncrypted: encrypt(
        "Oliver shines when he can move and work with a partner. He often volunteers to lead small groups. Give him a 'movement break' card he can use twice a day without asking."
      ),
      status: "SUBMITTED",
      isAcknowledged: true,
      acknowledgedAt,
      submittedAt: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 4),
    },
  });

  await prisma.acknowledgmentLog.create({
    data: { handoverId: (await prisma.handoverProfile.findFirst({ where: { studentId: students["Oliver"]!.id } }))!.id, teacherId: nina.id, acknowledgedAt },
  });

  await prisma.handoverProfile.create({
    data: {
      studentId: students["Sofia"]!.id,
      creatorId: amy.id,
      receiverId: nina.id,
      academicYear: "2026-2027",
      learningStyles: ["auditory", "visual"],
      focusTriggers: ["quietSpace", "visualTimers"],
      behavioralTags: ["empathy", "communication"],
      notesEncrypted: encrypt(
        "Sofia is wonderfully empathetic and often supports peers who are struggling. She concentrates best in a quieter spot with a visual schedule. Check in with her after transitions."
      ),
      status: "SUBMITTED",
      isAcknowledged: false,
      submittedAt: now,
    },
  });

  console.log("Seed complete.");
  console.log("Demo accounts:");
  console.log(`  Platform admin: platform@eduhandover.demo / ${PLATFORM_PASSWORD}`);
  console.log(`  Admin      : admin@eduhandover.demo / ${ADMIN_PASSWORD}`);
  console.log(`  Teacher    : amy.harding@eduhandover.demo / ${TEACHER_PASSWORD}    (senior — creates handovers)`);
  console.log(`  Teacher    : james.chen@eduhandover.demo / ${TEACHER_PASSWORD}    (senior)`);
  console.log(`  New teacher: nina.alvarado@eduhandover.demo / ${TEACHER_PASSWORD} (under 6 months — acknowledges)`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
