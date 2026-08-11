import { Router } from "express";
import { rateLimit } from "express-rate-limit";
import { authenticate } from "../middleware/auth.js";
import { requireRole } from "../middleware/rbac.js";
import { validate } from "../middleware/validate.js";
import { leadSchema, updateLeadStatusSchema } from "../schemas/lead.schema.js";
import * as leadController from "../controllers/lead.controller.js";

const router = Router();

const leadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
});

router.post("/", leadLimiter, validate(leadSchema), leadController.createLead);

router.use(authenticate, requireRole("PLATFORM_ADMIN"));
router.get("/", leadController.getLeads);
router.patch("/:id", validate(updateLeadStatusSchema), leadController.updateLead);

export default router;
