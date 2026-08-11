import { test, after } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import { prisma } from "../src/lib/prisma.js";
import { app, login } from "./helpers.js";

const createdEmails: string[] = [];

async function cleanup() {
  if (createdEmails.length > 0) {
    const users = await prisma.user.findMany({
      where: { email: { in: createdEmails } },
      select: { id: true },
    });
    const ids = users.map((u) => u.id);
    if (ids.length > 0) {
      await prisma.class.deleteMany({ where: { teacherId: { in: ids } } });
      await prisma.user.deleteMany({ where: { id: { in: ids } } });
    }
  }
}

after(async () => {
  await cleanup();
});

test("health check returns ok", async () => {
  const res = await request(app).get("/api/v1/health");
  assert.equal(res.status, 200);
  assert.deepEqual(res.body, { status: "ok" });
});

test("public registration route is removed (404)", async () => {
  const res = await request(app).post("/api/v1/auth/register").send({
    email: `ghost-${Date.now()}@test.local`,
    password: "Password123!",
    firstName: "Ghost",
    lastName: "User",
    role: "TEACHER",
  });
  assert.equal(res.status, 404);
});

test("login rejects bad credentials", async () => {
  const res = await request(app)
    .post("/api/v1/auth/login")
    .send({ email: "admin@eduhandover.demo", password: "wrong-password" });
  assert.equal(res.status, 401);
});

test("/auth/me requires a token", async () => {
  const res = await request(app).get("/api/v1/auth/me");
  assert.equal(res.status, 401);
});

test("/auth/me returns the logged-in user", async () => {
  const token = await login("admin@eduhandover.demo", "Admin123!");
  const res = await request(app).get("/api/v1/auth/me").set("Authorization", `Bearer ${token}`);
  assert.equal(res.status, 200);
  assert.equal(res.body.data.email, "admin@eduhandover.demo");
});

test("teacher is blocked from admin-only POST /classes (403)", async () => {
  const token = await login("amy.harding@eduhandover.demo", "Teacher123!");
  const res = await request(app)
    .post("/api/v1/classes")
    .set("Authorization", `Bearer ${token}`)
    .send({ name: "Nope", academicYear: "2026-2027", teacherId: "00000000-0000-0000-0000-000000000000" });
  assert.equal(res.status, 403);
});

test("lead capture stores a demo request", async () => {
  const res = await request(app).post("/api/v1/leads").send({
    fullName: "Pat Principal",
    workEmail: "pat@school.edu",
    schoolName: "Evergreen District",
    studentCount: "500 - 1,000",
    message: "Interested in a March rollout.",
  });
  assert.equal(res.status, 201);
  assert.equal(res.body.data.workEmail, "pat@school.edu");
  assert.equal(res.body.data.studentCount, "500 - 1,000");

  await prisma.lead.deleteMany({ where: { workEmail: "pat@school.edu" } });
});

test("lead capture rejects invalid payloads", async () => {
  const res = await request(app).post("/api/v1/leads").send({ fullName: "", workEmail: "nope" });
  assert.equal(res.status, 400);
});

test("admin invites a teacher who activates and logs in", async () => {
  const adminToken = await login("admin@eduhandover.demo", "Admin123!");
  const email = `invite-${Date.now()}@test.local`;
  createdEmails.push(email);

  const invite = await request(app)
    .post("/api/v1/admin/teachers/invite")
    .set("Authorization", `Bearer ${adminToken}`)
    .send({ firstName: "Priya", lastName: "Nair", email, className: "Year 4 Alpha" });
  assert.equal(invite.status, 201);
  assert.equal(invite.body.data.role, "TEACHER");
  assert.ok(invite.body.data.activationLink, "response should include the activation link");

  const badActivate = await request(app).post("/api/v1/auth/activate").send({
    token: "not-a-real-token",
    password: "Teacher123!",
  });
  assert.equal(badActivate.status, 400);

  const token = invite.body.data.activationLink.split("token=")[1] as string;
  const before = await request(app).post("/api/v1/auth/login").send({ email, password: "Teacher123!" });
  assert.equal(before.status, 401, "invited teacher cannot log in before activation");

  const activate = await request(app).post("/api/v1/auth/activate").send({
    token,
    password: "Teacher123!",
  });
  assert.equal(activate.status, 200);
  assert.equal(activate.body.data.user.email, email);
  assert.ok(activate.body.data.accessToken);

  const afterLogin = await request(app).post("/api/v1/auth/login").send({ email, password: "Teacher123!" });
  assert.equal(afterLogin.status, 200);
  assert.equal(afterLogin.body.data.user.role, "TEACHER");

  const teacher = await prisma.user.findUnique({ where: { email } });
  assert.ok(teacher);
  assert.equal(teacher?.activationToken, null, "activation token should be cleared");
  assert.equal(teacher?.role, "TEACHER");
});

test("admin-invited teacher shows up in the teacher list", async () => {
  const adminToken = await login("admin@eduhandover.demo", "Admin123!");
  const email = `staff-${Date.now()}@test.local`;
  createdEmails.push(email);

  const invite = await request(app)
    .post("/api/v1/admin/teachers/invite")
    .set("Authorization", `Bearer ${adminToken}`)
    .send({ firstName: "Priya", lastName: "Nair", email });
  assert.equal(invite.status, 201);

  const list = await request(app)
    .get("/api/v1/dashboard/teachers")
    .set("Authorization", `Bearer ${adminToken}`);
  assert.equal(list.status, 200);
  assert.ok(list.body.data.some((t: { email: string }) => t.email === email));
});

test("teacher cannot invite other teachers (403)", async () => {
  const token = await login("amy.harding@eduhandover.demo", "Teacher123!");
  const res = await request(app)
    .post("/api/v1/admin/teachers/invite")
    .set("Authorization", `Bearer ${token}`)
    .send({ firstName: "Nope", lastName: "Nope", email: "nope@test.local" });
  assert.equal(res.status, 403);
});

test("invite requires a token (401)", async () => {
  const res = await request(app).post("/api/v1/admin/teachers/invite").send({
    firstName: "Nope",
    lastName: "Nope",
    email: "nope@test.local",
  });
  assert.equal(res.status, 401);
});

test("inviting a duplicate email is rejected (409)", async () => {
  const adminToken = await login("admin@eduhandover.demo", "Admin123!");
  const res = await request(app)
    .post("/api/v1/admin/teachers/invite")
    .set("Authorization", `Bearer ${adminToken}`)
    .send({ firstName: "Dup", lastName: "User", email: "amy.harding@eduhandover.demo" });
  assert.equal(res.status, 409);
});
