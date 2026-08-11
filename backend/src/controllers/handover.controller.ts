import type { Request, Response } from "express";
import { asyncHandler } from "../middleware/error.js";
import { param } from "../middleware/params.js";
import * as handoverService from "../services/handover.service.js";
import type { CreateHandoverInput, UpdateHandoverInput } from "../schemas/handover.schema.js";

export const createHandover = asyncHandler(async (req: Request, res: Response) => {
  const profile = await handoverService.createHandover(req.user!, req.body as CreateHandoverInput);
  res.status(201).json({ data: profile });
});

export const getMyHandoverForStudent = asyncHandler(async (req: Request, res: Response) => {
  const profile = await handoverService.getMyHandoverForStudent(req.user!, param(req, "studentId"));
  res.status(200).json({ data: profile });
});

export const getActiveHandoverForStudent = asyncHandler(async (req: Request, res: Response) => {
  const profile = await handoverService.getActiveHandoverForStudent(req.user!, param(req, "studentId"));
  res.status(200).json({ data: profile });
});

export const getHandover = asyncHandler(async (req: Request, res: Response) => {
  const profile = await handoverService.getHandover(req.user!, param(req, "handoverId"));
  res.status(200).json({ data: profile });
});

export const updateHandover = asyncHandler(async (req: Request, res: Response) => {
  const profile = await handoverService.updateHandover(
    req.user!,
    param(req, "handoverId"),
    req.body as UpdateHandoverInput
  );
  res.status(200).json({ data: profile });
});

export const acknowledge = asyncHandler(async (req: Request, res: Response) => {
  const profile = await handoverService.acknowledge(req.user!, param(req, "handoverId"));
  res.status(200).json({ data: profile });
});

export const listTags = asyncHandler(async (_req: Request, res: Response) => {
  const tags = await handoverService.listTagsGrouped();
  res.status(200).json({ data: tags });
});
