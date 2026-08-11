import { test, after } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import { prisma } from "../src/lib/prisma.js";
import { app, login } from "./helpers.js";

async function getDashboard(token: string) {
  const res = await request(app).get("/api/v1/dashboard/students").set("Authorization", `Bearer ${token}`);
  assert.equal(res.status, 200);
  return res.body.data as Array<{ id: string; firstName: string; lastName: string; handover: unknown }>;
}

let createdHandoverId: string | null = null;
let extraEmail: string | null = null;

after(async () => {
  if (createdHandoverId) {
    await prisma.acknowledgmentLog.deleteMany({ where: { handoverId: createdHandoverId } });
    await prisma.handoverProfile.deleteMany({ where: { id: createdHandoverId } });
  }
  if (extraEmail) {
    await prisma.user.deleteMany({ where: { email: extraEmail } });
  }
});

test("senior teacher creates a draft, edits, submits; new teacher acknowledges", async () => {
  const amyToken = await login("amy.harding@eduhandover.demo", "Teacher123!");
  const ninaToken = await login("nina.alvarado@eduhandover.demo", "Teacher123!");

  const students = await getDashboard(amyToken);
  const ava = students.find((s) => s.firstName === "Ava");
  assert.ok(ava, "expected Ava in Amy's roster");
  assert.equal(ava.handover, null, "Ava should start without a handover");

  const draft = await request(app)
    .post("/api/v1/handovers")
    .set("Authorization", `Bearer ${amyToken}`)
    .send({
      studentId: ava.id,
      academicYear: "2026-2027",
      learningStyles: ["visual"],
      focusTriggers: ["quietSpace"],
      behavioralTags: ["creativity"],
      notes: "Secret classroom note.",
      status: "DRAFT",
    });
  assert.equal(draft.status, 201);
  createdHandoverId = draft.body.data.id as string;
  assert.equal(draft.body.data.status, "DRAFT");
  assert.equal(draft.body.data.notes, "Secret classroom note.");

  const raw = await prisma.handoverProfile.findUnique({ where: { id: createdHandoverId } });
  assert.ok(raw?.notesEncrypted, "notes must be stored encrypted");
  assert.notEqual(raw.notesEncrypted, "Secret classroom note.");

  const bad = await request(app)
    .post("/api/v1/handovers")
    .set("Authorization", `Bearer ${amyToken}`)
    .send({
      studentId: ava.id,
      academicYear: "2026-2027",
      learningStyles: ["not-a-real-tag"],
      status: "DRAFT",
    });
  assert.equal(bad.status, 400, "invalid tag slugs must be rejected");

  const submitted = await request(app)
    .put(`/api/v1/handovers/${createdHandoverId}`)
    .set("Authorization", `Bearer ${amyToken}`)
    .send({ status: "SUBMITTED", behavioralTags: ["creativity", "communication"] });
  assert.equal(submitted.status, 200);
  assert.equal(submitted.body.data.status, "SUBMITTED");
  assert.ok(submitted.body.data.receiverId, "receiver should be derived on submit");

  const editedAfterSubmit = await request(app)
    .put(`/api/v1/handovers/${createdHandoverId}`)
    .set("Authorization", `Bearer ${amyToken}`)
    .send({ notes: "should fail" });
  assert.equal(editedAfterSubmit.status, 400, "submitted handovers are not editable");

  const view = await request(app)
    .get(`/api/v1/handovers/student/${ava.id}`)
    .set("Authorization", `Bearer ${ninaToken}`);
  assert.equal(view.status, 200);
  assert.equal(view.body.data.notes, "Secret classroom note.", "reviewing teacher sees decrypted notes");

  const ack = await request(app)
    .post(`/api/v1/handovers/${createdHandoverId}/acknowledge`)
    .set("Authorization", `Bearer ${ninaToken}`);
  assert.equal(ack.status, 200);
  assert.equal(ack.body.data.isAcknowledged, true);

  const ackLog = await prisma.acknowledgmentLog.findFirst({ where: { handoverId: createdHandoverId! } });
  assert.ok(ackLog, "acknowledgment must be logged");

  const doubleAck = await request(app)
    .post(`/api/v1/handovers/${createdHandoverId}/acknowledge`)
    .set("Authorization", `Bearer ${ninaToken}`);
  assert.equal(doubleAck.status, 409);
});

