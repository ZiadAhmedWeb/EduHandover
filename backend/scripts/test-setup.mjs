import { execSync } from "node:child_process";
import fs from "node:fs";

const envFile = fs.readFileSync(".env.test", "utf8");
const match = envFile.match(/DATABASE_URL="([^"]+)"/);
if (!match) throw new Error("DATABASE_URL not found in .env.test");

process.env.DATABASE_URL = match[1];

console.log("Applying migrations to test database…");
execSync("npx prisma migrate deploy", { stdio: "inherit" });

console.log("Seeding test database…");
execSync("npx tsx --env-file=.env.test prisma/seed.ts", { stdio: "inherit" });

console.log("Test database ready.");
