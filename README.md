# EduHandover

Bridge every classroom transition. EduHandover captures structured student handovers from a teacher in a 3-minute wizard and hands the reviewing teacher a Day-1 dashboard with AES-256-encrypted profiles they can acknowledge in one tap.

**Monorepo**
- `frontend/` — React 19 + Vite + Tailwind CSS 4 + React Router 7 + TanStack Query
- `backend/` — Express 5 + Prisma 7 + PostgreSQL + TypeScript

---

## Features

| Area | Details |
|------|---------|
| Roles | `ADMIN`, `TEACHER` — school-scoped JWT + RBAC middleware; `PLATFORM_ADMIN` — platform-level, not bound to a school |
| Tenure gating | Handover **creation** unlocks after 6+ months at the school; teachers under 6 months **review & acknowledge** handovers |
| Wizard | 3-step guided handover: learning styles → focus triggers & strengths → notes |
| Encryption | Handover notes encrypted with AES-256-GCM (fresh IV per record) before storage |
| Day-1 dashboard | Reviewing teacher reviews profiles, filters by tag, acknowledges with audit log |
| Admin | Create classes, assign teachers, **invite teachers by email**, manage the student roster |
| Invitations | Admins invite teachers; each teacher activates their own password via a secure, expiring link |
| Landing | B2B marketing page with **demo-booking lead capture** (hero → stats → how-it-works → FAQ) |
| Demo requests | Platform admins review incoming leads on `/platform` and **accept / decline** them |

---

## Prerequisites

- **Node.js ≥ 20** (built against Node 24)
- **PostgreSQL ≥ 14** running locally

---

## Quick start

### 1. Create the database

```bash
# one-time, as your postgres superuser
psql -U postgres -h 127.0.0.1 -c "CREATE ROLE eduhandover WITH LOGIN PASSWORD 'eduhandover_dev_pw';"
psql -U postgres -h 127.0.0.1 -c "CREATE DATABASE eduhandover OWNER eduhandover;"
psql -U postgres -h 127.0.0.1 -c "ALTER ROLE eduhandover CREATEDB;"
```

> `CREATEDB` is needed so Prisma can create its shadow database for `migrate dev`.

### 2. Backend

```bash
cd backend
npm install                 # also runs `prisma generate`
cp .env.example .env        # then edit DATABASE_URL / JWT_SECRET / ENCRYPTION_KEY
npx prisma migrate dev      # create + apply migrations
npm run seed                # demo data + accounts
npm run dev                 # http://localhost:3001
```

### 3. Frontend

```bash
cd frontend
npm install
cp .env.example .env.local  # optional — proxy is configured for local dev
npm run dev                 # http://localhost:5173 (proxies /api → :3001)
```

Health check: `GET http://localhost:3001/api/v1/health` → `{ "status": "ok" }`

---

## Demo accounts (seeded)

| Role | Email | Password |
|------|-------|----------|
| Platform admin | `platform@eduhandover.demo` | `Platform123!` |
| Admin | `admin@eduhandover.demo` | `Admin123!` |
| Teacher (6+ months, creates handovers) | `amy.harding@eduhandover.demo` | `Teacher123!` |
| Teacher (6+ months) | `james.chen@eduhandover.demo` | `Teacher123!` |
| New teacher (< 6 months, reviews & acknowledges) | `nina.alvarado@eduhandover.demo` | `Teacher123!` |

Suggested flow: log in as **Amy** (senior teacher) → create a handover for a student without one → log in as **Nina** (new teacher) → review the incoming profile → **Acknowledge**. Admins land on `/admin` after login, invite teachers from the **Teachers** page, and create classes from **Overview**. Log in as **Platform admin** to review demo requests submitted via the landing page and **accept/decline** them from `/platform`.

---

## API overview

Base path: `/api/v1`. All authenticated routes expect `Authorization: Bearer <token>`.