test("teacher with less than 6 months cannot create handovers", async () => {
  const school = await prisma.school.findFirst({ where: { name: "Maple Grove Academy" } });
  assert.ok(school);

  const adminToken = await login("admin@eduhandover.demo", "Admin123!");
  extraEmail = `new-${Date.now()}@test.local`;
  const invite = await request(app)
    .post("/api/v1/admin/teachers/invite")
    .set("Authorization", `Bearer ${adminToken}`)
    .send({ firstName: "New", lastName: "Teacher", email: extraEmail });
  assert.equal(invite.status, 201);
  const inviteToken = invite.body.data.activationLink.split("token=")[1] as string;

  const act = await request(app).post("/api/v1/auth/activate").send({
    token: inviteToken,
    password: "Password123!",
  });
  assert.equal(act.status, 200);
  assert.equal(act.body.data.user.canCreateHandovers, false);
  assert.equal(act.body.data.user.canAcknowledgeHandovers, true);

  const token = act.body.data.accessToken as string;
  const student = await prisma.student.findFirst({ where: { schoolId: school.id } });
  assert.ok(student, "expected a student in the school");

  const res = await request(app)
    .post("/api/v1/handovers")
    .set("Authorization", `Bearer ${token}`)
    .send({
      studentId: student.id,
      academicYear: "2026-2027",
      learningStyles: ["visual"],
      status: "DRAFT",
    });
  assert.equal(res.status, 403);
  assert.equal(res.body.error.code, "HANDOVER_LOCKED");
});

test("senior teacher cannot acknowledge even as receiver", async () => {
  const amyToken = await login("amy.harding@eduhandover.demo", "Teacher123!");
  const jamesToken = await login("james.chen@eduhandover.demo", "Teacher123!");

  const students = await getDashboard(amyToken);
  const emma = students.find((s) => s.firstName === "Emma");
  assert.ok(emma, "expected Emma in Amy's roster");

  const created = await request(app)
    .post("/api/v1/handovers")
    .set("Authorization", `Bearer ${amyToken}`)
    .send({
      studentId: emma.id,
      academicYear: "2026-2027",
      learningStyles: ["visual"],
      focusTriggers: ["quietSpace"],
      behavioralTags: ["creativity"],
      status: "SUBMITTED",
    });
  assert.equal(created.status, 201);
  const handoverId = created.body.data.id as string;

  const james = await prisma.user.findUnique({ where: { email: "james.chen@eduhandover.demo" } });
  assert.ok(james);
  await prisma.handoverProfile.update({ where: { id: handoverId }, data: { receiverId: james.id } });

  const ack = await request(app)
    .post(`/api/v1/handovers/${handoverId}/acknowledge`)
    .set("Authorization", `Bearer ${jamesToken}`);
  assert.equal(ack.status, 403);
  assert.equal(ack.body.error.code, "ACKNOWLEDGE_LOCKED");

  await prisma.acknowledgmentLog.deleteMany({ where: { handoverId } });
  await prisma.handoverProfile.deleteMany({ where: { id: handoverId } });
});

test("new teacher can read the seeded profile with decrypted notes", async () => {
  const ninaToken = await login("nina.alvarado@eduhandover.demo", "Teacher123!");
  const students = await getDashboard(ninaToken);
  const maya = students.find((s) => s.firstName === "Maya");
  assert.ok(maya, "expected Maya in Nina's incoming roster");

  const view = await request(app)
    .get(`/api/v1/handovers/student/${maya.id}`)
    .set("Authorization", `Bearer ${ninaToken}`);
  assert.equal(view.status, 200);
  assert.ok(view.body.data.notes.includes("Maya works best"));
});

test("admin can see all school students; teacher dashboard is scoped", async () => {
  const adminToken = await login("admin@eduhandover.demo", "Admin123!");
  const amyToken = await login("amy.harding@eduhandover.demo", "Teacher123!");

  const adminStudents = await getDashboard(adminToken);
  const amyStudents = await getDashboard(amyToken);

  assert.ok(adminStudents.length >= amyStudents.length);
  assert.ok(amyStudents.some((s) => s.firstName === "Ava"));
});
