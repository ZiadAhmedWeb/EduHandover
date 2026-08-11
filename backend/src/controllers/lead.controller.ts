import type { Request, Response } from "express";
import { asyncHandler } from "../middleware/error.js";
import * as leadService from "../services/lead.service.js";
import type { LeadInput, UpdateLeadStatusInput } from "../schemas/lead.schema.js";

export const createLead = asyncHandler(async (req: Request, res: Response) => {
  const lead = await leadService.createLead(req.body as LeadInput);
  res.status(201).json({ data: lead });
});

export const getLeads = asyncHandler(async (_req: Request, res: Response) => {
  const leads = await leadService.listLeads();
  res.json({ data: leads });
});

export const updateLead = asyncHandler(async (req: Request, res: Response) => {
  const lead = await leadService.updateLeadStatus(req.user!, req.params.id as string, req.body as UpdateLeadStatusInput);
  res.json({ data: lead });
});
