import type { Request, Response } from "express";
import { asyncHandler } from "../middleware/error.js";
import * as authService from "../services/auth.service.js";
import type { LoginInput, InviteTeacherInput, ActivateInput } from "../schemas/auth.schema.js";

export const login = asyncHandler(async (req: Request, res: Response) => {
  const input = req.body as LoginInput;
  const result = await authService.login(input);
  res.status(200).json({ data: result });
});

export const me = asyncHandler(async (req: Request, res: Response) => {
  const user = await authService.getMe(req.user!.userId);
  res.status(200).json({ data: user });
});

export const activate = asyncHandler(async (req: Request, res: Response) => {
  const input = req.body as ActivateInput;
  const result = await authService.activate(input);
  res.status(200).json({ data: result });
});

export const inviteTeacher = asyncHandler(async (req: Request, res: Response) => {
  const teacher = await authService.inviteTeacher(req.user!, req.body as InviteTeacherInput);
  res.status(201).json({ data: teacher });
});
