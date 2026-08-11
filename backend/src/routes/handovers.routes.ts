import { Router } from "express";
import { authenticate } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { createHandoverSchema, updateHandoverSchema } from "../schemas/handover.schema.js";
import * as handoverController from "../controllers/handover.controller.js";

const router = Router();

router.post("/", authenticate, validate(createHandoverSchema), handoverController.createHandover);

router.get("/mine/student/:studentId", authenticate, handoverController.getMyHandoverForStudent);
router.get("/student/:studentId", authenticate, handoverController.getActiveHandoverForStudent);

router.get("/:handoverId", authenticate, handoverController.getHandover);
router.put("/:handoverId", authenticate, validate(updateHandoverSchema), handoverController.updateHandover);
router.post("/:handoverId/acknowledge", authenticate, handoverController.acknowledge);

export default router;
