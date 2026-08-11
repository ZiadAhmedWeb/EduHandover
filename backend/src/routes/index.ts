import { Router } from "express";
import { rateLimit } from "express-rate-limit";
import authRoutes from "./auth.routes.js";
import adminRoutes from "./admin.routes.js";
import classesRoutes from "./classes.routes.js";
import studentsRoutes from "./students.routes.js";
import schoolsRoutes from "./schools.routes.js";
import tagsRoutes from "./tags.routes.js";
import handoversRoutes from "./handovers.routes.js";
import dashboardRoutes from "./dashboard.routes.js";
import leadsRoutes from "./leads.routes.js";

const router = Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 100,
  standardHeaders: true,
  legacyHeaders: false,
});

router.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok" });
});

router.use("/auth", authLimiter, authRoutes);
router.use("/admin", adminRoutes);
router.use("/classes", classesRoutes);
router.use("/students", studentsRoutes);
router.use("/schools", schoolsRoutes);
router.use("/tags", tagsRoutes);
router.use("/handovers", handoversRoutes);
router.use("/dashboard", dashboardRoutes);
router.use("/leads", leadsRoutes);

export default router;
