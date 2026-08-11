import { test, after } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import { prisma } from "../src/lib/prisma.js";
import { app, login } from "./helpers.js";

const createdLeadEmails: string[] = [];

async function cleanup() {
  if (createdLeadEmails.length > 0) {
    await prisma.lead.deleteMany({ where: { workEmail: { in: createdLeadEmails } } });
  }
}

after(async () => {
  await cleanup();
});

test("platform admin can log in with no school binding", async () => {
  const res = await request(app)
    .post("/api/v1/auth/login")
    .send({ email: "platform@eduhandover.demo", password: "Platform123!" });
  assert.equal(res.status, 200);
  assert.equal(res.body.data.user.role, "PLATFORM_ADMIN");
  assert.equal(res.body.data.user.schoolId, null);
  assert.equal(res.body.data.user.school, null);

  const token = res.body.data.accessToken as string;
  const me = await request(app).get("/api/v1/auth/me").set("Authorization", `Bearer ${token}`);
  assert.equal(me.status, 200);
  assert.equal(me.body.data.role, "PLATFORM_ADMIN");
  assert.equal(me.body.data.schoolId, null);
});

test("platform admin can list demo requests", async () => {
  const token = await login("platform@eduhandover.demo", "Platform123!");
  const res = await request(app).get("/api/v1/leads").set("Authorization", `Bearer ${token}`);
  assert.equal(res.status, 200);
  assert.ok(Array.isArray(res.body.data));
  assert.ok(res.body.data.some((l: { status: string }) => l.status === "PENDING"));
});

test("platform admin accepts a demo request", async () => {
  const token = await login("platform@eduhandover.demo", "Platform123!");

  const created = await request(app).post("/api/v1/leads").send({
    fullName: "Dana Principal",
    workEmail: "dana@demo.local",
    schoolName: "Riverside District",
    studentCount: "Under 250",
  });
  assert.equal(created.status, 201);
  createdLeadEmails.push("dana@demo.local");
  const leadId = created.body.data.id as string;

  const accept = await request(app)
    .patch(`/api/v1/leads/${leadId}`)
    .set("Authorization", `Bearer ${token}`)
    .send({ status: "ACCEPTED" });
  assert.equal(accept.status, 200);
  assert.equal(accept.body.data.status, "ACCEPTED");
  assert.ok(accept.body.data.handledById, "handler should be recorded");
  assert.ok(accept.body.data.handledAt, "handledAt should be recorded");
  assert.equal(accept.body.data.handledBy.email, "platform@eduhandover.demo");

  const second = await request(app)
    .patch(`/api/v1/leads/${leadId}`)
    .set("Authorization", `Bearer ${token}`)
    .send({ status: "DECLINED" });
  assert.equal(second.status, 409, "an already-handled lead cannot be changed again");
});

test("platform admin can decline a demo request", async () => {
  const token = await login("platform@eduhandover.demo", "Platform123!");

  const created = await request(app).post("/api/v1/leads").send({
    fullName: "Eli Principal",
    workEmail: "eli@demo.local",
    schoolName: "Westbrook Academy",
    studentCount: "1,000+",
    message: "Just browsing for next year.",
  });
  assert.equal(created.status, 201);
  createdLeadEmails.push("eli@demo.local");
  const leadId = created.body.data.id as string;

  const decline = await request(app)
    .patch(`/api/v1/leads/${leadId}`)
    .set("Authorization", `Bearer ${token}`)
    .send({ status: "DECLINED" });
  assert.equal(decline.status, 200);
  assert.equal(decline.body.data.status, "DECLINED");
});

test("updating a missing lead returns 404", async () => {
  const token = await login("platform@eduhandover.demo", "Platform123!");
  const res = await request(app)
    .patch("/api/v1/leads/00000000-0000-0000-0000-000000000000")
    .set("Authorization", `Bearer ${token}`)
    .send({ status: "ACCEPTED" });
  assert.equal(res.status, 404);
});

test("school admin and teacher are blocked from lead management (403)", async () => {
  const adminToken = await login("admin@eduhandover.demo", "Admin123!");
  const teacherToken = await login("amy.harding@eduhandover.demo", "Teacher123!");

  for (const token of [adminToken, teacherToken]) {
    const list = await request(app).get("/api/v1/leads").set("Authorization", `Bearer ${token}`);
    assert.equal(list.status, 403);

    const patch = await request(app)
      .patch("/api/v1/leads/00000000-0000-0000-0000-000000000000")
      .set("Authorization", `Bearer ${token}`)
      .send({ status: "ACCEPTED" });
    assert.equal(patch.status, 403);
  }
});

test("anonymous users cannot list leads (401)", async () => {
  const res = await request(app).get("/api/v1/leads");
  assert.equal(res.status, 401);
});

test("platform admin is blocked from school-scoped routes (403)", async () => {
  const token = await login("platform@eduhandover.demo", "Platform123!");

  const schoolMe = await request(app).get("/api/v1/schools/me").set("Authorization", `Bearer ${token}`);
  assert.equal(schoolMe.status, 403);

  const dashboard = await request(app).get("/api/v1/dashboard/students").set("Authorization", `Bearer ${token}`);
  assert.equal(dashboard.status, 403);

  const teachers = await request(app).get("/api/v1/dashboard/teachers").set("Authorization", `Bearer ${token}`);
  assert.equal(teachers.status, 403);

  const createClass = await request(app)
    .post("/api/v1/classes")
    .set("Authorization", `Bearer ${token}`)
    .send({ name: "Nope", academicYear: "2026-2027", teacherId: "00000000-0000-0000-0000-000000000000" });
  assert.equal(createClass.status, 403);
});
