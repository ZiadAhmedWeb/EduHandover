import { createApp } from "./app.js";
import { env } from "./config/env.js";
import { prisma } from "./lib/prisma.js";

const app = createApp();

// Only listen on a port when running locally
if (process.env.NODE_ENV !== "production") {
  app.listen(env.PORT, () => {
    console.log(`EduHandover API listening on http://localhost:${env.PORT}`);
  });
}

async function shutdown() {
  await prisma.$disconnect();
  process.exit(0);
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

export default app;