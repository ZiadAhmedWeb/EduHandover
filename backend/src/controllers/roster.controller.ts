import type { Request, Response } from "express";
import { asyncHandler } from "../middleware/error.js";
import { param } from "../middleware/params.js";
import * as rosterService from "../services/roster.service.js";
import type { CreateClassInput, CreateStudentInput } from "../schemas/roster.schema.js";

export const listClasses = asyncHandler(async (req: Request, res: Response) => {
  const classes = await rosterService.listClassesForUser(req.user!);
  res.status(200).json({ data: classes });
});

export const listClassStudents = asyncHandler(async (req: Request, res: Response) => {
  const students = await rosterService.listClassStudents(req.user!, param(req, "classId"));
  res.status(200).json({ data: students });
});

export const createClass = asyncHandler(async (req: Request, res: Response) => {
  const cls = await rosterService.createClass(req.user!, req.body as CreateClassInput);
  res.status(201).json({ data: cls });
});

export const createStudent = asyncHandler(async (req: Request, res: Response) => {
  const student = await rosterService.createStudent(req.user!, req.body as CreateStudentInput);
  res.status(201).json({ data: student });
});

export const getStudent = asyncHandler(async (req: Request, res: Response) => {
  const student = await rosterService.getStudent(req.user!, param(req, "studentId"));
  res.status(200).json({ data: student });
});

export const schoolMe = asyncHandler(async (req: Request, res: Response) => {
  const school = await rosterService.getSchoolInfo(req.user!);
  res.status(200).json({ data: school });
});

export const listTeachers = asyncHandler(async (req: Request, res: Response) => {
  const teachers = await rosterService.listTeachers(req.user!);
  res.status(200).json({ data: teachers });
});

export const dashboardStudents = asyncHandler(async (req: Request, res: Response) => {
  const tag = typeof req.query.tag === "string" ? req.query.tag : undefined;
  const students = await rosterService.getDashboardStudents(req.user!, tag);
  res.status(200).json({ data: students });
});