| Method | Route | Roles | Purpose |
|--------|-------|-------|---------|
| `POST` | `/auth/login` | Public | Returns `{ accessToken, user }` |
| `POST` | `/auth/activate` | Public | Activate an invited account with its token + new password |
| `GET` | `/auth/me` | Any | Current user + school |
| `POST` | `/admin/teachers/invite` | Admin | Invite a teacher by email (returns an activation link; optionally assigns a class) |
| `POST` | `/leads` | Public | Capture a demo-booking lead from the landing page |
| `GET` | `/leads` | Platform admin | List all demo requests |
| `PATCH` | `/leads/:id` | Platform admin | Accept or decline a demo request (`{ "status": "ACCEPTED" \| "DECLINED" }`), recording the handler |
| `GET` | `/classes` | Teacher/Admin | Classes for me (teacher) or all (admin) |
| `GET` | `/classes/:classId/students` | Assigned | Roster with handover status |
| `POST` | `/classes` | Admin | Create class + assign teacher |
| `GET` | `/students/:studentId` | Any (school) | Single student |
| `POST` | `/students` | Admin | Add student to a class |
| `GET` | `/schools/me` | Any | School info + counts |
| `GET` | `/dashboard/teachers` | Any | Teacher list (for class assignment) |
| `GET` | `/dashboard/students` | Any | Scoped student feed with handover status (`?tag=` filter) |
| `GET` | `/tags` | Any | Preset tags grouped by category |
| `POST` | `/handovers` | Teacher | Create draft or submitted handover |
| `GET` | `/handovers/mine/student/:studentId` | Creator | Resume the creator's latest profile |
| `GET` | `/handovers/student/:studentId` | Involved | Active profile (notes decrypted) |
| `GET` | `/handovers/:handoverId` | Involved | Single profile (notes decrypted) |
| `PUT` | `/handovers/:handoverId` | Creator | Edit DRAFT only |
| `POST` | `/handovers/:handoverId/acknowledge` | New teacher (receiver)/Admin | Acknowledge + audit log |

Invited teachers are created with no usable password; login only succeeds after they activate via `/auth/activate`, which clears their token and sets their password.

Errors are uniform: `{ "error": { "code", "message", "details?" } }`.

---

## Tests

The backend uses Node's built-in test runner (`node:test`) + Supertest against a dedicated `eduhandover_test` database.

```bash
cd backend
npm test          # auto-applies migrations + reseeds the test DB, then runs tests
```

Tests cover: login + activation flow, lead capture + platform-admin accept/decline, RBAC (teacher blocked from admin routes, platform admin blocked from school routes), tenure gating (new teachers can't create handovers, senior teachers can't acknowledge), the full draft → submit → decrypt → acknowledge → double-acknowledge flow, invalid tags, and AES-256 round-trip integrity.

---

## Environment variables

| Variable | Required | Notes |
|----------|----------|-------|
| `DATABASE_URL` | Yes | `postgresql://user:pass@host:5432/db` |
| `JWT_SECRET` | Yes | Long random string (≥ 32 chars) |
| `ENCRYPTION_KEY` | Yes | Exactly 64 hex chars (32 bytes for AES-256). Generate: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` |
| `CORS_ORIGIN` | No | Frontend origin, default `http://localhost:5173` |
| `PORT` | No | Default `3001` |

Frontend: `VITE_API_URL` (optional in dev — the Vite proxy handles `/api`).

---

## Security notes

- Notes are AES-256-GCM encrypted **before** they reach the database; plaintext is only materialized for involved users.
- Accounts are created by **admin invitation only** — there is no public registration. Tokens expire after 72 hours.
- JWT in `sessionStorage` on the client (swap to httpOnly cookies for production).
- Helmet, strict CORS, rate-limited auth + lead routes, and Zod validation on every body.
- Never log decrypted notes.

---

## Project structure

```
.
├── backend/
│   ├── prisma/            # schema, migrations, seed
│   ├── scripts/           # test DB setup
│   ├── src/
│   │   ├── config/        # zod-validated env
│   │   ├── controllers/   # request/response glue
│   │   ├── lib/           # prisma client, AES crypto
│   │   ├── middleware/    # auth, rbac, validate, errors
│   │   ├── routes/        # /api/v1 routers
│   │   ├── schemas/       # zod schemas
│   │   └── services/      # business logic
│   └── test/              # integration tests
└── frontend/
    └── src/
        ├── api/           # axios client + types
        ├── components/    # layout, guards, UI primitives
        ├── context/       # auth + toast
        └── pages/         # landing, auth, admin, dashboard, wizard, profile
```
