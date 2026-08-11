import { Router } from "express";
import { authenticate } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { loginSchema, activateSchema } from "../schemas/auth.schema.js";
import * as authController from "../controllers/auth.controller.js";

const router = Router();

router.post("/login", validate(loginSchema), authController.login);
router.post("/activate", validate(activateSchema), authController.activate);
router.get("/me", authenticate, authController.me);

export default router;
